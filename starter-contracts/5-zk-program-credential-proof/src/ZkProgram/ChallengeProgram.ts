import { Field, Experimental, Struct, Signature, Bool, PublicKey } from 'snarkyjs';

/**
 * A basic claim about a subject made by an issuer
 * Says whether the subject has passed KYC
 */
export class Claim extends Struct({
  kyc: Bool,
  Subject: PublicKey,
  signatureIssuer: Signature
}) {}

/**
 * A basic proof that by the subject about the claim
 */
export class CredentialVerificationPublicInput extends Struct({
    claim: Claim,
    signatureSubject: Signature,
  }) {}

/**
 * A basic output of the zkProgram attesting to the validity of the presentation
 */
export class CredentialVerificationPublicOutput extends Struct({
    verified: Bool,
  }) {}

/**
 * The public key of the trusted issuer
 */
export const PublicKeyIssuer: PublicKey = "B62qjsV6WQwTeEWrNrRRBP6VaaLvQhwWTnFi4WP4LQjGvpfZEumXzxb" as unknown as PublicKey;

export const ProveCredential = Experimental.ZkProgram({
  publicInput: CredentialVerificationPublicInput,
  publicOutput: CredentialVerificationPublicOutput,

  methods: {
    init: {
      privateInputs: [],

      method(publicInput: CredentialVerificationPublicInput): CredentialVerificationPublicOutput {
        // assert the claim is signed by the correct, known, public key or a public key in a set of possible signers
        // this takes the public key of the expected issuer and the signed message which is of type Feild[]
        // We want to verify that the the claim is signed by the issuer and that the claim about `kyc` is true
        publicInput.claim.signatureIssuer.verify(PublicKeyIssuer, [publicInput.claim.kyc.toField()]);
        // assert the claim is signed by the subject
        publicInput.signatureSubject.verify(publicInput.claim.Subject, [/*signed claim data*/]);
        // assert the kyc field is true
        publicInput.claim.kyc.assertEquals(Bool(true));
        // return a public output that is true if the claim is valid and false otherwise
        return new CredentialVerificationPublicOutput({ verified: Bool(true) });
      },
    },
  },
});

//export class Challenge extends Experimental.ZkProgram.Proof(ProveCredential) {}