import { naturalLanguageMissionIntake } from './src/ai/flows/natural-language-mission-intake';
import { db } from './src/lib/db';

async function test() {
  console.log("DB Loaded. Agents count:", db.prepare('SELECT COUNT(*) as count FROM agents_registry').get());
  
  console.log("Testing Genkit intake...");
  try {
    const res = await naturalLanguageMissionIntake({ missionDescription: "Test intent engine", priorOutputs: [] });
    console.log("Result intent:", res.primary_intent);
  } catch(e) {
    console.error("Genkit error:", e);
  }
}

test();
