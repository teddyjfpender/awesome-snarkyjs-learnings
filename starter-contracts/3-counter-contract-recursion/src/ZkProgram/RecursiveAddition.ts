import { SelfProof, Field, Experimental, Proof, Struct } from 'snarkyjs';

export class RecursiveAdditionPublicInput extends Struct({
    number: Field,
    numberToAdd: Field,
    newState: Field,
}) {}

export class RecursiveAdditionPublicOutput extends Struct({
  newState: Field,
}) {}

export const RecursiveAdd = Experimental.ZkProgram({
  publicInput: RecursiveAdditionPublicInput,
  publicOutput: RecursiveAdditionPublicOutput,

  methods: {
    init: {
      privateInputs: [],

      method(publicInput: RecursiveAdditionPublicInput): RecursiveAdditionPublicOutput {
        publicInput.number.assertEquals(Field(0));
        return new RecursiveAdditionPublicOutput({ newState: publicInput.numberToAdd });
      },
    },

    addNumber: {
      privateInputs: [SelfProof],

      method(publicInput: RecursiveAdditionPublicInput, earlierProof: SelfProof<RecursiveAdditionPublicInput, void>): RecursiveAdditionPublicOutput {
        // verify the earlier proof
        earlierProof.verify();
        // check that the next state is the sum of the previous state and the number to add
        publicInput.newState.assertEquals(earlierProof.publicInput.newState.add(publicInput.numberToAdd));
        // return the new state
        return new RecursiveAdditionPublicOutput({ newState: publicInput.newState });
      },
    },
  },
});

export class RecursiveAddition extends Experimental.ZkProgram.Proof(RecursiveAdd) {}