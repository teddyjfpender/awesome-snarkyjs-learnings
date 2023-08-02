import { Bool, Field, MerkleMapWitness } from "snarkyjs";
import { stringToField } from "./conversion";
import { PublicInputArgs } from "../ZkProgram";
import { CredentialPresentation, SignedClaim } from "../DataModel";

export function attest(publicInputs: PublicInputArgs, claim: MerkleMapWitness, claimValue: Field, signedClaim: SignedClaim, credentialPresentation: CredentialPresentation): void {
    
    // verify the claim is made by the expected issuer
    console.log("verifying signature of issuer")
    signedClaim.signatureIssuer.verify(
        publicInputs.issuerPubKey,
        [signedClaim.claimRoot],
      ).assertTrue();
    console.log("issuer signature verified")

    // verify the presentation is made by the expected subject
    credentialPresentation.signatureSubject.verify(
        publicInputs.subjectPubKey,
        signedClaim.signatureIssuer.toFields(),
      ).assertTrue();

    console.log("computing root")
      const [computedRoot, _] = claim.computeRootAndKey(claimValue);
    console.log("computed root: ", computedRoot)
    console.log("assert that computed root equals signed claim root")
      computedRoot.equals(signedClaim.claimRoot).assertTrue();
    console.log("computed root equals signed claim root")

      let inferredValue: Bool | undefined;
      // assumption is the claimValue is Field representation of a number (e.g. if the claim is "age" and age is 18 then the claimValue is Field(18))
      // this should allow to perform comparisons on the claimValue
      // this should also work for checking if a string is equivalent to another string
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
      console.log("inferredValue: ", inferredValue)
      console.log("asserting turthy", inferredValue?.toBoolean())
      inferredValue?.assertTrue();
  }
  