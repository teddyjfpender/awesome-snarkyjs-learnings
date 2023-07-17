import { Field, SmartContract, state, State, method} from 'snarkyjs';
import { RecursiveAddition } from '../ZkProgram/RecursiveAddition.js';
/**
 * Basic Example for a counter zkApp with recursion
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

export class RecusiveCounterZkapp extends SmartContract {

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
    const {newState} = proof.publicOutput;
    // 4. update counter
    // TODO: this doesn't actually work, but it's a start
    this.counter.set(newState);
 }
}

