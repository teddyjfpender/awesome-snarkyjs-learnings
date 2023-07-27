import { Field, Experimental, Struct, Signature, Bool, PublicKey, PrivateKey } from 'snarkyjs';

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
 * A basic proof made by the issuer about the subject
 */
export class CredentialPublicInput extends Struct({
    signedClaim: SignedClaim,
  }) {}

/**
 * The public key of the trusted issuer - this is hard coded here for testing purposes
 */
export const issuerPubKey = PublicKey.fromBase58("B62qiqpgz7MgwZPNdkgG8bCZTgox9Ee9ef66ZU5R2o2cJm4k5m2WkRC");
export const issuerPrvKey = PrivateKey.fromBase58("EKFEYnjhww3d8a29ZXdTnaJWH8X1Jou2gPNCBTmx752gknYm3Zpd");

export const subjectPubKey = PublicKey.fromBase58("B62qkPASqEBKyHkA5fSTJrGFBZXC4BjUEWHxyHh779VUAkv8N2AH6yM");
export const subjectPrvKey = PrivateKey.fromBase58("EKFPuVEZQwJs81TKtaK5qxTPS199C684fyrZmRVEGCD75TzrbTjy");

export const ProveIssuance = Experimental.ZkProgram({
  publicInput: CredentialPublicInput,

  methods: {
    init: {
      privateInputs: [], // credentials can be treated as private inputs
      method(publicInput: CredentialPublicInput) {
        // assert the CredentialPublicInput is signed by the trusted issuer and that claim is about the subject the kyc is true and about the expected subject
        publicInput.signedClaim.signatureIssuer.verify(issuerPubKey, [Field(1)].concat(subjectPubKey.toFields())).assertTrue();
      },
    },
  },
});

export class IssuanceProof extends Experimental.ZkProgram.Proof(ProveIssuance) {}