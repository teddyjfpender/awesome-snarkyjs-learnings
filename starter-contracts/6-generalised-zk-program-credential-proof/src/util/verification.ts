import { Field, PublicKey } from "snarkyjs";
import { Claim, CredentialPresentation } from "../DataModel/dataModel";

/**
 * Verifies a CredentialPresentation by checking several aspects:
 * 1. If the claim in the presentation is signed by the expected trusted issuer.
 * 2. If the claim in the presentation is signed by the expected subject.
 * 3. If the claim root in the presentation matches the root of the claim.
 * 4. If the claim contains the expected fields by using Merkle witnesses.
 * 
 * @param subjectPresentation - The presentation to be verified.
 * @param issuerPublicKey - The public key of the trusted issuer.
 * @param subjectPublicKey - The public key of the subject.
 * @param claim - The claim.
 * @param expectedKeys - An array of expected keys in the claim.
 * @param expectedValues - An array of expected values in the claim. Each value corresponds to a key at the same index.
 * 
 * @returns True if the presentation is verified, false otherwise.
 */
export function verifyPresentation(
    subjectPresentation: CredentialPresentation,
    issuerPublicKey: PublicKey,
    subjectPublicKey: PublicKey,
    claim: Claim,
    expectedKeys: string[],
    expectedValues: Field[]
  ): boolean {
    // Verify the claim in the presentation is signed by the expected trusted issuer
    const verifiedPresentation = subjectPresentation.signedClaim.signatureIssuer.verify(
        issuerPublicKey,
        [subjectPresentation.signedClaim.claimRoot]
    ).toBoolean();
    if (!verifiedPresentation) return false;
  
    // Verify the claim in the presentation is signed by the expected subject
    const verifiedSubject = subjectPresentation.signatureSubject.verify(
        subjectPublicKey,
        subjectPresentation.signedClaim.signatureIssuer.toFields()
    ).toBoolean();
    if (!verifiedSubject) return false;
  
    // Expect the claim root in the presentation is the same as the claim root in the signed claim
    const rootsMatch = subjectPresentation.signedClaim.claimRoot.equals(claim.getRoot()).toBoolean();
    if (!rootsMatch) return false;
  
    // Verify the claim contains the expected fields using Merkle witnesses
    for(let i = 0; i < expectedKeys.length; i++) {
      const witness = claim.getWitness(expectedKeys[i]);
      const expectedValue = expectedValues[i];
      const [computedRoot, _] = witness.computeRootAndKey(expectedValue);
      const isValidClaim = computedRoot.equals(claim.getRoot()).toBoolean();
      if (!isValidClaim) return false;
    }
  
    return true;
  }
  