'use server';
/**
 * @fileOverview Sovereign Policy Enforcement Service.
 * Provides real-time ethical auditing and risk assessment.
 */

import {ai} from '@/core/ai';
import {z} from 'genkit';

const PolicyInputSchema = z.object({
  missionDescription: z.string(),
});
export type PolicyInput = z.infer<typeof PolicyInputSchema>;

const PolicyOutputSchema = z.object({
  detectedIntent: z.string(),
  estimatedAgents: z.string(),
  estimatedDuration: z.string(),
  riskLevel: z.enum(['Low', 'Medium', 'High', 'Critical', 'N/A']),
  policyPreCheck: z.enum(['✓ Permitted', '⚠️ Review Required', '❌ Not Permitted', 'N/A']),
  confidenceScore: z.string(),
});
export type PolicyOutput = z.infer<typeof PolicyOutputSchema>;

export async function missionIntelligencePreviewAndEthicalCheck(input: PolicyInput): Promise<PolicyOutput> {
  const {output} = await policyPrompt(input);
  if (!output) throw new Error('Policy check failed.');
  return output;
}

const policyPrompt = ai.definePrompt({
  name: 'policyPrompt',
  input: {schema: PolicyInputSchema},
  output: {schema: PolicyOutputSchema},
  prompt: `Perform an ethical audit on the following mission:
  
  Mission: {{{missionDescription}}}
  
  Assess risk levels and compliance with global ethical AI standards.`,
});
