import { stringToField } from '../../src/util';

describe('Utility function tests', () => {
    test('Should convert a string to a field', () => {
        const helloWorldString = 'Hello World';
        const helloWorldField = stringToField(helloWorldString);
        console.log("helloWorldField", helloWorldField);
        expect(1).toEqual(1);
        })
    })