import 'dotenv/config';
import {
  address,
  appendTransactionMessageInstruction,
  appendTransactionMessageInstructions,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  getBase58Encoder,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  getSignatureFromTransaction,
  isSolanaError,
  lamports,
  pipe,
  sendAndConfirmTransactionFactory,
  getBase64EncodedWireTransaction,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  getComputeUnitEstimateForTransactionMessageFactory,
  SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE,
  createKeyPairSignerFromPrivateKeyBytes,
  // SystemProgram,
} from '@solana/web3.js';
import { getSystemErrorMessage, getTransferSolInstruction, isSystemError } from '@solana-program/system';
import { getSetComputeUnitLimitInstruction, getSetComputeUnitPriceInstruction } from '@solana-program/compute-budget';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config({ path: '.././.env' });
//const d = process.env;

//console.log(d);

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

interface Request{
    body: {
        recipientAddress: string;
        amount: any;
        privateKey: string | number;
    };    
}

interface Response{
    send: (message: string) => void;    
    status: number;
}

app.post('/fund-sol', (req: Request, res: Response) => {
  const { recipientAddress, amount } = req.body;
  
  // Validate user input
  if (!recipientAddress || !amount) {
      return res.status(400).send({ error: 'Invalid request' });
  } else {
      console.log(`Funding ${amount} SOL to account ${recipientAddress}`);
      const amounta = amount * 1000000000;
      const amounts:bigint = BigInt(amounta) ;
      console.log('Amount is ' + amounts + ' Lamports = ' + amount + ' SOL');
      console.log('Request received and Processing');

      sendTransaction(0, recipientAddress, amounts)
          .then(() => {
              console.log('End of Transaction');
              res.send('End of Transaction');
          });
  }
});

app.post('/transfer-sol', (req: Request, res: Response) => {
  const { privateKey, recipientAddress, amount } = req.body;

  // Validate user input
  if (!privateKey || !recipientAddress || !amount) {
      return res.status(400).send({ error: 'Invalid request' });
  } else {
      console.log(`Transfer ${amount} SOL to account ${recipientAddress}`);
      const amounta = amount * 1000000000;
      const amounts:bigint = BigInt(amounta) ;
      console.log('Amount is ' + amounts + ' Lamports = ' + amounts + ' SOL');
      console.log('Transfer Request received and Processing');

      sendTransaction(privateKey, recipientAddress, amounts)
          .then(() => {
              console.log('End of Transaction');
              res.send('End of Transaction');
          });
  }
});


app.listen(3000, () => {
  console.log('Server started on port 3000');
})

async function sendTransaction(privateKey: string | number, recipientAddress: string, amounts: bigint) {
  console.log("Sending transaction");

  try {
      const destinationAddressTest = address(recipientAddress);
  } catch (e) {
      console.log("Error in parsing address " + e);
      return;
  }

  const destinationAddress = address(recipientAddress);
  console.log('Destination Adress: ' + destinationAddress)

  let secretKey: Uint8Array;

  if (privateKey == 0) {
      var keyFromEnv = process.env.PRIVATE_KEY;
      if (!keyFromEnv) {
          console.log("Missing PRIVATE_KEY in env");
          return;
      }
      secretKey = new Uint8Array(JSON.parse(keyFromEnv)); //private key from env variables   
  } else {
      try {
          secretKey = new Uint8Array(JSON.parse(privateKey as string));
      } catch (e) {
          console.log('Invalid Private key format' + e)
          return;
      };
  }

  try {
      var source = await createKeyPairSignerFromBytes(secretKey);
  } catch (e) {
      console.log('Invalid Private key ' + e);
      return;
  }

  const sourceKeypair = source;
  const srcAddress = sourceKeypair.address;
  console.log("Source address: ", srcAddress);

  const rpc_url = process.env.RPC!; //custom rpc url from env variable, devnet or mainnet
  const wss_url = process.env.WSS!; //custom wss url from env variable, devnet or mainnet

  const rpc = createSolanaRpc(rpc_url);
  const rpcSubscriptions = createSolanaRpcSubscriptions(wss_url);

  const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
      rpc,
      rpcSubscriptions
  });

  /**
   * STEP 1: CREATE THE TRANSFER TRANSACTION
   */
  const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'confirmed' }).send();

  const instruction = getTransferSolInstruction({
      amount: lamports(amounts),
      destination: destinationAddress,
      source: sourceKeypair,
  });

  const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      tx => (
          setTransactionMessageFeePayer(sourceKeypair.address, tx)
      ),
      tx => (
          setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx)
      ),
      tx =>
          appendTransactionMessageInstruction(
              instruction,
              tx,
          ),
  );
  console.log("Transaction message created");

  /**
   * STEP 2: SIGN THE TRANSACTION
   */

  const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
  console.log("Transaction signed");

  /**
   * STEP 3: GET PRIORITY FEE FROM SIGNED TRANSACTION
   */

  const base64EncodedWireTransaction = getBase64EncodedWireTransaction(signedTransaction);

  const responz = await fetch(process.env.RPCA!, {   //custom rpc url from env variable for getting compute units only , MUST BE MAINNET URL EVEN IF YOU ARE WORKING IN DEVNET    
      method: "POST",
      headers: {
          "Content-Type": "application/json"
      },
      body: JSON.stringify({
          "jsonrpc": "2.0",
          "id": 1,
          "method": "qn_estimatePriorityFees",
          "params": {
              "last_n_blocks": 100,
              "account": srcAddress,
              "api_version": 2
          }
      })
  });

  const result = await responz.json();
  const priorityFee = result.result.recommended;
  console.log("Setting priority fee to ", priorityFee);

  /** 
   * STEP 4: OPTIMIZE COMPUTE UNITS
   */
  const getComputeUnitEstimateForTransactionMessage = getComputeUnitEstimateForTransactionMessageFactory({
      rpc
  });

  // Request an estimate of the actual compute units this message will consume.
  let computeUnitsEstimate = await getComputeUnitEstimateForTransactionMessage(transactionMessage);
  computeUnitsEstimate = (computeUnitsEstimate < 1000) ? 1000 : Math.ceil(computeUnitsEstimate * 1.1);
  console.log("Setting compute units to ", computeUnitsEstimate);

  /**
   * STEP 5: REBUILD AND SIGN FINAL TRANSACTION
   */
  const { value: finalLatestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'confirmed' }).send();

  const finalTransactionMessage = appendTransactionMessageInstructions(
      [
          getSetComputeUnitPriceInstruction({ microLamports: priorityFee }),
          getSetComputeUnitLimitInstruction({ units: computeUnitsEstimate })
      ],
      transactionMessage,
  );

  setTransactionMessageLifetimeUsingBlockhash(finalLatestBlockhash, finalTransactionMessage);

  const finalSignedTransaction = await signTransactionMessageWithSigners(finalTransactionMessage);
  console.log("Rebuilded the transaction and signed it");

  /**
   * STEP 6: SEND AND CONFIRM THE FINAL TRANSACTION
   */
  try {
      console.log("Sending and confirming transaction");
      await sendAndConfirmTransaction(finalSignedTransaction, { commitment: 'confirmed', maxRetries: 0, skipPreflight: true });
      console.log('Transfer confirmed: ', getSignatureFromTransaction(finalSignedTransaction));
  } catch (e: any) {
      if (isSolanaError(e, SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE)) {
          const preflightErrorContext = e.context;
          const preflightErrorMessage = e.message;
          const errorDetailMessage = isSystemError(e.cause, finalTransactionMessage) ?
              getSystemErrorMessage(e.cause.context.code) : e.cause ? e.cause.message : '';
          console.error(preflightErrorContext, '%s: %s', preflightErrorMessage, errorDetailMessage);
      } else {
          throw e;
      }
  }
};
