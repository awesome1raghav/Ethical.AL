import { config } from 'dotenv';
config();

// Standardize imports to architectural layers
import '@/nexus/goal_intake/intake_service.ts';
import '@/sovereign/enforcer/policy_check.ts';
