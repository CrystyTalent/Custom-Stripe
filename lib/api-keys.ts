import { randomBytes } from 'crypto';

/**
 * Generate a production API key in format: payzo_live_<64 hex chars>
 */
export function generateProductionApiKey(): string {
  const randomHex = randomBytes(32).toString('hex');
  return `payzo_live_${randomHex}`;
}

/**
 * Generate a webhook secret in format: whsec_<64 hex chars>
 */
export function generateWebhookSecret(): string {
  const randomHex = randomBytes(32).toString('hex');
  return `whsec_${randomHex}`;
}

/**
 * Generate both API keys for a new user
 */
export function generateApiKeys() {
  return {
    productionApiKey: generateProductionApiKey(),
    webhookSecret: generateWebhookSecret(),
  };
}

