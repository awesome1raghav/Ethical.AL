"use server";

export type CitadelExecuteResult = {
  output: string;
  logs: string[];
  policiesChecked: Array<{ policyName: string; passed: boolean; reason: string }>;
  securityStatus: 'safe' | 'alert' | 'blocked';
};

export async function runCitadelAgentStep(
  missionInput: string,
  stepName: string,
  agentName: string,
  previousOutputs: string[]
): Promise<CitadelExecuteResult> {
  const CITADEL_URL = process.env.CITADEL_API_URL || 'http://localhost:3003';
  
  try {
    const response = await fetch(`${CITADEL_URL}/api/execute-step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        missionInput,
        stepName,
        agentName,
        previousOutputs
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Citadel API error (${response.status}): ${errText}`);
    }

    const data = await response.json() as CitadelExecuteResult;
    return data;
  } catch (error: any) {
    console.error("Failed to execute Citadel agent step:", error);
    // Return a structured error response that matches the expected format
    return {
      output: `[ERROR] Failed to execute step via Citadel Backend: ${error.message}`,
      logs: [`[SYSTEM ERROR] ${error.message}`],
      policiesChecked: [],
      securityStatus: 'alert',
    };
  }
}
