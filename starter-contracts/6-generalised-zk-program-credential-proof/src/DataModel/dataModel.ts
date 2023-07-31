import { Field, PrivateKey, Signature, MerkleMap, Struct, MerkleMapWitness } from 'snarkyjs';
import { stringToField, claimToField } from '../util/conversion.js';  // Assuming that's where your function is
import { ClaimType } from './types.js';

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

export class SignedClaim extends Struct({
  // only the root of the MerkleMap claim is signed
  claimRoot: Field,
  signatureIssuer: Signature
}) {
  constructor(claim: Claim, issuerPrvKey: PrivateKey) {
    const root = claim.getRoot();
    const signatureIssuer = Signature.create(issuerPrvKey, [root]);
    super({claimRoot: root, signatureIssuer});
  }
}

export function constructClaim(claims: {[key: string]: ClaimType}): Claim {
  const claim = new Claim();
  for (const key in claims) {
    claim.addField(key, claims[key]);
  }
  return claim;
}

export function constructSignedClaim(claim: Claim, issuerPrvKey: PrivateKey): SignedClaim {
  return new SignedClaim(claim, issuerPrvKey);
}