import { Field, PrivateKey, Signature, MerkleMap, Struct } from 'snarkyjs';
import { stringToField } from '../util/conversion.js';  // Assuming that's where your function is

export class Claim {
  private map: MerkleMap;

  constructor() {
    this.map = new MerkleMap();
  }

  addField(key: string, value: string) {
    this.map.set(stringToField(key), stringToField(value));
  }

  getField(key: string): Field | undefined {
    return this.map.get(stringToField(key));
  }

  getRoot(): Field {
    return this.map.getRoot();
  }
}

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

export function constructClaim(claims: {[key: string]: string}): Claim {
  const claim = new Claim();
  for (const key in claims) {
    claim.addField(key, claims[key]);
  }
  return claim;
}

export function constructSignedClaim(claim: Claim, issuerPrvKey: PrivateKey): SignedClaim {
  return new SignedClaim(claim, issuerPrvKey);
}