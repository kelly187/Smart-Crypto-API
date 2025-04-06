"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var web3_js_1 = require("@solana/web3.js");
var system_1 = require("@solana-program/system");
var compute_budget_1 = require("@solana-program/compute-budget");
var express_1 = require("express");
var dotenv_1 = require("dotenv");
dotenv_1.config({ path: '.././.env' });
//const d = process.env;
//console.log(d);
var app = (0, express_1)();
app.use(express_1.urlencoded({ extended: true }));
app.use(express_1.json());
app.post('/fund-sol', function (req, res) {
    var _a = req.body, recipientAddress = _a.recipientAddress, amount = _a.amount;
    // Validate user input
    if (!recipientAddress || !amount) {
        return res.status(400).send({ error: 'Invalid request' });
    }
    else {
        console.log("Funding ".concat(amount, " SOL to account ").concat(recipientAddress));
        var amounta = amount * 1000000000;
        var amounts = BigInt(amounta);
        console.log('Amount is ' + amounts + ' Lamports = ' + amount + ' SOL');
        console.log('Request received and Processing');
        sendTransaction(0, recipientAddress, amounts)
            .then(function () {
            console.log('End of Transaction');
            res.send('End of Transaction');
        });
    }
});
app.post('/transfer-sol', function (req, res) {
    var _a = req.body, privateKey = _a.privateKey, recipientAddress = _a.recipientAddress, amount = _a.amount;
    // Validate user input
    if (!privateKey || !recipientAddress || !amount) {
        return res.status(400).send({ error: 'Invalid request' });
    }
    else {
        console.log("Transfer ".concat(amount, " SOL to account ").concat(recipientAddress));
        var amounta = amount * 1000000000;
        var amounts = BigInt(amounta);
        console.log('Amount is ' + amounts + ' Lamports = ' + amounts + ' SOL');
        console.log('Transfer Request received and Processing');
        sendTransaction(privateKey, recipientAddress, amounts)
            .then(function () {
            console.log('End of Transaction');
            res.send('End of Transaction');
        });
    }
});
app.listen(3000, function () {
    console.log('Server started on port 3000');
});
function sendTransaction(privateKey, recipientAddress, amounts) {
    return __awaiter(this, void 0, void 0, function () {
        var destinationAddressTest, destinationAddress, secretKey, keyFromEnv, source, e_1, sourceKeypair, srcAddress, rpc_url, wss_url, rpc, rpcSubscriptions, sendAndConfirmTransaction, latestBlockhash, instruction, transactionMessage, signedTransaction, base64EncodedWireTransaction, responz, result, priorityFee, getComputeUnitEstimateForTransactionMessage, computeUnitsEstimate, finalLatestBlockhash, finalTransactionMessage, finalSignedTransaction, e_2, preflightErrorContext, preflightErrorMessage, errorDetailMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Sending transaction");
                    try {
                        destinationAddressTest = (0, web3_js_1.address)(recipientAddress);
                    }
                    catch (e) {
                        console.log("Error in parsing address " + e);
                        return [2 /*return*/];
                    }
                    destinationAddress = (0, web3_js_1.address)(recipientAddress);
                    console.log('Destination Adress: ' + destinationAddress);
                    if (privateKey == 0) {
                        keyFromEnv = process.env.PRIVATE_KEY;
                        if (!keyFromEnv) {
                            console.log("Missing PRIVATE_KEY in env");
                            return [2 /*return*/];
                        }
                        secretKey = new Uint8Array(JSON.parse(keyFromEnv)); //private key from env variables   
                    }
                    else {
                        try {
                            secretKey = new Uint8Array(JSON.parse(privateKey));
                        }
                        catch (e) {
                            console.log('Invalid Private key format' + e);
                            return [2 /*return*/];
                        }
                        ;
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, web3_js_1.createKeyPairSignerFromBytes)(secretKey)];
                case 2:
                    source = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    console.log('Invalid Private key ' + e_1);
                    return [2 /*return*/];
                case 4:
                    sourceKeypair = source;
                    srcAddress = sourceKeypair.address;
                    console.log("Source address: ", srcAddress);
                    rpc_url = process.env.RPC;
                    wss_url = process.env.WSS;
                    rpc = (0, web3_js_1.createSolanaRpc)(rpc_url);
                    rpcSubscriptions = (0, web3_js_1.createSolanaRpcSubscriptions)(wss_url);
                    sendAndConfirmTransaction = (0, web3_js_1.sendAndConfirmTransactionFactory)({
                        rpc: rpc,
                        rpcSubscriptions: rpcSubscriptions
                    });
                    return [4 /*yield*/, rpc.getLatestBlockhash({ commitment: 'confirmed' }).send()];
                case 5:
                    latestBlockhash = (_a.sent()).value;
                    instruction = (0, system_1.getTransferSolInstruction)({
                        amount: (0, web3_js_1.lamports)(amounts),
                        destination: destinationAddress,
                        source: sourceKeypair,
                    });
                    transactionMessage = (0, web3_js_1.pipe)((0, web3_js_1.createTransactionMessage)({ version: 0 }), function (tx) { return ((0, web3_js_1.setTransactionMessageFeePayer)(sourceKeypair.address, tx)); }, function (tx) { return ((0, web3_js_1.setTransactionMessageLifetimeUsingBlockhash)(latestBlockhash, tx)); }, function (tx) {
                        return (0, web3_js_1.appendTransactionMessageInstruction)(instruction, tx);
                    });
                    console.log("Transaction message created");
                    return [4 /*yield*/, (0, web3_js_1.signTransactionMessageWithSigners)(transactionMessage)];
                case 6:
                    signedTransaction = _a.sent();
                    console.log("Transaction signed");
                    base64EncodedWireTransaction = (0, web3_js_1.getBase64EncodedWireTransaction)(signedTransaction);
                    return [4 /*yield*/, fetch(process.env.RPCA, {
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
                        })];
                case 7:
                    responz = _a.sent();
                    return [4 /*yield*/, responz.json()];
                case 8:
                    result = _a.sent();
                    priorityFee = result.result.recommended;
                    console.log("Setting priority fee to ", priorityFee);
                    getComputeUnitEstimateForTransactionMessage = (0, web3_js_1.getComputeUnitEstimateForTransactionMessageFactory)({
                        rpc: rpc
                    });
                    return [4 /*yield*/, getComputeUnitEstimateForTransactionMessage(transactionMessage)];
                case 9:
                    computeUnitsEstimate = _a.sent();
                    computeUnitsEstimate = (computeUnitsEstimate < 1000) ? 1000 : Math.ceil(computeUnitsEstimate * 1.1);
                    console.log("Setting compute units to ", computeUnitsEstimate);
                    return [4 /*yield*/, rpc.getLatestBlockhash({ commitment: 'confirmed' }).send()];
                case 10:
                    finalLatestBlockhash = (_a.sent()).value;
                    finalTransactionMessage = (0, web3_js_1.appendTransactionMessageInstructions)([
                        (0, compute_budget_1.getSetComputeUnitPriceInstruction)({ microLamports: priorityFee }),
                        (0, compute_budget_1.getSetComputeUnitLimitInstruction)({ units: computeUnitsEstimate })
                    ], transactionMessage);
                    (0, web3_js_1.setTransactionMessageLifetimeUsingBlockhash)(finalLatestBlockhash, finalTransactionMessage);
                    return [4 /*yield*/, (0, web3_js_1.signTransactionMessageWithSigners)(finalTransactionMessage)];
                case 11:
                    finalSignedTransaction = _a.sent();
                    console.log("Rebuilded the transaction and signed it");
                    _a.label = 12;
                case 12:
                    _a.trys.push([12, 14, , 15]);
                    console.log("Sending and confirming transaction");
                    return [4 /*yield*/, sendAndConfirmTransaction(finalSignedTransaction, { commitment: 'confirmed', maxRetries: 0, skipPreflight: true })];
                case 13:
                    _a.sent();
                    console.log('Transfer confirmed: ', (0, web3_js_1.getSignatureFromTransaction)(finalSignedTransaction));
                    return [3 /*break*/, 15];
                case 14:
                    e_2 = _a.sent();
                    if ((0, web3_js_1.isSolanaError)(e_2, web3_js_1.SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE)) {
                        preflightErrorContext = e_2.context;
                        preflightErrorMessage = e_2.message;
                        errorDetailMessage = (0, system_1.isSystemError)(e_2.cause, finalTransactionMessage) ?
                            (0, system_1.getSystemErrorMessage)(e_2.cause.context.code) : e_2.cause ? e_2.cause.message : '';
                        console.error(preflightErrorContext, '%s: %s', preflightErrorMessage, errorDetailMessage);
                    }
                    else {
                        throw e_2;
                    }
                    return [3 /*break*/, 15];
                case 15: return [2 /*return*/];
            }
        });
    });
}
;
