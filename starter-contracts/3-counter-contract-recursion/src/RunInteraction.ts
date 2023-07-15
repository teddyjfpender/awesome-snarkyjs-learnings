/*
 * This file specifies how to test the `RecusiveCounterZkapp` smart contract. It is safe to delete this file and replace
 * with your own tests.
 *
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

import { AccountUpdate, Field, Mina, PrivateKey } from "snarkyjs";
import { RecusiveCounterZkapp } from "./ZkApp/AddOneZkApp.js";
import { RecursiveAddOne, RecursiveAdditionPublicInput } from "./ZkProgram/RecursiveAddition.js";
import { tic, toc } from "./util/tictoc.js";


let proofsEnabled = false; // Set proofsEnabled to true for testing

const local = Mina.LocalBlockchain({ proofsEnabled });
Mina.setActiveInstance(local);

const { privateKey: deployerKey, publicKey: deployerAccount } = local.testAccounts[0];
const { privateKey: userOneKey, publicKey: userOneAccount } = local.testAccounts[1];
const { privateKey: userTwoKey, publicKey: userTwoAccount } = local.testAccounts[2];
const zkAppPrivateKey = PrivateKey.random();
const zkAppAddress = zkAppPrivateKey.toPublicKey();
const zkApp = new RecusiveCounterZkapp(zkAppAddress);

const deployTxn = await Mina.transaction(deployerAccount, () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    zkApp.deploy();
});
await deployTxn.prove();
await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();

const counter = zkApp.counter.get();
console.log("counter initialisation: ", counter);

const initialCounterValue = await zkApp.counter.get();
// compile the recursive addition zkProgram
tic('compiling RecursiveAddition zkProgram and zkApp');
await RecursiveAddOne.compile();
// compile the recursive counter zkApp after the zkProgram (as the zkApp depends on the zkProgram)
await RecusiveCounterZkapp.compile();
toc();
tic('executing base case');
// create initial public input
const initialPublicInput = new RecursiveAdditionPublicInput({ initialCounter: initialCounterValue, currentCounter: Field(0), totalIterations: Field(0) });
// create base case proof
let proof0 = await RecursiveAddOne.baseCase(initialPublicInput)
toc();
tic('executing first recursive addition');
const proof1 = await RecursiveAddOne.step(initialPublicInput, proof0);
toc();
tic('executing second recursive addition');
const proof2 = await RecursiveAddOne.step(initialPublicInput, proof1);
toc();

// post proof to the zkApp
const postProofTxn = await Mina.transaction(userOneAccount, () => {
    zkApp.settleState(proof2);
})
await postProofTxn.prove();
await postProofTxn.sign([userOneKey]).send();

// check that the counter has been updated
const counterAfterProof = await zkApp.counter.get();
console.log("counter after proof: ", counterAfterProof);
