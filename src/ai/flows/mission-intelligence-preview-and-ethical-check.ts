'use server';
/**
 * @fileOverview A Genkit flow for providing real-time "Mission Intelligence" feedback and an "Ethical Policy Pre-Check" based on natural language input.
 *
 * - missionIntelligencePreviewAndEthicalCheck - A function that processes a mission description to provide intelligence and ethical assessment.
 * - MissionIntelligenceInput - The input type for the missionIntelligencePreviewAndEthicalCheck function.
 * - MissionIntelligenceOutput - The return type for the missionIntelligencePreviewAndEthicalCheck function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MissionIntelligenceInputSchema = z.object({
  missionDescription: z
    .string()
    .describe('A natural language description of the AI mission.'),
});
export type MissionIntelligenceInput = z.infer<
  typeof MissionIntelligenceInputSchema
>;

const MissionIntelligenceOutputSchema = z.object({
  detectedIntent: z
    .string()
    .describe(
      'The primary objective or intent detected from the mission description. Examples: "Data Analysis", "Content Generation", "System Optimization".'
    ),
  estimatedAgents: z
    .string()
    .describe(
      'An estimation of the number of AI agents required for the mission, e.g., "3 agents", "1 agent", "Multiple agents", or "N/A" if indeterminate.'
    ),
  estimatedDuration: z
    .string()
    .describe(
      'An estimation of the time required to complete the mission, e.g., "~5 min", "1-2 hours", "Several days", or "N/A" if indeterminate.'
    ),
  riskLevel: z
    .enum(['Low', 'Medium', 'High', 'Critical', 'N/A'])
    .describe(
      'The assessed risk level of the mission, considering potential for harm, bias, or misuse. "N/A" if unable to assess.'
    ),
  policyPreCheck: z
    .enum(['✓ Permitted', '⚠️ Review Required', '❌ Not Permitted', 'N/A'])
    .describe(
      'The result of an ethical policy pre-check. "✓ Permitted" if compliant, "⚠️ Review Required" if potential issues exist, "❌ Not Permitted" if clearly violates policies, or "N/A" if unable to check.'
    ),
  confidenceScore: z
    .string()
    .describe(
      'A confidence score indicating the clarity and feasibility of the mission description, e.g., "90%", "50%", or "N/A".'
    ),
});
export type MissionIntelligenceOutput = z.infer<
  typeof MissionIntelligenceOutputSchema
>;

export async function missionIntelligencePreviewAndEthicalCheck(
  input: MissionIntelligenceInput
): Promise<MissionIntelligenceOutput> {
  return missionIntelligencePreviewAndEthicalCheckFlow(input);
}

const missionIntelligencePrompt = ai.definePrompt({
  name: 'missionIntelligencePrompt',
  input: {schema: MissionIntelligenceInputSchema},
  output: {schema: MissionIntelligenceOutputSchema},
  prompt: `You are an advanced AI assistant specializing in ethical AI mission planning. Your task is to analyze a user's natural language mission description and provide a structured "Mission Intelligence" breakdown, including an "Ethical Policy Pre-Check".

Analyze the "missionDescription" provided and extract the following information. If information is too vague or not sufficiently provided, respond with "N/A" for the respective field.

Instructions for each field:
- detectedIntent: Identify the core purpose of the mission. Be concise.
- estimatedAgents: Provide a brief estimate of the number of AI agents.
- estimatedDuration: Provide a brief estimate of the mission's duration.
- riskLevel: Assess the mission's risk (Low, Medium, High, Critical) based on potential for bias, misuse, privacy violation, or societal harm. If uncertain, use "N/A".
- policyPreCheck: Based on common ethical AI guidelines (fairness, transparency, accountability, privacy, safety), determine if the mission is generally Permitted, requires Review, or is Not Permitted. If uncertain, use "N/A".
- confidenceScore: Evaluate the clarity and completeness of the mission description. Provide a percentage or "N/A".

Mission Description: {{{missionDescription}}}`,
});

const missionIntelligencePreviewAndEthicalCheckFlow = ai.defineFlow(
  {
    name: 'missionIntelligencePreviewAndEthicalCheckFlow',
    inputSchema: MissionIntelligenceInputSchema,
    outputSchema: MissionIntelligenceOutputSchema,
  },
  async input => {
    const {output} = await missionIntelligencePrompt(input);
    return output!;
  }
);
