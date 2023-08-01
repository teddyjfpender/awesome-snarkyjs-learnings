import { Poseidon, PrivateKey } from "snarkyjs";
import { constructClaim, constructSignedClaim, constructPresentation } from "../../src/util/construction";
import { claimToField, stringToField } from "../../src/util/conversion";

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
    
        // Verify the claim in the presentation is signed by the expected trusted issuer
        const verifiedPresentation = subjectPresentation.signedClaim.signatureIssuer.verify(
            issuerPublicKey,
            [subjectPresentation.signedClaim.claimRoot]
        ).toBoolean();
        expect(verifiedPresentation).toBe(true);
    
        // Verify the claim in the presentation is signed by the expected subject
        const verifiedSubject = subjectPresentation.signatureSubject.verify(
            subjectPublicKey,
            subjectPresentation.signedClaim.signatureIssuer.toFields()
        ).toBoolean();
        expect(verifiedSubject).toBe(true);
    
        // Expect the claim root in the presentation is the same as the claim root in the signed claim
        const rootsMatch = subjectPresentation.signedClaim.claimRoot.equals(claim.getRoot()).toBoolean();
        expect(rootsMatch).toBe(true);
    
        // Verify the claim contains the expected fields using Merkle witnesses
        const keys = ["over18", "kyc", "subject"];
        const expectedValues = [claimToField("true"), claimToField("passed"), claimToField(subjectPublicKey)];
        for(let i = 0; i < keys.length; i++) {
            const witness = claim.getWitness(keys[i]);
            const expectedValue = expectedValues[i];
            const [computedRoot, _] = witness.computeRootAndKey(expectedValue);
            const isValidClaim = computedRoot.equals(claim.getRoot()).toBoolean();
            expect(isValidClaim).toBe(true);
        }
    });
  });