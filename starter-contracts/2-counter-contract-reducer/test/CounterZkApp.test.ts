import { CounterZkapp } from '../src/CounterZkApp';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Reducer } from 'snarkyjs';

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
    zkApp: CounterZkapp;

  beforeAll(async () => {
    if (proofsEnabled) await CounterZkapp.compile();
  });

  beforeEach(() => {
    const local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(local);
    ({ privateKey: deployerKey, publicKey: deployerAccount } = local.testAccounts[0]);
    ({ privateKey: userOneKey, publicKey: userOneAccount } = local.testAccounts[1]);
    ({ privateKey: userTwoKey, publicKey: userTwoAccount } = local.testAccounts[2]);
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new CounterZkapp(zkAppAddress);
  });

  async function localDeploy() {
    const deployTxn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy();
      zkApp.counter.set(Field(0));
      zkApp.actionState.set(Reducer.initialActionState);
    });

    await deployTxn.prove();
    await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('deploys the `CounterZkapp` smart contract', async () => {
    await localDeploy();
    const counter = await zkApp.counter.get();
    expect(counter).toEqual(Field(0));
  });

  it('apply actions and rolls up pending actions to update the counter', async () => {
    await localDeploy();

    const userOneTx = await Mina.transaction(userOneAccount, () => {
      zkApp.incrementCounter();
    });
    await userOneTx.prove();
    await userOneTx.sign([userOneKey]).send();

    const userTwoTx = await Mina.transaction(userTwoAccount, () => {
      zkApp.incrementCounter();
    });
    await userTwoTx.prove();
    await userTwoTx.sign([userTwoKey]).send();

    const rollupTx = await Mina.transaction(deployerAccount, () => {
      zkApp.rollupIncrements();
    });
    await rollupTx.prove();
    await rollupTx.sign([deployerKey]).send();

    const counter = await zkApp.counter.get();
    expect(counter).toEqual(Field(2));
  });
});
