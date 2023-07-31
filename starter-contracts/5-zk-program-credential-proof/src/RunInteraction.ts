/*
 * This file specifies how to test the `RecusiveCounterZkapp` smart contract. It is safe to delete this file and replace
 * with your own tests.
 *
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

import { Field, Mina, PrivateKey, verify } from "snarkyjs";
import { ProveCredential } from "./ZkProgram/ChallengeProgram.js";
import { constructCredential, constructPresentation  } from "./util/construction.js";
import { tic, toc } from "./util/tictoc.js";


let proofsEnabled = false; // Set proofsEnabled to true for testing
// use local blockchain for testing
const local = Mina.LocalBlockchain({ proofsEnabled });
Mina.setActiveInstance(local);
// create key pairs for test participants
const issuerPrvKey = PrivateKey.fromBase58("EKFEYnjhww3d8a29ZXdTnaJWH8X1Jou2gPNCBTmx752gknYm3Zpd");
const { privateKey: subjectPrvKey, publicKey: subjectPubKey } = local.testAccounts[1];

// compile the zkProgram (should be pre-compiled and caches in the future like Solidity ABI)
tic('compiling ProveCredential zkProgram');
const { verificationKey } = await ProveCredential.compile();
toc();

// issuer constructs a credential they can issue to a subject
const kycCredential = constructCredential(Field(1), subjectPubKey, issuerPrvKey);

// a subject can construct a presentation of the credential issued to them
const kycPresentation = constructPresentation(kycCredential, subjectPrvKey);

tic('making attestationProof');
// in this scenario the subject can use their wallet to 
const attestationProof = await ProveCredential.attest(kycPresentation);
toc();

tic('verifying attestationProof');
console.log("attestationProof Verification: ", await verify(attestationProof.toJSON(), verificationKey));
toc();

// TODO: handle attempted fraudulent presentation