import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { get, requestStore, getPublicKey } from './offChainStorage.js';
import { Field, PublicKey } from 'snarkyjs';

const app = express();

app.use(bodyParser.json());

// In-memory data store. Replace this with a real database in production.
const dataStore: Map<string, any> = new Map();

app.get('/data', async (req: Request, res: Response) => {
  const serverAddress = 'localhost:3001';
  const zkAppAddress = req.query.zkAppAddress as unknown as PublicKey;
  const height = parseInt(req.query.height as string);
  const root = req.query.root as unknown as Field;

  try {
    const result = await get(serverAddress, zkAppAddress, height, root);
    res.json(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post('/data', async (req: Request, res: Response) => {
  const serverAddress = 'localhost:3001';
  const zkAppAddress = req.body.zkAppAddress as PublicKey;
  const height = parseInt(req.body.height);
  const idx2fields = req.body.idx2fields as Map<bigint, any>;

  try {
    const [newRootNumber, newRootSignature] = await requestStore(
      serverAddress,
      zkAppAddress,
      height,
      idx2fields
    );
    res.json({ newRootNumber, newRootSignature });
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get('/publicKey', async (req: Request, res: Response) => {
  const serverAddress = 'localhost:3001';

  try {
    const publicKey = await getPublicKey(serverAddress);
    res.json({ publicKey });
  } catch (err) {
    res.status(500).send(err);
  }
});

app.listen(3001, () => {
  console.log('Server is running on localhost:3001');
});
