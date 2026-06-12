'use server';

import {runResearchAgent, type ResearchAgentInput, type ResearchAgentOutput} from '@/ai/flows/research-agent-deep-research';

export async function researchWithDeepResearchAgent(
  input: ResearchAgentInput
): Promise<ResearchAgentOutput> {
  return runResearchAgent(input);
}