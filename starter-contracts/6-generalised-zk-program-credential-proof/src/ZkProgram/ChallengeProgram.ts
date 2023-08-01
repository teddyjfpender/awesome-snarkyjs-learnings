import { Field, Experimental, PublicKey } from 'snarkyjs';
import { Rule } from '../DataModel';

// WIP 🚧

export const ProveInferredCredential = Experimental.ZkProgram({

    methods: {
      attest: {
        privateInputs: [SignedSubjectInferredClaim], // the original claim and inferred claim can be treated as private inputs
        publicInputs: [Rule[]], // the rules can be treated as public inputs
        method(privateInputs, publicInputs) {
          // assert the original claim and inferred claim are signed by the subject
          privateInputs.signedSubjectInferredClaim.signatureSubject.verify(
            privateInputs.signedSubjectInferredClaim.originalClaimRoot,
            privateInputs.signedSubjectInferredClaim.inferredClaimRoot
          ).assertTrue();
  
          // assert the inferred claim is correctly derived from the original claim based on the rules
          for (const rule of publicInputs.rules) {
            const originalValue = privateInputs.signedSubjectInferredClaim.originalClaimRoot.getField(rule.field);
            let inferredValue: Field;
  
            switch (rule.operation) {
              case 'lt':
                inferredValue = originalValue.lessThan(Field.from(rule.value));
                break;
              case 'lte':
                inferredValue = originalValue.lessThanOrEqual(Field.from(rule.value));
                break;
              case 'eq':
                inferredValue = originalValue.equal(Field.from(rule.value));
                break;
              case 'gte':
                inferredValue = originalValue.greaterThanOrEqual(Field.from(rule.value));
                break;
              case 'gt':
                inferredValue = originalValue.greaterThan(Field.from(rule.value));
                break;
            }
  
            privateInputs.signedSubjectInferredClaim.inferredClaimRoot.getField(rule.inferredFieldName)
              .equal(inferredValue ? Field.ONE : Field.ZERO)
              .assertTrue();
          }
        },
      },
    },
  });
  