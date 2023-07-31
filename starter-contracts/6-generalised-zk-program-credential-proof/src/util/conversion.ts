import { Field, Encoding, Poseidon } from "snarkyjs";

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
 * @param field a field to convert to a string
 * @returns a string
 */
export function fieldToString(field: Field[]): string {
    const bytes = toBytes(field);
    return Buffer.from(bytes).toString();
  }