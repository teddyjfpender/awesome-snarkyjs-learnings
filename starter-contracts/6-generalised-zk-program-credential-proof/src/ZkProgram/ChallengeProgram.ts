import { Field, Experimental, PublicKey, Bool, Struct, MerkleMapWitness } from 'snarkyjs';
import { CredentialPresentation, ProvingRules, SignedClaim, Claim } from '../DataModel';

// WIP 🚧
class privateInputArgs extends Struct({
  claims: Array(MerkleMapWitness),
  claimsValues: Array(Field),
  claimsKeys: Array(Field),
  signedClaim: SignedClaim,
  credentialPresentation: CredentialPresentation
}) {
  constructor(claims: Array<MerkleMapWitness>, claimsValues: Array<Field>, claimsKeys: Array<Field>, signedClaim: SignedClaim, credentialPresentation: CredentialPresentation) {
    super({claims: claims, claimsValues: claimsValues, claimsKeys: claimsKeys, signedClaim: signedClaim, credentialPresentation: credentialPresentation});
  }
}

class publicInputArgs extends Struct({
  issuerPubKey: PublicKey,
  provingRules: ProvingRules
}) {
  constructor(issuerPubKey: PublicKey, provingRules: ProvingRules) {
    super({issuerPubKey: issuerPubKey, provingRules: provingRules});
  }
}

export const AttestCredentials = Experimental.ZkProgram({
  privateInputs: privateInputArgs,
  publicInputs: publicInputArgs,
  methods: {
    attest: {
      privateInputs: [privateInputArgs],
      publicInputs: [publicInputArgs],
      method(privateInputs, publicInputs: publicInputArgs) {
        // assert the original claim and inferred claim are signed by the subject
        privateInputs.credentialPresentation.signatureSubject.verify(
          publicInputs.issuerPubKey,
          privateInputs.signedClaim.claimRoot.toFields(),
        ).assertTrue();

        // assert the inferred claim is correctly derived from the original claim based on the rules
        for (const [index, rule] of publicInputs.provingRules.rules.entries()) {
          // Get the MerkleMapWitness for the current claim
          const claimWitness = privateInputs.claims[index];
          const claimValue = privateInputs.claimsValues[index];
        
          // Compute the root of the MerkleMap with the claim
          const [computedRoot, _] = claimWitness.computeRootAndKey(claimValue);

          // Assert that the computed root is equal to the root in the SignedClaim
          computedRoot.equals(privateInputs.signedClaim.claimRoot).assertTrue();

          // Now continue with your operation checks...
          // You now have access to the actual value of the claim
          let inferredValue: Bool | undefined;

          switch (rule.operation) {
            case 'lt':
              inferredValue = claimValue.lessThan(Field.from(rule.value));
              break;
            case 'lte':
              inferredValue = claimValue.lessThanOrEqual(Field.from(rule.value));
              break;
            case 'eq':
              inferredValue = claimValue.equals(Field.from(rule.value));
              break;
            case 'gte':
              inferredValue = claimValue.greaterThanOrEqual(Field.from(rule.value));
              break;
            case 'gt':
              inferredValue = claimValue.greaterThan(Field.from(rule.value));
              break;
          }
          // we want to assert that the inferred value is true
          inferredValue?.assertTrue();
        }
      },
    },
  },
});
