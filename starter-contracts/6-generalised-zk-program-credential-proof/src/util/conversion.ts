import { Field, Encoding, Poseidon } from "snarkyjs";
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
   * @param fields an array of fields to convert to a single field
   * @returns a field
   */
export function fieldsHash(fields: Field[]): Field {
      // use Poseidon hash function to convert bytes to single field
    return Poseidon.hash(fields);
}

/**
 * 
 * @param claim a claim to convert to a field
 * @returns a field
 */
  export function claimToField(claim: ClaimType): Field {
    if (typeof claim === 'string') {
      return stringToField(claim);
    } else {
      return fieldsHash(claim);
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