// Post-processing filter to catch AI hallucinations
// Scans responses for forbidden claims and replaces them with safe fallbacks
import { PLATFORM_FACTS } from './platform-facts';

export function validateAIResponse(response: string): {
  text: string;
  wasFiltered: boolean;
} {
  const lower = response.toLowerCase();

  // Check for forbidden claims from platform facts
  const violations = PLATFORM_FACTS.forbiddenClaims.filter((claim) =>
    lower.includes(claim.toLowerCase())
  );

  // Check for additional forbidden university names
  const forbiddenUniversities = [
    'oxford',
    'cambridge',
    'harvard',
    'mit',
    'stanford',
    'yale',
    'princeton',
    'ucla',
    'nyu',
    'usc',
    'uc berkeley',
    'toronto',
    'mcgill',
    'melbourne',
    'anu',
    'unsw',
    'usyd',
    'imperial',
  ];

  const foundUniversities = forbiddenUniversities.filter((u) =>
    lower.includes(u)
  );

  const allViolations = [...violations, ...foundUniversities];

  if (allViolations.length > 0) {
    // Log for monitoring
    console.error('⚠️ AI Hallucination detected:', allViolations);

    // Return a safe fallback
    return {
      text: `I don't have that information. A+ Mentality is a Zambian academic platform focused on serving institutions within Zambia. For accurate details, please contact support@aplusmentality.com.

**Want to know more?**
• Which Zambian universities are supported?
• How do I sign up?
• What features exist today?`,
      wasFiltered: true,
    };
  }

  return { text: response, wasFiltered: false };
}
