import { Field, PrivateKey, Signature, MerkleMap, Struct, MerkleMapWitness } from 'snarkyjs';
import { stringToField, claimToField } from '../util/conversion.js'; 
import { ClaimType } from './types.js';

/**
 * A claim is a MerkleMap of key-value pairs
 * where the key is a string and the value is a ClaimType
 */
export class Claim {
  private map: MerkleMap;

  constructor() {
    this.map = new MerkleMap();
  }

  addField(key: string, value: ClaimType) {
    this.map.set(stringToField(key), claimToField(value));
  }

  getField(key: string): Field | undefined {
    return this.map.get(stringToField(key));
  }

  getRoot(): Field {
    return this.map.getRoot();
  }

  getWitness(key: string): MerkleMapWitness {
    return this.map.getWitness(stringToField(key));
  }
}

// TODO: consider making a second claim class that a subject can construct from a signed claim & its original claim
// that can allow the subject to make claims about themselves that the issuer has not made specifically but can be inferred from the original claim
// e.g. if the issuer makes a claim that the subject is over 18, the subject can make a claim that they are over 16
// e.g.  if the issuer makes a claim that the subject is 21, the subject can make a claim that they are over 18

/**
 * A signed claim is a claim that has been signed by an issuer
 * the signature is a signature of the Claim root (where the Claim is a MerkleMap)
 */
export class SignedClaim extends Struct({
  claimRoot: Field,
  signatureIssuer: Signature
}) {
  constructor(claim: Claim, issuerPrvKey: PrivateKey) {
    const root = claim.getRoot();
    const signatureIssuer = Signature.create(issuerPrvKey, [root]);
    super({claimRoot: root, signatureIssuer});
  }
}

/**
 * A credential presentation that can be used as a private/public input for a ZkProgram
 * or as a data structure attesting to being the owner of a credential
 */
export class CredentialPresentation extends Struct({
  signedClaim: SignedClaim,
  signatureSubject: Signature,
}) {
  constructor(signedClaim: SignedClaim, subjectPrvKey: PrivateKey) {
    const root = signedClaim.claimRoot;
    const signatureIssuer = signedClaim.signatureIssuer;
    const signatureSubject = Signature.create(subjectPrvKey, signatureIssuer.toFields());
    super({signedClaim: signedClaim, signatureSubject: signatureSubject});
  }
}