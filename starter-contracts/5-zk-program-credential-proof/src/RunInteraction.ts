/*
 * This file specifies how to test the `RecusiveCounterZkapp` smart contract. It is safe to delete this file and replace
 * with your own tests.
 *
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

import { Field, Mina, PrivateKey, verify } from "snarkyjs";
import { ProveCredential } from "./ZkProgram/ChallengeProgram.js";
import { tic, toc } from "./util/tictoc.js";


let proofsEnabled = false; // Set proofsEnabled to true for testing

const local = Mina.LocalBlockchain({ proofsEnabled });
Mina.setActiveInstance(local);

const { privateKey: deployerKey, publicKey: deployerAccount } = local.testAccounts[0];
const { privateKey: userOneKey, publicKey: userOneAccount } = local.testAccounts[1];
const { privateKey: userTwoKey, publicKey: userTwoAccount } = local.testAccounts[2];
const zkAppPrivateKey = PrivateKey.random();
const zkAppAddress = zkAppPrivateKey.toPublicKey();

// compile the recursive addition zkProgram
tic('compiling RecursiveAddition zkProgram and zkApp');
const { verificationKey } = await ProveCredential.compile();
toc();
tic('making proof 0');

