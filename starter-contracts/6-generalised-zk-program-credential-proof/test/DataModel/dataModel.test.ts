import { PrivateKey } from "snarkyjs";
import { constructClaim, constructSignedClaim } from "../../src/DataModel/dataModel";
import { stringToField } from "../../src/util/conversion";

describe('Claims and SignedClaims', () => {

    it('can construct a claim', () => {
      const claim = constructClaim({over18: "true", kyc: "passed"});
      expect(claim).toBeTruthy();
      expect(claim.getField("over18")?.equals(stringToField("true")).toBoolean()).toBe(true);
      expect(claim.getField("kyc")?.equals(stringToField("passed")).toBoolean()).toBe(true);
    });
  
    it('can construct a signed claim and validate the signature', () => {
      const claim = constructClaim({over18: "true", kyc: "passed"});
      const privateKey = PrivateKey.random();
      const publicKey = privateKey.toPublicKey();
      const signedClaim = constructSignedClaim(claim, privateKey);
  
      // Verify the signature
      const isValid = signedClaim.signatureIssuer.verify(
        publicKey,
        [signedClaim.claimRoot],
      ).toBoolean();
      
      expect(isValid).toBe(true);
    });
    
    it('does not validate the signature with wrong public key', () => {
      const claim = constructClaim({over18: "true", kyc: "passed"});
      const privateKey = PrivateKey.random();
      const wrongPublicKey = PrivateKey.random().toPublicKey();
      const signedClaim = constructSignedClaim(claim, privateKey);
      // Verify the signature
      const isValid = signedClaim.signatureIssuer.verify(
        wrongPublicKey,
        [signedClaim.claimRoot], 
      ).toBoolean();
      
      expect(isValid).toBe(false);
    });
  });