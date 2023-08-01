import { Poseidon, PrivateKey } from "snarkyjs";
import { constructClaim, constructSignedClaim, constructPresentation, constructInferredClaim } from "../../src/util/construction";
import { claimToField, stringToField } from "../../src/util/conversion";
import { verifyPresentation } from "../../src/util/verification";
import { Rule } from "../../src/DataModel";

describe('Claims and SignedClaims', () => {

    it('can construct a claim', () => {
      const subjectPrvKey = PrivateKey.random();
      const subjectPublicKey = subjectPrvKey.toPublicKey();
      
      const claim = constructClaim({over18: "true", kyc: "passed", subject: subjectPublicKey});
      expect(claim).toBeTruthy();
      expect(claim.getField("over18")?.equals(stringToField("true")).toBoolean()).toBe(true);
      expect(claim.getField("kyc")?.equals(stringToField("passed")).toBoolean()).toBe(true);
      expect(claim.getField("subject")?.equals(Poseidon.hash(subjectPublicKey.toFields())).toBoolean()).toBe(true);
    });
  
    it('can construct a signed claim and validate the signature', () => {
      const subjectPrvKey = PrivateKey.random();
      const subjectPublicKey = subjectPrvKey.toPublicKey();
      // scenario: a subject expects a signed claim (i.e. a verified credential) from an issuer
      // that contains the claim that the subject is over 18 and has passed KYC
        
      const claim = constructClaim({over18: "true", kyc: "passed", subject: subjectPublicKey});
      const issuerPrvKey = PrivateKey.random();
      const issuerPubKey = issuerPrvKey.toPublicKey();
      const signedClaim = constructSignedClaim(claim, issuerPrvKey);
  
      // Verify the signature
      const isValid = signedClaim.signatureIssuer.verify(
        issuerPubKey,
        [signedClaim.claimRoot],
      ).toBoolean();
      
      expect(isValid).toBe(true);
    });
    
    it('does not validate the signature with wrong public key', () => {
      const subjectPrvKey = PrivateKey.random();
      const subjectPublicKey = subjectPrvKey.toPublicKey();
      // scenario: a subject expects a signed claim (i.e. a verified credential) from an issuer
      // that contains the claim that the subject is over 18 and has passed KYC
      // but they attempt to verify the signature with the wrong issuer's public key
      const claim = constructClaim({over18: "true", kyc: "passed", subject: subjectPublicKey});
      const issuerPrvKey = PrivateKey.random();
      const wrongIssuerPublicKey = PrivateKey.random().toPublicKey();
      const signedClaim = constructSignedClaim(claim, issuerPrvKey);
      // Verify the signature
      const isValid = signedClaim.signatureIssuer.verify(
        wrongIssuerPublicKey,
        [signedClaim.claimRoot], 
      ).toBoolean();
      
      expect(isValid).toBe(false);
    });
    it('verify claim is made about the correct subject', () => {
        // TODO: check if this is the correct way to do this
        // TODO 2: write a helper function to verify a certain key-value pair is included in the Merkle tree
        const subjectPrvKey = PrivateKey.random();
        const subjectPublicKey = subjectPrvKey.toPublicKey();
        // scenario: a subject expects a signed claim (i.e. a verified credential) from an issuer
        // that contains the claim that the subject is over 18 and has passed KYC
        const claim = constructClaim({over18: "true", kyc: "passed", subject: subjectPublicKey});
        const issuerPrvKey = PrivateKey.random();
        const signedClaim = constructSignedClaim(claim, issuerPrvKey);
        // Verify the signature
        const isValid = signedClaim.signatureIssuer.verify(
          issuerPrvKey.toPublicKey(),
          [signedClaim.claimRoot], 
        ).toBoolean();
        expect(isValid).toBe(true);
          // Verify the claim is about the correct subject by creating a merkle witness
        // and checking if it computes the same root when given the known value
        const subjectWitness = claim.getWitness("subject");
        const expectedValue = claimToField(subjectPublicKey); 
        const [computedRoot, _] = subjectWitness.computeRootAndKey(expectedValue);
        const isAboutCorrectSubject = computedRoot.equals(signedClaim.claimRoot).toBoolean();
        expect(isAboutCorrectSubject).toBe(true);
      });
      it('subject can create verifiable presentation with issued credential', () => { 
        const subjectPrvKey = PrivateKey.random();
        const subjectPublicKey = subjectPrvKey.toPublicKey();
        const claim = constructClaim({over18: "true", kyc: "passed", subject: subjectPublicKey});
        const issuerPrvKey = PrivateKey.random();
        const issuerPublicKey = issuerPrvKey.toPublicKey();
        const signedClaim = constructSignedClaim(claim, issuerPrvKey);
    
        const subjectPresentation = constructPresentation(signedClaim, subjectPrvKey);
    
        // Verify the presentation
        const allKeys = ["over18", "kyc", "subject"];
        const allValues = [claimToField("true"), claimToField("passed"), claimToField(subjectPublicKey)];

        // Select a random subset of keys and values to verify
        const numToSelect = Math.floor(Math.random() * allKeys.length) + 1;
        const indices: number[] = [];
        while (indices.length < numToSelect) {
            let idx = Math.floor(Math.random() * allKeys.length);
            if (!indices.includes(idx)) {
                indices.push(idx);
            }
        }

        const expectedKeys = indices.map(i => allKeys[i]);
        const expectedValues = indices.map(i => allValues[i]);
        // TODO: check if this is the correct way to do this
        // TODO: find out if there is a more concise way to do this
        const isVerified = verifyPresentation(
          subjectPresentation,
          issuerPublicKey,
          subjectPublicKey,
          claim,
          expectedKeys,
          expectedValues
        );
    
        expect(isVerified).toBe(true);
    });
    it('subject should make an inferred claim about a claim they have received from a trusted issuer', () => {
        // construct a claim that the subject is 18 years old
        const subjectPrvKey = PrivateKey.random();
        const subjectPublicKey = subjectPrvKey.toPublicKey();
        const claim = constructClaim({age: 18, subject: subjectPublicKey});
        // issuer keys
        const issuerPrvKey = PrivateKey.random();
        const issuerPublicKey = issuerPrvKey.toPublicKey();
        // construct a signed claim that the subject is 18 years old
        const signedClaim = constructSignedClaim(claim, issuerPrvKey);

        // construct an inferred claim that the subject is over 16 years old
        const rules: Rule[] = [
            {field: "age", operation: "gt", value: 16, inferredFieldName: "over16"}
        ]
        // TODO: change constructInferredClaim to take a ZkProgram, this creates
        // a proof that the inferred claim is true. It should take a the signed claim by the issuer etc.
        const inferredClaim = constructInferredClaim(claim, rules);

        // expect the inferred claim for the field "over16" to be true
        expect(inferredClaim.getField("over16")?.equals(claimToField("true")).toBoolean()).toBe(true);
    });
    // TODO: add test for W3C Verifiable Credentials Data Model 
  });