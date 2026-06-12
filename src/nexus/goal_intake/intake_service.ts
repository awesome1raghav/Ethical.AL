'use server';
/**
 * @fileOverview Nexus Intelligence Intake Service.
 * Extracts mission parameters from natural language descriptions.
 */

import {ai} from '@/core/ai';
import {z} from 'genkit';

const IntakeInputSchema = z.object({
  missionDescription: z.string().describe('Natural language description of the mission.'),
});
export type IntakeInput = z.infer<typeof IntakeInputSchema>;

const IntakeOutputSchema = z.object({
  intent: z.string(),
  estimatedAgents: z.string(),
  estimatedDuration: z.string(),
  riskLevel: z.enum(['Low', 'Medium', 'High', 'Critical']),
  policyPreCheck: z.enum(['Permitted', 'Requires Review', 'Denied']),
  confidenceScore: z.number().min(0).max(100),
});
export type IntakeOutput = z.infer<typeof IntakeOutputSchema>;

export async function naturalLanguageMissionIntake(input: IntakeInput): Promise<IntakeOutput> {
  const {output} = await intakePrompt(input);
  if (!output) throw new Error('Intake extraction failed.');
  return output;
}

const intakePrompt = ai.definePrompt({
  name: 'intakePrompt',
  input: {schema: IntakeInputSchema},
  output: {schema: IntakeOutputSchema},
  prompt: `Analyze the following mission and extract operational parameters:
  
  Mission: {{{missionDescription}}}
  
  Identify intent, agents, duration, risk, and policy alignment.`,
});
