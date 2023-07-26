import { Field, Experimental, Struct, Signature, Bool, PublicKey, SelfProof } from 'snarkyjs';

/**
 * A basic claim about a subject made by an issuer
 * Says whether the subject has passed KYC
 */
export class Claim extends Struct({
  kyc: Field,
  Subject: PublicKey,
}) {}

export class SignedClaim extends Struct({
  claim: Claim,
  signatureIssuer: Signature
}) {}

/**
 * A basic proof that by the subject about the claim
 */
export class CredentialVerificationPrivateInput extends Struct({
    signedClaim: SignedClaim,
    signatureSubject: Signature,
  }) {}

/**
 * A basic output of the zkProgram attesting to the validity of the presentation
 */
export class CredentialVerificationPublicOutput extends Struct({
    verified: Bool,
  }) {}

/**
 * The public key of the trusted issuer - this is hard coded here for testing purposes
 */
export const PublicKeyIssuer = PublicKey.fromBase58("B62qiqpgz7MgwZPNdkgG8bCZTgox9Ee9ef66ZU5R2o2cJm4k5m2WkRC");

export const ProveCredential = Experimental.ZkProgram({

  methods: {
    init: {
      privateInputs: [CredentialVerificationPrivateInput], // credentials can be treated as private inputs
      method(privateInputs) {
        // assert the presentation is signed by the subject
        privateInputs.signatureSubject.verify(privateInputs.signedClaim.claim.Subject, privateInputs.signedClaim.signatureIssuer.toFields()).assertTrue();
        // assert the claim about the subject is true that the kyc is true, about the expected subject, and signed by the issuer - if kyc'd successfully expect Field(1)
        privateInputs.signedClaim.signatureIssuer.verify(PublicKeyIssuer, [Field(1)].concat(privateInputs.signedClaim.claim.Subject.toFields())).assertTrue();
        // TODO: return a public output 
      },
    },
  },
});

//export class Challenge extends Experimental.ZkProgram.Proof(ProveCredential) {}