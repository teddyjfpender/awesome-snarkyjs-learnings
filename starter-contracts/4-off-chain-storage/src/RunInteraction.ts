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
    Bool
  } from 'snarkyjs';

  import { makeAndSendTransaction, loopUntilAccountExists } from './util/utils.js';
import XMLHttpRequst from 'xmlhttprequest-ts';
const NodeXMLHttpRequest = XMLHttpRequst.XMLHttpRequest as any as typeof XMLHttpRequest;

const useLocal = true;
const proofsEnabled = false;
// ----------------- 1. Deploy the contract -----------------
const transactionFee = 100_000_000;

const treeHeight = 8;
let feePayerKey: PrivateKey;
let zkAppPrivateKey: PrivateKey;
if (useLocal) {
  const Local = Mina.LocalBlockchain({ proofsEnabled: proofsEnabled });
  Mina.setActiveInstance(Local);

  feePayerKey = Local.testAccounts[0].privateKey;
  zkAppPrivateKey = PrivateKey.random();
} else {
  const Berkeley = Mina.Network(
    'https://proxy.berkeley.minaexplorer.com/graphql'
  );
  Mina.setActiveInstance(Berkeley);

  const deployAlias = process.argv[2];

  const deployerKeyFileContents = fs.readFileSync(
    `keys/${deployAlias}.json`,
    'utf8'
  );

  const deployerPrivateKeyBase58 = JSON.parse(deployerKeyFileContents).privateKey;

  feePayerKey = PrivateKey.fromBase58(deployerPrivateKeyBase58);
  zkAppPrivateKey = feePayerKey;
}

const zkAppPublicKey = zkAppPrivateKey.toPublicKey();

// ----------------- 2. Create the zkApp -----------------
const storageServerAddress = 'http://localhost:3001';
const serverPublicKey = await OffChainStorage.getPublicKey(storageServerAddress, NodeXMLHttpRequest);

if (!useLocal){
  console.log('Compiling smart contract...');
  await NumberTreeContract.compile();
}

const zkApp = new NumberTreeContract(zkAppPublicKey);

if (useLocal) {
  const transaction = await Mina.transaction(feePayerKey.toPublicKey(), () => {
    AccountUpdate.fundNewAccount(feePayerKey.toPublicKey());
    zkApp.deploy({zkappKey: zkAppPrivateKey });
    zkApp.initState(serverPublicKey);
  });
  transaction.sign([zkAppPrivateKey, feePayerKey]);
  await transaction.prove();
  await transaction.send();
} else {
  let zkAppAccount = await loopUntilAccountExists({
    account: zkAppPrivateKey.toPublicKey(),
    eachTimeNotExist: () =>
      console.log('waiting for zkApp account to be deployed...'),
    isZkAppAccount: true,
  });  
  }

// ----------------- 3. Mutate the smart contract state -----------------
 const height = 8;

 async function updateTree() {
  const index = BigInt(Math.floor(Math.random() * 4));

  // get the existing tree
  const treeRoot = await zkApp.storageTreeRoot.get();
  const idx2fields = await OffChainStorage.get(
    storageServerAddress,
    zkAppPublicKey,
    treeHeight,
    treeRoot,
    NodeXMLHttpRequest
  );

  const tree = OffChainStorage.mapToTree(treeHeight, idx2fields);
  const leafWitness = new OffChainStorage.MerkleWitness8(tree.getWitness(BigInt(index)));

  // get the prior leaf
  const priorLeafIsEmpty = !idx2fields.has(index);
  let priorLeafNumber: Field;
  let newLeafNumber: Field;
  if (!priorLeafIsEmpty) {
    priorLeafNumber = idx2fields.get(index)![0];
    newLeafNumber = priorLeafNumber.add(3);
  } else {
    priorLeafNumber = Field(0);
    newLeafNumber = Field(1);
  }

  // update the leaf, and save it in the storage server
  idx2fields.set(index, [newLeafNumber]);

  const [storedNewStorageNumber, storedNewStorageSignature] = await OffChainStorage.requestStore(
    storageServerAddress,
    zkAppPublicKey,
    treeHeight,
    idx2fields,
    NodeXMLHttpRequest
  );

  console.log('changing index', index, 'from', priorLeafNumber.toString(), 'to', newLeafNumber.toString());

  // update the smart contract

  const doUpdate = () => {
    zkApp.update(
      Bool(priorLeafIsEmpty),
      priorLeafNumber,
      newLeafNumber,
      leafWitness,
      storedNewStorageNumber,
      storedNewStorageSignature
    );
  };

  if (useLocal) {
    const updateTransaction = await Mina.transaction(feePayerKey.toPublicKey(), doUpdate);

    updateTransaction.sign([zkAppPrivateKey, feePayerKey]);
    await updateTransaction.prove();
    await updateTransaction.send();
  } else {
    await makeAndSendTransaction({
      feePayerPrivateKey: feePayerKey,
      zkAppPublicKey: zkAppPublicKey,
      mutateZkApp: () => doUpdate(),
      transactionFee: transactionFee,
      getState: () => zkApp.storageTreeRoot.get(),
      statesEqual: (root1, root2) => root1.equals(root2).toBoolean(),
    });
  }
  console.log('root updated to', zkApp.storageTreeRoot.get().toString());
 }

 for (;;) {
  await updateTree();
 }

 process.exit(0);