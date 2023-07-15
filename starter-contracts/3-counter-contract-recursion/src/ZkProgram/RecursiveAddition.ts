import { SelfProof, Field, Experimental, Proof, Struct } from 'snarkyjs';

export class RecursiveAdditionPublicInput extends Struct({
    initialCounter: Field,
    currentCounter: Field,
    totalIterations: Field,
}) {}

export const RecursiveAddOne = Experimental.ZkProgram({
  publicInput: RecursiveAdditionPublicInput,

  methods: {
    baseCase: {
      privateInputs: [],

      method(publicInput: RecursiveAdditionPublicInput) {
        publicInput.initialCounter.assertEquals(publicInput.currentCounter);
      },
    },

    step: {
      privateInputs: [SelfProof],

      method(publicInput: RecursiveAdditionPublicInput, earlierProof: SelfProof<RecursiveAdditionPublicInput, void>) {
        earlierProof.verify();
        // assert that the earlier proof's public input initialCounter 
        // is equal to the currentCounter minus the totalIterations
        earlierProof.publicInput.initialCounter.assertEquals(
            publicInput.currentCounter.sub(Field(1).mul(publicInput.totalIterations))
            );
      },
    },
  },
});

export class RecursiveAddition extends Experimental.ZkProgram.Proof(RecursiveAddOne) {}