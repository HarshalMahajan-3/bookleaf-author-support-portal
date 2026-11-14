import { categories, priorities } from './store.js';

const KNOWLEDGE_BASE = `
BOOKLEAF SUPPORT KNOWLEDGE BASE
Company: BookLeaf Publishing is a self-publishing company operating in India and the US. It offers Standard Free and Bestseller Breakthrough packages and handles cover design, typesetting, ISBN assignment, printing, distribution and royalties. In-house printing and warehouse are in Delhi; print partners include Repro India and Epitome Books.
Royalty: BookLeaf follows an 80/20 split of net profit (80% author, 20% BookLeaf). Net profit is MRP minus printing cost, platform commission and shipping. Royalties are calculated quarterly and paid within 45 days after quarter-end. Minimum payout is ₹1,000; lower balances roll over. Payment is by bank transfer to the account linked in the author dashboard. A detailed platform-wise breakdown is available in the dashboard.
ISBN: Every BookLeaf book receives a unique ISBN registered under BookLeaf's publisher imprint. An author seeking an ISBN under their own imprint must obtain it independently. A duplicate/wrong ISBN or book-linking error is high priority and must be escalated to production with a 48-hour update timeline.
Printing: Most orders are printed in-house; overflow/special formats may go to Repro India or Epitome Books. Standard print turnaround is 5–7 business days from order confirmation. For verified misprints, binding defects or colour inconsistency, BookLeaf arranges a free reprint; ask for photos of the defective copy.
Distribution: Books can be listed on Amazon India, Flipkart, Amazon US, Amazon UK and the BookLeaf Store. New listings usually go live within 7–10 business days after publication is complete. Unavailability can be a stock-sync issue; the team can trigger re-sync and it usually reflects within 24–48 hours.
Production: Stages are Manuscript Received → Editing (if opted) → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup → Published & Live. Authors are updated by email. Delays often occur while awaiting cover approval or during proofreading revisions.
Metadata: A live book description can be updated by submitting a request through the dashboard or emailing BookLeaf. Platform changes typically reflect within 3–5 business days.
Tone: Empathetic, professional, specific and accountable. Acknowledge the concern first. Use known numbers/dates/statuses only; do not invent payout dates or claim an action has happened when it has not. If escalation is needed, give a clear 48-hour update timeline. End with a clear next step.
`;

function matchCategory(text) {
  const t = text.toLowerCase();
  const patterns = [
    ['ISBN & Metadata Issues', /\bisbn\b|metadata error|metadata mismatch|wrong book|duplicate isbn/],
    ['Royalty & Payments', /royalt|payment|payout|paid|pending amount|bank|earning|sales amount|money/],
    ['Printing & Quality', /print|printing|blurry|blurred|misprint|binding|paper|colour|color|alignment|damaged|defect/],
    ['Distribution & Availability', /unavailable|listing not live|listing missing|distribution|stock|marketplace|not available|stock sync|re-sync/],
    ['Book Status & Production Updates', /production|typeset|cover design|proofread|manuscript|publishing status|book status|delay|delayed/],
  ];
  return patterns.find(([, regex]) => regex.test(t))?.[0] || 'General Inquiry';
}

function matchPriority(text, category) {
  const t = text.toLowerCase();
  if (/fraud|unauthori[sz]ed|legal notice|chargeback|data breach|security breach/.test(t)) return 'Critical';
  if (category === 'ISBN & Metadata Issues' || /six months|6 months|not received.*royalt|overdue|urgent|misprint|binding defect|terrible quality|damaged copies/.test(t)) return 'High';
  if (/bio|description|how can i|can i update|general question/.test(t)) return 'Low';
  if (/status|when will|unavailable|stock sync|not showing|pending royalty|delayed/.test(t)) return 'Medium';
  return category === 'General Inquiry' ? 'Medium' : 'Medium';
}

export function fallbackClassification(subject, description) {
  const text = `${subject} ${description}`;
  const category = matchCategory(text);
  const priority = matchPriority(text, category);
  return { category, priority, confidence: 0.72, source: 'rules-fallback' };
}

async function askModel(messages, maxTokens = 350) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
      messages,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`AI provider returned ${response.status}: ${detail.slice(0, 180)}`);
  }
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI provider returned an empty response');
  return JSON.parse(content);
}

export async function classifyTicket(subject, description) {
  try {
    const result = await askModel([
      { role: 'system', content: `Classify an incoming BookLeaf author support ticket. Return JSON only: {"category": one of ${JSON.stringify(categories)}, "priority": one of ${JSON.stringify(priorities)}, "reason": short explanation}. Use Critical only for severe security, legal or fraud concerns; High for ISBN errors, overdue/unreceived royalties or serious print defects; Medium for operational status/distribution issues; Low for simple informational requests. Do not infer facts.` },
      { role: 'user', content: `Subject: ${subject.slice(0, 180)}\nDescription: ${description.slice(0, 1800)}` },
    ], 180);
    if (!categories.includes(result.category) || !priorities.includes(result.priority)) throw new Error('AI classification was outside allowed values');
    return { category: result.category, priority: result.priority, confidence: 0.9, source: 'openai', reason: String(result.reason || '').slice(0, 220) };
  } catch (error) {
    console.warn(`[AI classification fallback] ${error.message}`);
    return fallbackClassification(subject, description);
  }
}

function fallbackDraft(ticket, author, book) {
  const category = ticket.category || matchCategory(`${ticket.subject} ${ticket.description}`);
  const name = author?.name?.split(' ')[0] || 'there';
  const bookTitle = book?.title || ticket.bookTitle || 'your book';
  const intro = `Hi ${name},\n\nThank you for reaching out and for taking the time to explain your concern about ${bookTitle}. I understand why this needs attention.`;
  let body;
  switch (category) {
    case 'Royalty & Payments':
      body = `\n\nBookLeaf calculates royalties quarterly and processes eligible payouts within 45 days after the quarter ends. The minimum payout threshold is ₹1,000; amounts below this threshold roll over to the next quarter. Payments are made to the bank account linked in your author dashboard.\n\nPlease check that your bank details are up to date. Our team can also review the platform-wise royalty breakdown with you. We will verify the payout status against your account records and share a specific update within 48 hours if the payment is overdue.`;
      break;
    case 'ISBN & Metadata Issues':
      body = `\n\nAn ISBN mismatch is important, and I am sorry for the confusion this may cause. Every BookLeaf title is assigned a unique ISBN, so the listing and printed copy should match. We are escalating this to our production team for verification and will share an update within 48 hours.\n\nPlease share a screenshot of the marketplace listing and a clear photo of the ISBN printed in your copy so the team can compare both records.`;
      break;
    case 'Printing & Quality':
      body = `\n\nI am sorry that the copies did not arrive in the expected condition. Please reply with clear photos of the affected pages and the outside of the book, including the binding. Once our team verifies the issue, BookLeaf will arrange a free reprint. The standard print turnaround is 5–7 business days from order confirmation.\n\nWe will review the photos and confirm the next step with you.`;
      break;
    case 'Distribution & Availability':
      body = `\n\nA listing that shows as unavailable can be caused by a stock-sync delay between the marketplace and our distribution records. Our distribution team can trigger a re-sync; availability typically reflects within 24–48 hours.\n\nPlease share the marketplace URL and country/storefront where you are seeing the issue. We will check the listing and confirm the re-sync status.`;
      break;
    case 'Book Status & Production Updates':
      body = `\n\nA book moves through manuscript review, editing (if opted), cover design, typesetting, proofreading, ISBN assignment, printing and distribution setup before it is published live. I do not want to give you an estimated completion date without confirming the current production stage.\n\nOur team will check the latest status and any pending action, then share a clear update within 48 hours. We will also confirm the next milestone so you know what to expect.`;
      break;
    default:
      body = `\n\nWe will review your request with the relevant team and confirm the available next steps. For a live book description or metadata change, requests can be submitted through the dashboard; marketplace updates typically take 3–5 business days after the change is processed.\n\nPlease share any relevant book title, marketplace link or supporting details so we can route this correctly. We will follow up with a clear update within 48 hours if further investigation is required.`;
  }
  return `${intro}${body}\n\nThank you for being part of BookLeaf.\nBookLeaf Author Support`;
}

export async function generateResponseDraft(ticket, author, book) {
  try {
    const compactContext = {
      category: ticket.category,
      subject: ticket.subject.slice(0, 180),
      description: ticket.description.slice(0, 1400),
      authorName: author?.name,
      book: book ? { title: book.title, status: book.status, totalCopiesSold: book.total_copies_sold, royaltyPending: book.royalty_pending, royaltyPaid: book.royalty_paid } : null,
    };
    const result = await askModel([
      { role: 'system', content: `You are a BookLeaf Publishing support representative. Draft one concise, ready-to-send response to the author. Use the knowledge base exactly; be empathetic, accountable and specific. Never invent dates, actions, payout states or facts. Acknowledge first, explain policy relevant to this issue, then give a concrete next step. Do not claim an escalation/re-sync/reprint has already happened unless the ticket data explicitly says so. Return JSON: {"draft":"..."}.\n${KNOWLEDGE_BASE}` },
      { role: 'user', content: `Ticket context (only relevant fields): ${JSON.stringify(compactContext)}` },
    ], 420);
    if (typeof result.draft !== 'string' || result.draft.trim().length < 20) throw new Error('AI draft was empty or too short');
    return { draft: result.draft.trim(), source: 'openai' };
  } catch (error) {
    console.warn(`[AI draft fallback] ${error.message}`);
    return { draft: fallbackDraft(ticket, author, book), source: 'rules-fallback', warning: error.message };
  }
}

export const knowledgeBase = KNOWLEDGE_BASE;
