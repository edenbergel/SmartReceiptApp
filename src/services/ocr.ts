const OCR_ENDPOINT = process.env.EXPO_PUBLIC_OCR_URL ?? 'http://localhost:4000/ocr';

export interface OcrResponse {
  merchant: string;
  date: string;
  amount: number;
  category: string;
  rawText?: string;
  lineItems?: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    total?: number;
  }>;
}

interface UploadOptions {
  uri: string;
  filename?: string;
  mimeType?: string;
}

export async function uploadReceipt({ uri, filename, mimeType }: UploadOptions): Promise<OcrResponse> {
  const formData = new FormData();
  formData.append('receipt', {
    uri,
    name: filename ?? 'receipt.jpg',
    type: mimeType ?? 'image/jpeg',
  } as any);

  const response = await fetch(OCR_ENDPOINT, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const payload = await safeJson(response);
    throw new Error(payload?.error ?? `OCR request failed with status ${response.status}`);
  }

  return response.json();
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}
