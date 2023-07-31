import { Field, Struct, Signature, Bool, PublicKey } from 'snarkyjs';

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
  
  