# Mina zkApp: Using Off-Chain Storage (with a local server)

WIP

## Architecture

The project consists of two parts:

- A zkApp (in `./ZkApp/NumberTreeContract.ts`)
  - 

- An Off Chain Server (in `./OffChainStorage/offChainServer.ts`)
  - 

Here's a sequence diagram for how I understand the process:

```mermaid

```




## How to build

```sh
npm run build
```

## How to run the `RunInteraction.js` script
First set up the local off-chain server:
```sh
npm run build && node build/src/OffChainStorage/offChainServer.js
```
Then in a separate terminal:
```sh
npm run build && node build/src/RunInteraction.js
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
