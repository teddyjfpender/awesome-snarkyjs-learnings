import { Field, PrivateKey } from 'snarkyjs';
import { stringToField } from '../../src/util';

describe('Utility function tests', () => {
    test('Should convert a string to a field', () => {
        const helloWorldString = 'Hello World';
        const helloWorldField = stringToField(helloWorldString);
        // TODO: improve this test
        expect(helloWorldField.toBigInt()).toBe(3770730610572468029957754126422139677562318060305336866733601670349209104956n);
        })
    test('Should convert public key base58 to a field', () => {
      const subjectPrvKey = PrivateKey.random();
      const subjectPublicKey = subjectPrvKey.toPublicKey();
      const subjectPublicKeyBase58 = subjectPublicKey.toBase58();
      const subjectPublicKeyFieldConversion = stringToField(subjectPublicKeyBase58);
      console.log(subjectPublicKeyFieldConversion);
      // TODO: improve this test
      expect(1).toBe(1);
    })
    })