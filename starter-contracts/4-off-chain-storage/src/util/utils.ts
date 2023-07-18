import {
  AccountUpdate,
    Bool,
    Field,
    Mina,
    PrivateKey,
    PublicKey,
    SmartContract,
    fetchAccount,
  } from 'snarkyjs';
  
import fs from 'fs'; 
import { NumberTreeContract } from '../ZkApp/NumberTreeContract.js';
import * as OffChainStorage from '../OffChainStorage/offChainStorage.js';

  // ========================================================
  
  export const loopUntilAccountExists = async (
    { account,
      eachTimeNotExist,
      isZkAppAccount
    }:
    { account: PublicKey,
      eachTimeNotExist: () => void,
      isZkAppAccount: boolean
    }
  ) => {
    for (;;) {
      let response = await fetchAccount({ publicKey: account });
      let accountExists = response.error == null;
      if (isZkAppAccount) {
        accountExists = accountExists && response.account!.zkapp?.appState != null;
      }
      if (!accountExists) {
        await eachTimeNotExist();
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } else {
        // TODO add optional check that verification key is correct once this is available in SnarkyJS
        return response.account!;
      }
    }
  };
  
  // ========================================================
  
  interface ToString {
    toString: () => string;
  }
  
  type FetchedAccountResponse = Awaited<ReturnType<typeof fetchAccount>>
  type FetchedAccount =  NonNullable<FetchedAccountResponse["account"]>
  
  export const makeAndSendTransaction = async <State extends ToString>({ 
    feePayerPrivateKey,
    zkAppPublicKey,
    mutateZkApp,
    transactionFee,
    getState,
    statesEqual
  }: { 
    feePayerPrivateKey: PrivateKey,
    zkAppPublicKey: PublicKey,
    mutateZkApp: () => void,
    transactionFee: number,
    getState: () => State,
    statesEqual: (state1: State, state2: State) => boolean
  }) => {
    const initialState = getState();
  
    // Why this line? It increments internal feePayer account variables, such as
    // nonce, necessary for successfully sending a transaction
    await fetchAccount({ publicKey: feePayerPrivateKey.toPublicKey() });
  
    let transaction = await Mina.transaction(
      { feePayerKey: feePayerPrivateKey, fee: transactionFee },
      () => {
        mutateZkApp();
      }
    );
  
    // fill in the proof - this can take a while...
    console.log('Creating an execution proof...');
    const time0 = Date.now();
    await transaction.prove();
    const time1 = Date.now();
    console.log('creating proof took', (time1 - time0) / 1e3, 'seconds');
  
    console.log('Sending the transaction...');
    const res = await transaction.send();
    const hash = await res.hash(); // This will change in a future version of SnarkyJS
    if (hash == null) {
      console.log('error sending transaction (see above)');
    } else {
      console.log(
        'See transaction at',
        'https://berkeley.minaexplorer.com/transaction/' + hash
      );
    }
  
    let state = getState();
  
    let stateChanged = false;
    while (!stateChanged) {
      console.log(
        'waiting for zkApp state to change... (current state: ',
        state.toString() + ')'
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await fetchAccount({ publicKey: zkAppPublicKey });
      state = await getState();
      stateChanged = !statesEqual(initialState, state);
    }
  };
  
  // ========================================================
  
  export const zkAppNeedsInitialization = async (
    { zkAppAccount }: 
    { zkAppAccount: FetchedAccount }
  ) => {
    console.warn('warning: using a `utils.ts` written before `isProved` made available. Check https://docs.minaprotocol.com/zkapps/tutorials/deploying-to-a-live-network for updates');
    // TODO when available in the future, use isProved.
    const allZeros = zkAppAccount.zkapp?.appState!.every((f: Field) =>
      f.equals(Field(0)).toBoolean()
    );
    const needsInitialization = allZeros;
    return needsInitialization;
  }
  
  // ========================================================

  export type ParticipantKeys = {
    feePayerPrivateKey: PrivateKey;
    feePayerPublicKey: PublicKey;
    zkAppPrivateKey: PrivateKey;
    zkAppPublicKey: PublicKey;
  };
  
  export async function generateFeePayerAndZkAppKeys(useLocal: boolean, proofsEnabled: boolean): Promise<ParticipantKeys> {
  if (useLocal) {
    const Local = Mina.LocalBlockchain({ proofsEnabled: proofsEnabled });
    Mina.setActiveInstance(Local);
  
    const feePayerKey = Local.testAccounts[0].privateKey;
    const feePayerPublicKey = feePayerKey.toPublicKey();
    const zkAppPrivateKey = PrivateKey.random();
    const zkAppPublicKey = zkAppPrivateKey.toPublicKey();
    return {
      feePayerPrivateKey: feePayerKey,
      feePayerPublicKey: feePayerPublicKey,
      zkAppPrivateKey: zkAppPrivateKey,
      zkAppPublicKey: zkAppPublicKey
    }
  } else {
    const Berkeley = Mina.Network(
      'https://proxy.berkeley.minaexplorer.com/graphql'
    );
    Mina.setActiveInstance(Berkeley);
  
    const deployAlias = process.argv[2];
  
    const deployerKeyFileContents = fs.readFileSync(
      `keys/${deployAlias}.json`,
      'utf8'
    );
  
    const deployerPrivateKeyBase58 = JSON.parse(deployerKeyFileContents).privateKey;
  
    const feePayerKey = PrivateKey.fromBase58(deployerPrivateKeyBase58);
    const zkAppPrivateKey = feePayerKey;
    return {
      feePayerPrivateKey: feePayerKey,
      feePayerPublicKey: feePayerKey.toPublicKey(),
      zkAppPrivateKey: zkAppPrivateKey,
      zkAppPublicKey: zkAppPrivateKey.toPublicKey()
  }
}}

// ========================================================
export async function deployZkApp(useLocal: boolean, feePayerKey: PrivateKey, zkAppPrivateKey: PrivateKey, serverPublicKey: PublicKey) {
  if (!useLocal){
    console.log('Compiling smart contract...');
    await NumberTreeContract.compile();
  }
  
  const zkApp = new NumberTreeContract(zkAppPrivateKey.toPublicKey());
  
  if (useLocal) {
    const transaction = await Mina.transaction(feePayerKey.toPublicKey(), () => {
      AccountUpdate.fundNewAccount(feePayerKey.toPublicKey());
      zkApp.deploy({zkappKey: zkAppPrivateKey });
      zkApp.initState(serverPublicKey);
    });
    transaction.sign([zkAppPrivateKey, feePayerKey]);
    await transaction.prove();
    await transaction.send();
  } else {
    let zkAppAccount = await loopUntilAccountExists({
      account: zkAppPrivateKey.toPublicKey(),
      eachTimeNotExist: () =>
        console.log('waiting for zkApp account to be deployed...'),
      isZkAppAccount: true,
    });  
    }
    return zkApp
  }

// ========================================================
export async function updateTree(zkApp: NumberTreeContract, useLocal: boolean, 
  feePayerKey: PrivateKey, zkAppPrivateKey: PrivateKey, 
  storageServerAddress: string, partipantkeys: ParticipantKeys, 
  treeHeight: number, transactionFee: number, NodeXMLHttpRequest: typeof XMLHttpRequest) {
  const index = BigInt(Math.floor(Math.random() * 4));

  // get the existing tree
  const treeRoot = await zkApp.storageTreeRoot.get();
  const idx2fields = await OffChainStorage.get(
    storageServerAddress,
    partipantkeys.zkAppPublicKey,
    treeHeight,
    treeRoot,
    NodeXMLHttpRequest
  );

  const tree = OffChainStorage.mapToTree(treeHeight, idx2fields);
  const leafWitness = new OffChainStorage.MerkleWitness8(tree.getWitness(BigInt(index)));

  // get the prior leaf
  const priorLeafIsEmpty = !idx2fields.has(index);
  let priorLeafNumber: Field;
  let newLeafNumber: Field;
  if (!priorLeafIsEmpty) {
    priorLeafNumber = idx2fields.get(index)![0];
    newLeafNumber = priorLeafNumber.add(3);
  } else {
    priorLeafNumber = Field(0);
    newLeafNumber = Field(1);
  }

  // update the leaf, and save it in the storage server
  idx2fields.set(index, [newLeafNumber]);

  const [storedNewStorageNumber, storedNewStorageSignature] = await OffChainStorage.requestStore(
    storageServerAddress,
    partipantkeys.zkAppPublicKey,
    treeHeight,
    idx2fields,
    NodeXMLHttpRequest
  );

  console.log('changing index', index, 'from', priorLeafNumber.toString(), 'to', newLeafNumber.toString());

  // update the smart contract

  const doUpdate = () => {
    zkApp.update(
      Bool(priorLeafIsEmpty),
      priorLeafNumber,
      newLeafNumber,
      leafWitness,
      storedNewStorageNumber,
      storedNewStorageSignature
    );
  };

  if (useLocal) {
    const updateTransaction = await Mina.transaction(feePayerKey.toPublicKey(), doUpdate);

    updateTransaction.sign([zkAppPrivateKey, feePayerKey]);
    await updateTransaction.prove();
    await updateTransaction.send();
  } else {
    await makeAndSendTransaction({
      feePayerPrivateKey: feePayerKey,
      zkAppPublicKey: partipantkeys.zkAppPublicKey,
      mutateZkApp: () => doUpdate(),
      transactionFee: transactionFee,
      getState: () => zkApp.storageTreeRoot.get(),
      statesEqual: (root1, root2) => root1.equals(root2).toBoolean(),
    });
  }
  console.log('root updated to', zkApp.storageTreeRoot.get().toString());
 }