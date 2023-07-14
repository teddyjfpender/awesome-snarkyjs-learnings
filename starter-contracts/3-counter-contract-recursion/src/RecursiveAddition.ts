import { SelfProof, Field, Experimental, Proof, Struct } from 'snarkyjs';
import { tic, toc } from './util/tictoc.js';

export class RecursiveAdditionPublicInput extends Struct({
    initialCounter: Field,
    currentCounter: Field,
    totalIterations: Field,
}) {}

export const AddOne = Experimental.ZkProgram({
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

export class RecursiveAddition extends Experimental.ZkProgram.Proof(AddOne) {}

tic('compiling AddOne zkProgram');
await AddOne.compile();
toc();

await testRecursion(AddOne, 1);

async function testRecursion(
    Program: typeof AddOne,
    maxProofsVerified: number
  ) {
    console.log(`testing maxProofsVerified = ${maxProofsVerified}`);
  
    let ProofClass = Experimental.ZkProgram.Proof(Program);
    const initValues = new RecursiveAdditionPublicInput({ initialCounter: Field(0), currentCounter: Field(0), totalIterations: Field(0) });
  
    tic('executing base case');
    let initialProof = await Program.baseCase(initValues);
    toc();
    initialProof = testJsonRoundtrip(ProofClass, initialProof);
    initialProof.verify();
    initialProof.publicInput.initialCounter.assertEquals(Field(0));
  
    if (initialProof.maxProofsVerified != maxProofsVerified) {
      throw Error(
        `Expected initialProof to have maxProofsVerified = ${maxProofsVerified} but has ${initialProof.maxProofsVerified}`
      );
    }
  
    let p1;
    if (initialProof.maxProofsVerified === 0) return;
  
    tic('executing step');
    const step1 = new RecursiveAdditionPublicInput({ initialCounter: Field(1), currentCounter: Field(1), totalIterations: Field(1) });
    p1 = await Program.step(step1, initialProof);
    toc();
    p1 = testJsonRoundtrip(ProofClass, p1);
    tic('verifying step');
    p1.verify();
    toc();
    // check that all the public inputs are correct
    p1.publicInput.currentCounter.assertEquals(Field(1));
    p1.publicInput.initialCounter.assertEquals(Field(0));
    p1.publicInput.totalIterations.assertEquals(Field(1));
    if (p1.maxProofsVerified != maxProofsVerified) {
      throw Error(
        `Expected p1 to have maxProofsVerified = ${maxProofsVerified} but has ${p1.maxProofsVerified}`
      );
    }
  }


function testJsonRoundtrip(ProofClass: any, proof: Proof<RecursiveAdditionPublicInput, void>) {
    let jsonProof = proof.toJSON();
    console.log(
      'json roundtrip',
      JSON.stringify({ ...jsonProof, proof: jsonProof.proof.slice(0, 10) + '..' })
    );
    return ProofClass.fromJSON(jsonProof);
  }
