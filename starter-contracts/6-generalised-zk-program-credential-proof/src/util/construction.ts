import { PrivateKey } from "snarkyjs";
import { Claim, SignedClaim, CredentialPresentation } from "../DataModel/dataModel";
import { ClaimType, Rule } from "../DataModel/types";

/**
 * 
 * @param claims a dictionary of claims to construct a claim from
 * @returns a claim
 */
export function constructClaim(claims: {[key: string]: ClaimType}): Claim {
    const claim = new Claim();
    for (const key in claims) {
        claim.addField(key, claims[key]);
    }
    return claim;
}
  
/**
 * 
 * @param claim a claim to construct a signed claim from
 * @param issuerPrvKey a private key to sign the claim with
 * @returns a signed claim
 */
export function constructSignedClaim(claim: Claim, issuerPrvKey: PrivateKey): SignedClaim {
    return new SignedClaim(claim, issuerPrvKey);
}

/**
 * 
 * @param signedClaim a signed claim to construct a credential presentation from
 * @param subjectPrvKey a private key to sign the credential presentation with
 * @returns a credential presentation
 */
export function constructPresentation(signedClaim: SignedClaim, subjectPrvKey: PrivateKey): CredentialPresentation {
    return new CredentialPresentation(signedClaim, subjectPrvKey);
}

/**
 * 
 * @param originalClaim a claim to construct an inferred claim from
 * @param rules an array of rules to use to infer new claims
 * @returns a claim (now one that is inferred from the original claim)
 */  
// TODO: Change this to a ZkProgram
export function constructInferredClaim(originalClaim: Claim, rules: Rule[]): Claim {
    const inferredClaim = new Claim();

    for (const rule of rules) {
        const originalValue = Number(originalClaim.getField(rule.field));
        let inferredValue: boolean;

        switch (rule.operation) {
        case 'lt':
            inferredValue = originalValue < rule.value;
            break;
        case 'lte':
            inferredValue = originalValue <= rule.value;
            break;
        case 'eq':
            inferredValue = originalValue === rule.value;
            break;
        case 'gte':
            inferredValue = originalValue >= rule.value;
            break;
        case 'gt':
            inferredValue = originalValue > rule.value;
            break;
        }

        inferredClaim.addField(rule.inferredFieldName, inferredValue ? 'true' : 'false');
    }

    return inferredClaim;
}