import { analyzeCode, type SupportedLanguage } from '../analyzer';

self.onmessage = (e: MessageEvent<{ id: string; code: string; language: SupportedLanguage }>) => {
  const messageId = e.data?.id ?? '';
  try {
    const { id, code, language } = e.data;
    const result = analyzeCode(code, language);
    self.postMessage({ id, success: true, result });
  } catch (error) {
    self.postMessage({ id: messageId, success: false, error: error instanceof Error ? error.message : 'Unknown error occurred in worker' });
  }
};
