/*
 * This file specifies how to test the `RecusiveCounterZkapp` smart contract. It is safe to delete this file and replace
 * with your own tests.
 *
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

import { Bool, Field, Mina, PrivateKey, verify, Signature, PublicKey } from "snarkyjs";
import { Claim, SignedClaim, CredentialVerificationPrivateInput, ProveCredential } from "./ZkProgram/ChallengeProgram.js";
import { tic, toc } from "./util/tictoc.js";


let proofsEnabled = false; // Set proofsEnabled to true for testing
// use local blockchain for testing
const local = Mina.LocalBlockchain({ proofsEnabled });
Mina.setActiveInstance(local);
// create key pairs for test participants
const issuerPrvKey = PrivateKey.fromBase58("EKFEYnjhww3d8a29ZXdTnaJWH8X1Jou2gPNCBTmx752gknYm3Zpd");
const issuerPubKey = PublicKey.fromBase58("B62qiqpgz7MgwZPNdkgG8bCZTgox9Ee9ef66ZU5R2o2cJm4k5m2WkRC");
const { privateKey: subjectPrvKey, publicKey: subjectPubKey } = local.testAccounts[1];


// issuer creates a claim
const claim = new Claim({
    kyc: Field(1), // 1 is true, 0 is false
    Subject: subjectPubKey,
});
// issuer signs the claim
const issuerSignedClaim = Signature.create(issuerPrvKey, [claim.kyc].concat(claim.Subject.toFields()));
// issuer creates credential to be issued to subject
const credential = new SignedClaim({
    claim: claim,
    signatureIssuer: issuerSignedClaim,
});
// make presentation by subject
const presentation = new CredentialVerificationPrivateInput({
    signedClaim: credential,
    signatureSubject: Signature.create(subjectPrvKey, credential.signatureIssuer.toFields()),
});

// compile the recursive addition zkProgram
tic('compiling ProveCredential zkProgram');
const { verificationKey } = await ProveCredential.compile();
toc();
tic('making proof 0');
const proof0Input = presentation
const proof0 = await ProveCredential.init(proof0Input);
console.log("Proof 0 Verification: ", await verify(proof0.toJSON(), verificationKey));
toc();

/**
 * Attempt to forge inputs to the zkProgram
 */
// currently failing
/*
// create an attempt to forge a credential
const claim2 = new Claim({
    kyc: Field(0), // 1 is true, 0 is false
    Subject: subjectPubKey,
});
// issuer signs the claim
const issuerSignedClaim2 = Signature.create(issuerPrvKey, [claim2.kyc].concat(claim2.Subject.toFields()));
// issuer creates credential to be issued to subject
const credential2 = new SignedClaim({
    claim: claim2,
    signatureIssuer: issuerSignedClaim2,
});
// make presentation by subject with different kyc value
const forgedClaim2 = new Claim({
    kyc: Field(1), // 1 is true, 0 is false
    Subject: subjectPubKey,
});
const forgedCredential2 = new SignedClaim({
    claim: forgedClaim2, // forged claim
    signatureIssuer: issuerSignedClaim2, // issuer signs the truthfully signed claim
});
const presentation2 = new CredentialVerificationPublicInput({
    signedClaim: forgedCredential2,
    signatureSubject: Signature.create(subjectPrvKey, forgedCredential2.signatureIssuer.toFields()),
});

// run presentation through zkProgram
tic('attempt to make a fradulent proof 1');
const proof1Input = presentation2
const proof1 = await ProveCredential.init(proof1Input);
console.log("Proof Verification: ", await verify(proof1.toJSON(), verificationKey)); // should give an output that is false
*/