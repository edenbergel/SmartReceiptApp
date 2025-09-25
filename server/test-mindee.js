import { ClientV2, PathInput } from 'mindee';
import 'dotenv/config';

const apiKey = process.env.MINDEE_API_KEY;
const modelId = process.env.MINDEE_MODEL_ID;

// ⚠️ Mets ici le chemin d'une image de reçu
const filePath = "/Users/edenbergel/Downloads/c16dd8e-US_RECEIPT_OK.jpg";

async function testMindee() {
  try {
    if (!apiKey || !modelId) {
      console.error('❌ Clé ou modelId manquant dans .env');
      return;
    }

    const client = new ClientV2({ apiKey });
    const input = new PathInput({ inputPath: filePath });

    const response = await client.enqueueAndGetInference(input, {
      modelId,
      pollingOptions: {
        initialDelaySec: 1,
        delaySec: 1,
        maxRetries: 20,
      },
    });

    const inference =
      response?.document?.inference ??
      response?.inference ??
      response?.rawHttp?.inference;

    console.log('✅ Réponse Mindee :');
    console.log(JSON.stringify(inference, null, 2));
  } catch (err) {
    console.error('❌ Erreur :', err.message);
  }
}

testMindee();
