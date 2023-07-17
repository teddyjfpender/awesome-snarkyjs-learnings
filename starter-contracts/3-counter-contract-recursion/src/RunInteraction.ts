/*
 * This file specifies how to test the `RecusiveCounterZkapp` smart contract. It is safe to delete this file and replace
 * with your own tests.
 *
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

import { AccountUpdate, Field, Mina, PrivateKey, verify } from "snarkyjs";
import { RecusiveCounterZkapp } from "./ZkApp/AddZkApp.js";
import { RecursiveAdd, RecursiveAdditionPublicInput, RecursiveAdditionPublicOutput } from "./ZkProgram/RecursiveAddition.js";
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
const { verificationKey } = await RecursiveAdd.compile();
// compile the recursive counter zkApp after the zkProgram (as the zkApp depends on the zkProgram)
await RecusiveCounterZkapp.compile();
toc();
tic('making proof 0');
const proof0Input = new RecursiveAdditionPublicInput({ number: initialCounterValue, numberToAdd: Field(0), newState: Field(0) })
const proof0 = await RecursiveAdd.init(proof0Input);
console.log("Proof 0 Verification: ", await verify(proof0.toJSON(), verificationKey));
console.log("Proof 0: ", proof0.toJSON());
toc();
tic('making proof 1');
const proof1Input = new RecursiveAdditionPublicInput({ number: initialCounterValue, numberToAdd: Field(11), newState: Field(11) })
const proof1 = await RecursiveAdd.addNumber(proof1Input, proof0);
console.log("Proof 1 Verification: ", await verify(proof1.toJSON(), verificationKey));
console.log("Proof 1: ", proof1.toJSON());
toc(); 
const ok = await verify(proof1.toJSON(), verificationKey);
console.log('ok', ok);

// post proof to the zkApp
const postProofTxn = await Mina.transaction(userOneAccount, () => {
    zkApp.settleState(proof1);
})
await postProofTxn.prove();
await postProofTxn.sign([userOneKey]).send();

// check that the counter has been updated
const counterAfterProof = await zkApp.counter.get();
console.log("counter after proof: ", counterAfterProof);
