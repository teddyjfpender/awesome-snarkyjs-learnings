/*
 * This file specifies how to interact with the off-chain storage
 *
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

import { NumberTreeContract } from "./ZkApp/NumberTreeContract.js";
import * as OffChainStorage from "./OffChainStorage/offChainStorage.js";
import fs from 'fs';

import {
    PrivateKey,
  } from 'snarkyjs';

  import { generateFeePayerAndZkAppKeys, deployZkApp, updateTree } from './util/utils.js';
import XMLHttpRequst from 'xmlhttprequest-ts';
const NodeXMLHttpRequest = XMLHttpRequst.XMLHttpRequest as any as typeof XMLHttpRequest;

const useLocal = true;
const proofsEnabled = false;
// ----------------- 1. Define Parameters -----------------
const transactionFee = 100_000_000;
const treeHeight = 8;
const storageServerAddress = 'http://localhost:3001';

// ----------------- 2. Create the zkApp -----------------
const partipantkeys = await generateFeePayerAndZkAppKeys(useLocal, proofsEnabled);

// ----------------- 3. Get the server's public key -----------------

const serverPublicKey = await OffChainStorage.getPublicKey(storageServerAddress, NodeXMLHttpRequest);

// ----------------- 4. Deploy the zkApp -----------------

const zkApp = await deployZkApp(useLocal, partipantkeys.feePayerPrivateKey, partipantkeys.zkAppPrivateKey, serverPublicKey,);

// ----------------- 5. Mutate the smart contract state! -----------------
 for (;;) {
  // this runs indefinitely, updating the tree
  await updateTree(zkApp, useLocal, partipantkeys.feePayerPrivateKey, partipantkeys.zkAppPrivateKey, storageServerAddress, partipantkeys, treeHeight, transactionFee, NodeXMLHttpRequest);
 }
