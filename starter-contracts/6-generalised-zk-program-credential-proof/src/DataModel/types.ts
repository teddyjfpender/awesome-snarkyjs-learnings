import { PublicKey } from "snarkyjs";

export type ClaimType = string | number | PublicKey;

export interface Rule {
    field: string;
    operation: 'lt' | 'lte' | 'eq' | 'gte' | 'gt';
    value: number;
    inferredFieldName: string;
  };