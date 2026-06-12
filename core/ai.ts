import {genkit} from 'genkit';
import {ollama} from 'genkitx-ollama';

/**
 * @fileOverview Central AI configuration for EthicalAI.
 * Powering Nexus, Sovereign, and Citadel layers.
 */
export const ai = genkit({
  plugins: [
    ollama({
      models: [
        {
          name: 'gemma4:e4b',
        },
      ],
      serverAddress: 'http://127.0.0.1:11434',
    }),
  ],
  model: 'ollama/gemma4:e4b',
});
