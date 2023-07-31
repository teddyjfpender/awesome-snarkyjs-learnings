import {Claim, SignedClaim, CredentialVerificationPrivateInput} from '../ZkProgram/dataModel.js';
import { Field, PrivateKey, PublicKey, Signature } from 'snarkyjs';

/**
 * A helper function to construct a claim
 */
export function constructClaim(kyc: Field, subject: PublicKey): Claim {
    return new Claim({kyc, Subject: subject});
    }

/**
 * A helper function to construct a signed claim
 * @param claim the claim to sign
 * @param issuerPrvKey the private key of the issuer
 * @returns a signed claim
 **/
export function constructSignedClaim(claim: Claim, issuerPrvKey: PrivateKey): SignedClaim {
    //Signature.create(issuerPrvKey, [claim.kyc].concat(claim.Subject.toFields()))
    const signatureIssuer = Signature.create(issuerPrvKey, [claim.kyc].concat(claim.Subject.toFields()));
    return new SignedClaim({claim, signatureIssuer});
    }

/**
 * Create Credentials
 * @param kyc whether the subject has passed KYC
 * @param subjectPubKey the public key of the subject
 * @param issuerPrvKey the private key of the issuer
 * @returns a signed claim/credential
 */
export function constructCredential(kyc: Field, subjectPubKey: PublicKey, issuerPrvKey: PrivateKey): SignedClaim {
    const claim = constructClaim(kyc, subjectPubKey);
    const signedClaim = constructSignedClaim(claim, issuerPrvKey);
    return signedClaim;
    }


/**
 * A helper function to construct a presentation
 * @param signedClaim the signed claim to present
 * @param subjectPrvKey the private key of the subject
 * @returns a presentation used as a private input to the zkProgram
 * */
export function constructPresentation(signedClaim: SignedClaim, subjectPrvKey: PrivateKey): CredentialVerificationPrivateInput {
    const signatureSubject = Signature.create(subjectPrvKey, signedClaim.signatureIssuer.toFields());
    return new CredentialVerificationPrivateInput({signedClaim, signatureSubject});
    }