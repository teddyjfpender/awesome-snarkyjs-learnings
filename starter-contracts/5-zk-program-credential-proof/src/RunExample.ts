
import { Field, Mina, PrivateKey, verify, Signature, Proof } from "snarkyjs";
import Client from 'mina-signer'
import { Claim, SignedClaim, CredentialPublicInput, ProveIssuance, issuerPrvKey, issuerPubKey, subjectPrvKey, subjectPubKey } from "./ZkProgram/KYCProgram.js";
import { tic, toc } from "./util/tictoc.js";

// issuer creates a claim
const claim = new Claim({
    kyc: Field(1), // 1 is true, 0 is false
    Subject: subjectPubKey,
});
// issuer signs the claim
const issuerSignedClaim = Signature.create(issuerPrvKey, [claim.kyc].concat(claim.Subject.toFields()));
// issuer creates credential to be issued to subject
const signedClaim = new SignedClaim({
    claim: claim,
    signatureIssuer: issuerSignedClaim,
});
// make presentation by subject
const credentials = new CredentialPublicInput({
    signedClaim: signedClaim,
});

// compile the recursive addition zkProgram
tic('compiling ProveIssuance zkProgram');
const { verificationKey } = await ProveIssuance.compile();
toc();
tic('making proof 0');
const proof0 = await ProveIssuance.init(credentials);
console.log("Proof 0 Verification: ", await verify(proof0.toJSON(), verificationKey));
toc();

// Subject signs proof using mina-signer
const client = new Client({network: 'testnet'});
const subjectSignedProof = await client.signMessage(subjectPrvKey.toBase58(), proof0.toJSON().proof);
// Verify the signature is of the expected proof