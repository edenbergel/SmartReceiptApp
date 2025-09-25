import Tesseract from 'tesseract.js';
import { extractStructuredData } from '../utils/textUtils.js';

export async function processWithTesseract(file) {
  const { data } = await Tesseract.recognize(file.buffer, 'eng');
  const fields = extractStructuredData(data.text);
  return { ...fields, rawText: data.text };
}
