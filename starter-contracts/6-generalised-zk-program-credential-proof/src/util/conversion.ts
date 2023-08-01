import { Field, Encoding, Poseidon, PublicKey } from "snarkyjs";
import { ClaimType } from "../DataModel";

let {toBytes, fromBytes} = Encoding.Bijective.Fp;

/**
 * 
 * @param str a string to convert to a field
 * @returns a field
 */
export function stringToField(str: string): Field {
    const bytes = Buffer.from(str)
    // use Poseidon hash function to convert bytes to single field
    return Poseidon.hash(fromBytes(bytes));
  }

/**
 * 
 * @param num a number to convert to a field
 * @returns a field
 */
export function numberToField(num: number): Field {
    return stringToField(num.toString());
}

/**
 * 
 * @param fields an array of fields to convert to a single field
 * @returns a field
 */
export function publicKeyHash(publicKey: PublicKey): Field {
      // use Poseidon hash function to convert bytes to single field
    return Poseidon.hash(publicKey.toFields());
}

/**
 * 
 * @param claim a claim to convert to a field
 * @returns a field
 */
// TODO: make this able to handle arbitrary data structures (e.g. nested dictionaries)
  export function claimToField(claim: ClaimType): Field {
    if (typeof claim === 'string') {
      return stringToField(claim);
    } else if (typeof claim === 'number') {
      return numberToField(claim);
    } else if (typeof claim === 'object') {
      return publicKeyHash(claim);
    } else {
      throw new Error("Claim type not recognised");
    }
  }

/**
 * 
 * @param field a field to convert to a string
 * @returns a string
 */
export function fieldToString(field: Field[]): string {
    const bytes = toBytes(field);
    return Buffer.from(bytes).toString();
  }