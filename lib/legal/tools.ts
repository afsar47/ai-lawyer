import type { Jurisdiction } from './prompt';
import { getJurisdictionDisplayName } from './prompt';

type Common = {
  jurisdiction: Jurisdiction;
};

export function buildEngagementLetterDraftPrompt(args: Common & {
  clientName?: string;
  firmName?: string;
  matterDescription?: string;
  feeStructure?: string;
  notes?: string;
}): string {
  return [
    `Draft an engagement/retainer letter for a law firm.`,
    `Jurisdiction conventions: ${getJurisdictionDisplayName(args.jurisdiction)}.`,
    ``,
    `Include: scope of representation, fees/retainer, billing practices, client responsibilities, conflicts, confidentiality, termination, and signature blocks.`,
    `Use placeholders where details are missing.`,
    ``,
    `Inputs:`,
    `- Firm: ${args.firmName || '[Firm name]'}`,
    `- Client: ${args.clientName || '[Client name]'}`,
    `- Case: ${args.matterDescription || '[Case description]'}`,
    `- Fee structure: ${args.feeStructure || '[Fee structure]'}`,
    args.notes ? `- Notes: ${args.notes}` : '',
    ``,
    `Output format:`,
    `1) 3-6 clarifying questions (if needed)`,
    `2) Draft letter`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildDemandLetterDraftPrompt(args: Common & {
  sender?: string;
  recipient?: string;
  facts?: string;
  demands?: string;
  deadlines?: string;
  notes?: string;
}): string {
  return [
    `Draft a demand letter.`,
    `Jurisdiction conventions: ${getJurisdictionDisplayName(args.jurisdiction)}.`,
    ``,
    `Be factual, professional, and non-defamatory. Avoid asserting legal conclusions as certainty.`,
    `Include: background, key facts, damages/impact (if applicable), demand terms, deadline, and next steps.`,
    ``,
    `Inputs:`,
    `- Sender: ${args.sender || '[Sender / firm]'}`,
    `- Recipient: ${args.recipient || '[Recipient]'}`,
    `- Facts: ${args.facts || '[Facts]'} `,
    `- Demands: ${args.demands || '[Demands]'} `,
    `- Deadline: ${args.deadlines || '[Deadline]'} `,
    args.notes ? `- Notes: ${args.notes}` : '',
    ``,
    `Output format:`,
    `1) 3-6 clarifying questions (if needed)`,
    `2) Draft letter`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildNdaDraftPrompt(args: Common & {
  disclosingParty?: string;
  receivingParty?: string;
  purpose?: string;
  term?: string;
  notes?: string;
}): string {
  return [
    `Draft a mutual NDA (confidentiality agreement) suitable as a starting template.`,
    `Jurisdiction conventions: ${getJurisdictionDisplayName(args.jurisdiction)}.`,
    ``,
    `Include: definitions, exclusions, permitted use, disclosure restrictions, standard of care, term, return/destruction, remedies, no license, no obligation, governing law/venue placeholder, and signatures.`,
    `Use conservative, standard language; mark negotiable clauses.`,
    ``,
    `Inputs:`,
    `- Disclosing party: ${args.disclosingParty || '[Party A]'}`,
    `- Receiving party: ${args.receivingParty || '[Party B]'}`,
    `- Purpose: ${args.purpose || '[Purpose]'}`,
    `- Term: ${args.term || '[Term]'}`,
    args.notes ? `- Notes: ${args.notes}` : '',
    ``,
    `Output format:`,
    `1) 3-6 clarifying questions (if needed)`,
    `2) Draft NDA`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildClientIntakeSummaryPrompt(args: Common & {
  intakeNotes: string;
}): string {
  return [
    `Summarize client intake notes into a structured matter summary.`,
    `Jurisdiction conventions: ${getJurisdictionDisplayName(args.jurisdiction)}.`,
    ``,
    `Output sections:`,
    `- Summary`,
    `- Parties`,
    `- Key facts (timeline)`,
    `- Issues / questions`,
    `- Risks / red flags`,
    `- Proposed next steps`,
    `- Missing information (clarifying questions)`,
    ``,
    `Intake notes:`,
    args.intakeNotes,
  ].join('\n');
}

export function buildContractReviewPrompt(args: Common & {
  contractText: string;
  context?: string;
}): string {
  return [
    `Review the following contract/document and produce:`,
    `1) Executive summary (5-10 bullets)`,
    `2) Key obligations (by party)`,
    `3) Risk flags (with severity low/med/high and why)`,
    `4) Suggested clause edits (plain language)`,
    `5) Questions to ask before signing`,
    ``,
    `Jurisdiction conventions: ${getJurisdictionDisplayName(args.jurisdiction)}.`,
    args.context ? `Context: ${args.context}` : '',
    ``,
    `Document text:`,
    args.contractText,
  ]
    .filter(Boolean)
    .join('\n');
}

