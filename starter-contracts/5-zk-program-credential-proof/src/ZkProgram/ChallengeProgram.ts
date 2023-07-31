import { Field, Experimental, PublicKey } from 'snarkyjs';
import { CredentialVerificationPrivateInput } from './dataModel.js';

/**
 * The public key of the trusted issuer - this is hard coded here for testing purposes
 */
export const PublicKeyIssuer = PublicKey.fromBase58("B62qiqpgz7MgwZPNdkgG8bCZTgox9Ee9ef66ZU5R2o2cJm4k5m2WkRC");

export const ProveCredential = Experimental.ZkProgram({

  methods: {
    attest: {
      privateInputs: [CredentialVerificationPrivateInput], // credentials can be treated as private inputs
      method(privateInputs) {
        // assert the presentation is signed by the subject
        privateInputs.signatureSubject.verify(privateInputs.signedClaim.claim.Subject, privateInputs.signedClaim.signatureIssuer.toFields()).assertTrue();
        // assert the claim about the subject is true that the kyc is true, about the expected subject, and signed by the issuer - if kyc'd successfully expect Field(1)
        privateInputs.signedClaim.signatureIssuer.verify(PublicKeyIssuer, [Field(1)].concat(privateInputs.signedClaim.claim.Subject.toFields())).assertTrue();
      },
    },
  },
});

//export class Challenge extends Experimental.ZkProgram.Proof(ProveCredential) {}