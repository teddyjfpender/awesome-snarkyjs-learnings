import { Field, Experimental, PublicKey, Bool, Struct, MerkleMapWitness } from 'snarkyjs';
import { CredentialPresentation, Rule, SignedClaim, Claim } from '../DataModel';
import { stringToField } from '../util';

// WIP 🚧
class PrivateInputArgs extends Struct({
  claim: MerkleMapWitness,
  claimValue: Field,
  signedClaim: SignedClaim,
  credentialPresentation: CredentialPresentation
}) {
  constructor(claim: MerkleMapWitness, claimValue: Field, signedClaim: SignedClaim, credentialPresentation: CredentialPresentation) {
    super({claim, claimValue, signedClaim, credentialPresentation});
  }
}

class PublicInputArgs extends Struct({
  issuerPubKey: PublicKey,
  provingRule: Rule
}) {
  constructor(issuerPubKey: PublicKey, provingRule: Rule) {
    super({issuerPubKey, provingRule});
  }
}

// NOTE: This ZkProgram only works for one field on a claim
// TODO: make this work for multiple fields on a claim - use a merge function that takes 
// a proof as an input and proves something else about another field on the claim recursively -- rollup style
export const AttestCredentials = Experimental.ZkProgram({
  publicInput: PublicInputArgs,

  methods: {
    attest: {
      privateInputs: [MerkleMapWitness, Field, SignedClaim, CredentialPresentation],

      method(publicInputs: PublicInputArgs, claim: MerkleMapWitness, claimValue: Field, signedClaim: SignedClaim, credentialPresentation: CredentialPresentation) {
        credentialPresentation.signatureSubject.verify(
          publicInputs.issuerPubKey,
          signedClaim.claimRoot.toFields(),
        ).assertTrue();

        const [computedRoot, _] = claim.computeRootAndKey(claimValue);
        computedRoot.equals(signedClaim.claimRoot).assertTrue();

        let inferredValue: Bool | undefined;

        switch (publicInputs.provingRule.operation) {
          case stringToField('lt'):
            inferredValue = claimValue.lessThan(Field.from(publicInputs.provingRule.value));
            break;
          case stringToField('lte'):
            inferredValue = claimValue.lessThanOrEqual(Field.from(publicInputs.provingRule.value));
            break;
          case stringToField('eq'):
            inferredValue = claimValue.equals(Field.from(publicInputs.provingRule.value));
            break;
          case stringToField('gte'):
            inferredValue = claimValue.greaterThanOrEqual(Field.from(publicInputs.provingRule.value));
            break;
          case stringToField('gt'):
            inferredValue = claimValue.greaterThan(Field.from(publicInputs.provingRule.value));
            break;
        }

        inferredValue?.assertTrue();
      },
    },
  },
});