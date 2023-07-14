import { Field, SmartContract, state, State, method, Reducer, Proof } from 'snarkyjs';
import {RecursiveAddition, RecursiveAdditionPublicInput} from './RecursiveAddition';
/**
 * Basic Example for a counter zkApp with recursion
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

export class CounterZkapp extends SmartContract {

 // on-chain version of our state. This will typically lag
 // behind the version that's implicitly represented by the list of actions
 @state(Field) counter = State<Field>();

 // initialize the counter to 0
 init() {
    super.init();
    this.counter.set(Field(0));
  }

 @method settleState(proof: RecursiveAddition) {
  // 1. assert the current counter value
  const n = this.counter.getAndAssertEquals();
    // 2. verify proof
    proof.verify();
    // 3. get proof public input
    const {initialCounter, currentCounter, totalIterations} = proof.publicInput;
    // 3. update counter
    this.counter.set(currentCounter);
 }
}

