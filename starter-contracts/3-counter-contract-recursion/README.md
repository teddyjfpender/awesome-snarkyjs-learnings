# Mina zkApp: Counter Zkapp Contract With Recursion (Unfinished)

This project demonstrates how to build a simple zkApp with recursion in Mina Protocol, making use of Zero Knowledge Proofs (zk-SNARKs). We create a basic `AddOne` ZkProgram that recursively increments a state. This state is then settled in a `CounterZkApp` smart contract on-chain. 

This project, written in TypeScript, leverages the `snarkyjs` library. The implementation is similar to the `2-counter-contract-reducer` directory, but instead of using `Actions` with a `Reducer`, we accomplish everything off-chain. 

## Architecture

The project consists of two parts:

- The `AddOne` ZkProgram (in `RecursiveAddition.ts`)
  - It takes a `Struct` as a public input, called `RecursiveAdditionPublicInput` which has two properties `initialCounter` and `currentCounter`. The `totalInteractions` allows us to use more interesting data structures than only `Field` allows for!
  - The `AddOne` ZkProgram has a base case and a `step` that verifies the correctness of the previous state and calculates the new state.
  - This file also includes `testRecursion` function for testing the recursive addition.
  - Uses the `tictoc` script in the `./util` directory for time profiling.

- The `CounterZkApp` smart contract (in `RecursiveAddOneZkApp.ts`)
  - It maintains a `counter` state.
  - The `settleState` method settles the final state in the smart contract.

Here's a sequence diagram for how I understand the process:

```mermaid


```

## How to build

```sh
npm run build
```

## How to run the `RecursiveAddition.ts` script
```sh
npm run build && node build/src/RecursiveAddition.js
```

## How to run tests

```sh
npm run test
npm run testw # watch mode
```

## How to run coverage

```sh
npm run coverage
```

## License

[Apache-2.0](LICENSE)
