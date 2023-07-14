import { Field, SmartContract, state, State, method, Reducer } from 'snarkyjs';

/**
 * Basic Example for a counter zkApp
 * See https://docs.minaprotocol.com/zkapps for more info.
 *
 * I think of the reducers as being focused on replacing state rather than updating it.
 *
 * 
 */

const INCREMENT = Field(1);

export class CounterZkapp extends SmartContract {
 // this "reducer" field describes a type of action that we can dispatch, and reducer later
 reducer = Reducer({actionType: Field})

 // on-chain version of our state. This will typically lag
 // behind the version that's implicitly represented by the list of actions
 @state(Field) counter = State<Field>();
 // helper field to store the point in the action history that our on-chain
 // state is at
 @state(Field) actionState = State<Field>();

 @method incrementCounter() {
  this.reducer.dispatch(INCREMENT);
 }

 @method rollupIncrements(){
    // get previous counter & actions hash, asset that they're the same
    // as on-chain values
    let counter = this.counter.get();
    this.counter.assertEquals(counter);
    let actionState = this.actionState.get();
    this.actionState.assertEquals(actionState);

    // compute the new counter and hash from pending actions
    // these can be considered to be transactions that have not
    // yet made it on-chain (e.g. they exist in the mempool)
    let pendingActions = this.reducer.getActions({
        fromActionState: actionState,
    });

    let { state: newCounter, actionState: newActionState } = this.reducer.reduce(
        pendingActions,
        // state type
        Field,
        // function that says how to apply an action
        (state: Field, _action: Field) => {
            return state.add(1)
        },
        {state: counter, actionState}
    );

    // update on-chain state
    this.counter.set(newCounter);
    this.actionState.set(newActionState);
 }
}
