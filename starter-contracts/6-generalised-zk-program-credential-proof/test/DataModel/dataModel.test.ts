import { Poseidon, PrivateKey } from "snarkyjs";
import { constructClaim, constructSignedClaim } from "../../src/DataModel/dataModel";
import { claimToField, stringToField } from "../../src/util/conversion";

describe('Claims and SignedClaims', () => {

    it('can construct a claim', () => {
      const subjectPrvKey = PrivateKey.random();
      const subjectPublicKey = subjectPrvKey.toPublicKey().toFields();
      
      const claim = constructClaim({over18: "true", kyc: "passed", subject: subjectPublicKey});
      expect(claim).toBeTruthy();
      expect(claim.getField("over18")?.equals(stringToField("true")).toBoolean()).toBe(true);
      expect(claim.getField("kyc")?.equals(stringToField("passed")).toBoolean()).toBe(true);
      expect(claim.getField("subject")?.equals(Poseidon.hash(subjectPublicKey)).toBoolean()).toBe(true);
    });
  
    it('can construct a signed claim and validate the signature', () => {
        const subjectPrvKey = PrivateKey.random();
        const subjectPublicKey = subjectPrvKey.toPublicKey().toFields();
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
        const subjectPublicKey = subjectPrvKey.toPublicKey().toFields();
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
        const subjectPublicKey = subjectPrvKey.toPublicKey().toFields();
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
        const expectedValue = claimToField(subjectPublicKey); // assuming subjectPublicKey is a correct input type for claimToField()
        const [computedRoot, _] = subjectWitness.computeRootAndKey(expectedValue);
        const isAboutCorrectSubject = computedRoot.equals(signedClaim.claimRoot).toBoolean();
        expect(isAboutCorrectSubject).toBe(true);
      });
  });