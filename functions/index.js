const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');

const openaiApiKey = defineSecret('OPENAI_API_KEY');

function readOutputText(response) {
  return (response.output ?? [])
    .filter((item) => item.type === 'message')
    .flatMap((item) => item.content ?? [])
    .filter((part) => part.type === 'output_text')
    .map((part) => part.text)
    .join('\n')
    .trim();
}

exports.askOpenAI = onCall(
  {
    region: 'us-central1',
    secrets: [openaiApiKey],
    timeoutSeconds: 60,
    maxInstances: 5,
  },
  async (request) => {
    const message = request.data?.message;

    if (typeof message !== 'string' || !message.trim()) {
      throw new HttpsError('invalid-argument', 'A message is required.');
    }
    if (message.length > 2000) {
      throw new HttpsError('invalid-argument', 'Messages must be 2,000 characters or fewer.');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey.value()}`,
        },
        body: JSON.stringify({
          model: 'gpt-5.6-luna',
          input: message.trim(),
          max_output_tokens: 600,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        logger.error('OpenAI request failed', {
          status: response.status,
          type: data?.error?.type,
          code: data?.error?.code,
        });
        throw new HttpsError('internal', 'The AI service could not complete the request.');
      }

      const text = readOutputText(data);
      if (!text) {
        logger.error('OpenAI returned no output text');
        throw new HttpsError('internal', 'The AI service returned no text.');
      }

      return { text };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error('Unexpected OpenAI proxy failure', error);
      throw new HttpsError('internal', 'The AI service is temporarily unavailable.');
    }
  }
);
