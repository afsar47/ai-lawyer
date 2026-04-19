export type Jurisdiction = 'global_generic' | 'us' | 'uk' | 'eu_generic';

export function getJurisdictionDisplayName(jurisdiction: Jurisdiction): string {
  switch (jurisdiction) {
    case 'us':
      return 'United States';
    case 'uk':
      return 'United Kingdom';
    case 'eu_generic':
      return 'European Union (generic)';
    case 'global_generic':
    default:
      return 'Global / Generic';
  }
}

export function getLegalDisclaimerText(jurisdiction: Jurisdiction): string {
  const jurisdictionName = getJurisdictionDisplayName(jurisdiction);
  return `Not legal advice. I’m an AI assistant and not a lawyer. For advice on your specific situation, consult a qualified attorney licensed in the relevant jurisdiction. (Jurisdiction setting: ${jurisdictionName}.)`;
}

export function ensureLegalDisclaimer(content: string, jurisdiction: Jurisdiction): string {
  const lower = content.toLowerCase();
  const hasNotLegalAdvice = lower.includes('not legal advice');
  const hasConsultAttorney =
    lower.includes('consult') && (lower.includes('attorney') || lower.includes('lawyer'));

  if (hasNotLegalAdvice && hasConsultAttorney) return content;

  const disclaimer = getLegalDisclaimerText(jurisdiction);
  return `${content.trim()}\n\n---\n${disclaimer}\n`;
}

export function buildLegalAssistantPrompt(args: {
  userMessage: string;
  jurisdiction: Jurisdiction;
  contextData?: string;
}): string {
  const jurisdictionName = getJurisdictionDisplayName(args.jurisdiction);

  return [
    `You are an AI legal assistant for a law firm management system.`,
    `You provide general legal information, drafting support, and issue-spotting. You do NOT provide legal advice.`,
    `Firm default jurisdiction setting: ${jurisdictionName}.`,
    ``,
    `Rules:`,
    `- Ask 2-5 focused clarifying questions if needed before drafting.`,
    `- Prefer structured outputs: Issues, Options, Risks, Next steps.`,
    `- Use neutral, non-authoritative language. Do not claim attorney-client relationship.`,
    `- Always include a short disclaimer at the end: "Not legal advice" + "consult a qualified attorney".`,
    ``,
    args.contextData
      ? `Context (from the system database; may be incomplete):\n${args.contextData}\n`
      : '',
    `User request:`,
    args.userMessage,
  ]
    .filter(Boolean)
    .join('\n');
}

