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

  // Check for wrong phone numbers — any phone-like pattern that isn't our number
  const correctPhone = '+260772231300';
  const correctPhoneDisplay = '+260 77 223 1300';
  const correctWhatsAppLink = 'wa.me/260772231300';

  // Detect phone number patterns (digits with optional +, spaces, dashes)
  const phonePattern = /\+?\d[\d\s\-]{7,}\d/g;
  const phonesFound = response.match(phonePattern) || [];
  const wrongPhones = phonesFound.filter(
    (p) =>
      p.replace(/[\s-]/g, '') !== correctPhone.replace(/[\s-]/g, '') &&
      p !== correctPhoneDisplay
  );

  // Check for wrong WhatsApp links
  const whatsappLinkPattern = /wa\.me\/[\d+]+/g;
  const whatsappLinksFound = response.match(whatsappLinkPattern) || [];
  const wrongWhatsAppLinks = whatsappLinksFound.filter(
    (link) => link !== correctWhatsAppLink
  );

  const allViolations = [
    ...violations,
    ...foundUniversities,
    ...wrongPhones.map((p) => `wrong phone: ${p}`),
    ...wrongWhatsAppLinks.map((l) => `wrong WhatsApp link: ${l}`),
  ];

  if (allViolations.length > 0) {
    // Log for monitoring
    console.error('⚠️ AI Hallucination detected:', allViolations);

    // Return a safe fallback
    const c = PLATFORM_FACTS.contact;
    return {
      text: `I don't have that information. A+ Mentality is a Zambian academic platform focused on serving institutions within Zambia.

**How to reach us:**
📧 Email: ${c.email}
📞 Phone: ${c.phoneDisplay}
💬 WhatsApp: ${c.whatsappDisplay}

**Want to know more?**
• Which Zambian universities are supported?
• How do I sign up?
• What features exist today?`,
      wasFiltered: true,
    };
  }

  return { text: response, wasFiltered: false };
}
