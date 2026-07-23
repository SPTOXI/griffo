import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';

/**
 * Initializes the Lemon Squeezy SDK with the API key from environment variables.
 * Call this function before making any Lemon Squeezy API calls.
 */
export function setupLemonSqueezy() {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  
  if (!apiKey) {
    console.error('LEMON_SQUEEZY_API_KEY is not defined in environment variables.');
  }

  lemonSqueezySetup({
    apiKey: apiKey || '',
    onError: (error) => console.error('Lemon Squeezy Error:', error),
  });
}
