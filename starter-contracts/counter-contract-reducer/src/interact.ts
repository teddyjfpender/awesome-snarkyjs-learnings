// Import the required modules and functions
import { AccountUpdate, Mina, PrivateKey, Field, Reducer } from 'snarkyjs';
import { CounterZkapp } from './CounterZkApp.js';

// contract initial states
const initialCounter = Field(0)
// Initiate a local Mina blockchain with proofs enabled
const local = Mina.LocalBlockchain({ proofsEnabled: true }); // proofsEnabled is required for zkapps
Mina.setActiveInstance(local); // Set this instance as the active one for Mina

// Initialize account keys for deployment and interaction
const { privateKey: deployerKey, publicKey: deployerAccount } =
  local.testAccounts[0];
const { privateKey: userOneKey, publicKey: userOneAccount } =
  local.testAccounts[1];
const { privateKey: userTwoKey, publicKey: userTwoAccount } =
  local.testAccounts[2];

// Generate a random private key and corresponding public key (zkApp account)
let zkAppPrivateKey = PrivateKey.random();
let zkAppAccount = zkAppPrivateKey.toPublicKey();
// Instantiate the Add contract for the zkApp account
const zkApp = new CounterZkapp(zkAppAccount);

console.log('compile the contract...');
// Compile the Add contract
await CounterZkapp.compile();

// Create and sign a transaction for deploying the contract using the deployer account
const deployTxn = await Mina.transaction(deployerAccount, () => {
  AccountUpdate.fundNewAccount(deployerAccount); // Fund the new account
  zkApp.deploy(); // Deploy the contract
  zkApp.counter.set(initialCounter); // Set the initial state of the contract
  zkApp.actionState.set(Reducer.initialActionState); // Set the initial action state of the contract
});

// Sign the transaction using the deployer key and the zkApp private key, and send it
await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();

// Get and log the initial state of the deployed contract
let counter = await zkApp.counter.get();
console.log(`Deployed zkApp state, counter: ${counter.toString()}`);

// Now lets interact with the contract!
console.log(`Applying actions...`);
console.log(`Action 1!`)

const userOneTx = await Mina.transaction(userOneAccount, () => {
  zkApp.incrementCounter();
});
// Prove the transaction
await userOneTx.prove();
// Sign the transaction using the userOne key and send it
await userOneTx.sign([userOneKey]).send();

console.log(`Action 2!`)
const userTwoTx = await Mina.transaction(userTwoAccount, () => {
  zkApp.incrementCounter();
});
// Prove the transaction
await userTwoTx.prove();
// Sign the transaction using the userTwo key and send it
await userTwoTx.sign([userTwoKey]).send();

// Rollup the pending actions!
console.log(`Rolling up pending actions...`)
const rollupTx = await Mina.transaction(deployerAccount, () => {
  zkApp.rollupIncrements();
});
// Prove and sign the transaction
await rollupTx.prove();
// Sign the transaction using the deployer key and send it
await rollupTx.sign([deployerKey]).send();

// Get and log the updated state of the contract
counter = await zkApp.counter.get();
console.log(`After actions, counter: ${counter.toString()}`);
