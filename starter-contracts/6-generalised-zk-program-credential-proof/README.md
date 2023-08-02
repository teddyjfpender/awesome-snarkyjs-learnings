# Generalised Credential Issuance & Attestation

This is still a WIP 🚧 and not yet thoroughly tested but contains a first attempt at constructing a library that provides functionality for creating, verifying, and providing zero knowledge proofs about credentials. Credentials are digitally signed claims issued by a trusted authority. The library provides cryptographic guarantees about the integrity and authenticity of these credentials. This library is an abstraction over `snarkyjs` functionality that creates an easy-to-use API.

## Features

- Create Credentials: Issuers can construct and signs a new credential containing specified claims about a subject.
- Verify Credentials: Validates the credential is issued by a specific issuer and about a specific subject.
- Prove Credentials: Given a `Rule` from a challenger, the prover can creates a zero-knowledge proof demonstrating that a certain claim exists within the credential without revealing the exact value of the claim.

## Basic Usage

### Scenario 1: Creating credentials for a subject

An issuer can create a `credential` for a subject containing claims about the subject:
```ts
import { Credential } from "../../src/Credentials"; 
import { ClaimType } from "../../src/DataModel";

const subjectPrvKey = PrivateKey.random();
const subjectPubKey = subjectPrvKey.toPublicKey()
const issuerPrvKey = PrivateKey.random();
const claims: {[key: string]: ClaimType} = {
    over18: "true", 
    kyc: "passed", 
    subject: subjectPubKey
};

const credential = Credential.create(claims, issuerPrvKey);
```

### Scenario 2: Proving something about a credential

Given a challenger who provides a `Rule` to a subject, the subject who has been issued a `credential` can attempt to make a prove the `Rule` (i.e. a statement about their `credential`) by using a `ZkProgram` abstracted away in the `prove` method.

Constructing a `Rule`:
```ts
import { Rule } from "../../src/DataModel";

// Create a challenge for the user 
const property = "age";
const operation = "gte";
const value = 18;
const rule = new Rule(property, operation, value);
```

Proving a statement about the credentials using that `Rule`:
```ts
const proofResponse = await credential.prove("age", issuerPrvKey.toPublicKey(), rule, subjectPrvKey);
// verify the proof
console.log("attestationProof Verification: ", await verify(proofResponse.attestationProof.toJSON(), proofResponse.verificationKey));
```

## TODO

- Currently the prover can only attest to a single property of their credentials using the `prove` method. The next step should be to allow a user to merge multiple proofs into a single rollup-style proof that attests to multiple claims about their credentials. In this scenario, the `prove` method should take an argument of `Array<Rule>` and construct a single proof that can be verified.

- Ensure that the claims can be nested objects that comply with [W3C Data Model](https://w3c-ccg.github.io/universal-wallet-interop-spec/#Data%20Model)

## How to build

```sh
npm run build
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
