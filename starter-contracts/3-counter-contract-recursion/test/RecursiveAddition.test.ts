import { RecusiveCounterZkapp } from '../src/ZkApp/AddZkApp';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate } from 'snarkyjs';
import { RecursiveAddOne, RecursiveAdditionPublicInput } from '../src/util/testFunctions.js';
import { tic, toc } from '../src/util/tictoc';
/*
 * This file specifies how to test the `CounterZkapp` smart contract. It is safe to delete this file and replace
 * with your own tests.
 *
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

let proofsEnabled = false; // Set proofsEnabled to true for testing

describe('CounterZkapp', () => {
  let deployerAccount: PublicKey,
    deployerKey: PrivateKey,
    userOneAccount: PublicKey,
    userOneKey: PrivateKey,
    userTwoAccount: PublicKey,
    userTwoKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: RecusiveCounterZkapp;

  beforeAll(async () => {
    if (proofsEnabled) await RecusiveCounterZkapp.compile();
  });

  beforeEach(() => {
    const local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(local);
    ({ privateKey: deployerKey, publicKey: deployerAccount } = local.testAccounts[0]);
    ({ privateKey: userOneKey, publicKey: userOneAccount } = local.testAccounts[1]);
    ({ privateKey: userTwoKey, publicKey: userTwoAccount } = local.testAccounts[2]);
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new RecusiveCounterZkapp(zkAppAddress);
  });

  async function localDeploy() {
    const deployTxn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy();
    });

    await deployTxn.prove();
    await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('deploys the `RecusiveCounterZkapp` smart contract', async () => {
    await localDeploy();
    const counter = await zkApp.counter.get();
    expect(counter).toEqual(Field(0));
  });
  it('two parties can use the RecursiveAddition zkProgram to increment a counter and settle a final state in the contract', async () => {
    await localDeploy();
    const initialCounterValue = await zkApp.counter.get();
    // compile the recursive addition zkProgram
    tic('compiling RecursiveAddition zkProgram');
    await RecursiveAddOne.compile();
    toc();
    tic('executing base case');
    // create initial public input
    const initialPublicInput = new RecursiveAdditionPublicInput({ initialCounter: initialCounterValue, currentCounter: Field(0), totalIterations: Field(0) });
    // create base case proof
    let proof0 = await RecursiveAddOne.baseCase(initialPublicInput)
    toc();
    tic('executing first recursive addition');
    const proof1 = await RecursiveAddOne.step(initialPublicInput, proof0);
    toc();
    tic('executing second recursive addition');
    const proof2 = await RecursiveAddOne.step(initialPublicInput, proof1);
    toc();

    // post proof to the zkApp
    const postProofTxn = await Mina.transaction(userOneAccount, () => {
      zkApp.settleState(proof2);
    })
    await postProofTxn.prove();
    await postProofTxn.sign([userOneKey]).send();

    expect(await zkApp.counter.get()).toEqual(initialCounterValue.add(Field(2)));
  });

});
