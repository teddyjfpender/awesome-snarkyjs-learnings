/*
 * This file specifies how to interact with the off-chain storage
 *
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

import { NumberTreeContract } from "./ZkApp/NumberTreeContract.js";
import * as OffChainStorage from "./OffChainStorage/offChainStorage.js";
import fs from 'fs';

import {
    Mina,
    PrivateKey,
    AccountUpdate,
    Field,
    Bool,
    PublicKey
  } from 'snarkyjs';

  import { generateFeePayerAndZkAppKeys, deployZkApp, updateTree } from './util/utils.js';
import XMLHttpRequst from 'xmlhttprequest-ts';
const NodeXMLHttpRequest = XMLHttpRequst.XMLHttpRequest as any as typeof XMLHttpRequest;

const useLocal = true;
const proofsEnabled = false;
// ----------------- 1. Define Parameters -----------------
const transactionFee = 100_000_000;

const treeHeight = 8;
let feePayerKey: PrivateKey;
let zkAppPrivateKey: PrivateKey;

// ----------------- 2. Create the zkApp -----------------
const partipantkeys = await generateFeePayerAndZkAppKeys(useLocal, proofsEnabled);

// ----------------- 3. Deploy Server -----------------
const storageServerAddress = 'http://localhost:3001';
console.log("set server states");
const initialStates = new Map<BigInt, [Field]>();

// ----------------- 2. Create the zkApp -----------------

const serverPublicKey = await OffChainStorage.getPublicKey(storageServerAddress, NodeXMLHttpRequest);

const zkApp = await deployZkApp(useLocal, partipantkeys.feePayerPrivateKey, partipantkeys.zkAppPrivateKey, serverPublicKey,);

// ----------------- 3. Mutate the smart contract state -----------------
 for (;;) {
  await updateTree(zkApp, useLocal, partipantkeys.feePayerPrivateKey, partipantkeys.zkAppPrivateKey, storageServerAddress, partipantkeys, treeHeight, transactionFee, NodeXMLHttpRequest);
 }

 process.exit(0);