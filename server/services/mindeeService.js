import { ClientV2, BufferInput } from 'mindee';
import {
  extractMindeeFields,
  extractMindeeInference,
  listMindeeFieldKeys,
  mapMindeePrediction,
} from '../utils/mindeeUtils.js';

export function createMindeeProcessor({ apiKey, modelId, debug }) {
  if (!apiKey) {
    return null;
  }

  const client = new ClientV2({ apiKey });

  return async function processWithMindee(file) {
    if (!modelId) {
      throw new Error('Mindee model ID is not configured');
    }

    const input = new BufferInput({
      buffer: file.buffer,
      filename: file.originalname ?? 'receipt.jpg',
    });

    const response = await client.enqueueAndGetInference(input, {
      modelId,
      pollingOptions: {
        initialDelaySec: 1,
        delaySec: 1,
        maxRetries: 20,
      },
    });

    const inference = extractMindeeInference(response);
    const fields = extractMindeeFields(inference, response);
    const fieldKeys = listMindeeFieldKeys(fields);

    if (!fields || fieldKeys.length === 0) {
      console.error('Mindee payload unexpected', JSON.stringify(response, null, 2));
      throw new Error('Mindee response missing prediction data');
    }

    if (debug) {
      console.log('Mindee fields keys:', fieldKeys.join(', ') || '(none)');
    }

    return mapMindeePrediction(fields, inference, response);
  };
}
