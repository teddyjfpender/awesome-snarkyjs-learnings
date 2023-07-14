// Import the required modules and functions
import { AccountUpdate, Mina, PrivateKey } from 'snarkyjs';
import { Add } from './Add.js';

// Initiate a local Mina blockchain with proofs enabled
const local = Mina.LocalBlockchain({ proofsEnabled: true }); // proofsEnabled is required for zkapps
Mina.setActiveInstance(local); // Set this instance as the active one for Mina

// Initialize account keys for deployment and interaction
const { privateKey: deployerKey, publicKey: deployerAccount } =
  local.testAccounts[0];
const { privateKey: senderKey, publicKey: senderAccount } =
  local.testAccounts[1];

// Generate a random private key and corresponding public key (zkApp account)
let zkAppPrivateKey = PrivateKey.random();
let zkAppAccount = zkAppPrivateKey.toPublicKey();
// Instantiate the Add contract for the zkApp account
const zkApp = new Add(zkAppAccount);

console.log('compile the contract...');
// Compile the Add contract
await Add.compile();

// Create and sign a transaction for deploying the contract using the deployer account
const deployTxn = await Mina.transaction(deployerAccount, () => {
  AccountUpdate.fundNewAccount(deployerAccount); // Fund the new account
  zkApp.deploy(); // Deploy the contract
});

// Sign the transaction using the deployer key and the zkApp private key, and send it
await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();

// Get and log the initial state of the deployed contract
let num = await zkApp.num.get();
console.log(`Deployed zkApp state, num: ${num.toString()}`);

// Create a transaction for updating the state of the contract using the sender account
const updateTxn = await Mina.transaction(senderAccount, () => {
  zkApp.update();
});

console.log('sender is proving...');
// Prove the transaction and sign it with the sender key, then send it
await updateTxn.prove();
await updateTxn.sign([senderKey]).send();

// Get and log the updated state of the contract
num = await zkApp.num.get();
console.log(`After sender interacted, num: ${num.toString()}`);

// End the script process
process.exit(0);
