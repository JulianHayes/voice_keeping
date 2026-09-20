import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.use(express.json());

// Lazy-initialize Gemini client
let aiClient = null;
function getAIClient() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// UK English Detection and Conversion Dictionary
const UK_SPELLING_MAP = [
  [/\bcolor\b/gi, 'colour'],
  [/\bcolors\b/gi, 'colours'],
  [/\bcolored\b/gi, 'coloured'],
  [/\bcoloring\b/gi, 'colouring'],
  [/\bhonor\b/gi, 'honour'],
  [/\bhonors\b/gi, 'honours'],
  [/\bhonored\b/gi, 'honoured'],
  [/\blabor\b/gi, 'labour'],
  [/\blabors\b/gi, 'labours'],
  [/\bflavor\b/gi, 'flavour'],
  [/\bflavors\b/gi, 'flavours'],
  [/\bfavor\b/gi, 'favour'],
  [/\bfavors\b/gi, 'favours'],
  [/\bfavored\b/gi, 'favoured'],
  [/\bfavorite\b/gi, 'favourite'],
  [/\bfavorites\b/gi, 'favourites'],
  [/\bbehavior\b/gi, 'behaviour'],
  [/\bbehaviors\b/gi, 'behaviours'],
  [/\bneighbor\b/gi, 'neighbour'],
  [/\bneighbors\b/gi, 'neighbours'],
  [/\bneighborhood\b/gi, 'neighbourhood'],
  [/\bcenter\b/gi, 'centre'],
  [/\bcenters\b/gi, 'centres'],
  [/\bcentered\b/gi, 'centred'],
  [/\btheater\b/gi, 'theatre'],
  [/\btheaters\b/gi, 'theatres'],
  [/\bmeter\b/gi, 'metre'],
  [/\bmeters\b/gi, 'metres'],
  [/\bfiber\b/gi, 'fibre'],
  [/\bfibers\b/gi, 'fibres'],
  [/\bdefense\b/gi, 'defence'],
  [/\bdefenses\b/gi, 'defences'],
  [/\boffense\b/gi, 'offence'],
  [/\boffenses\b/gi, 'offences'],
  [/\blicense (agreement|fee|holder|number|plate|renewal|requirement)\b/gi, 'licence $1'],
  [/\b(a|the|our|your|merchant|banking|operating|software) license\b/gi, '$1 licence'],
  [/\bcanceled\b/gi, 'cancelled'],
  [/\bcanceling\b/gi, 'cancelling'],
  [/\btraveling\b/gi, 'travelling'],
  [/\btraveled\b/gi, 'travelled'],
  [/\btraveler\b/gi, 'traveller'],
  [/\btravelers\b/gi, 'travellers'],
  [/\bmodeling\b/gi, 'modelling'],
  [/\bmodeled\b/gi, 'modelled'],
  [/\bleveling\b/gi, 'levelling'],
  [/\benrollment\b/gi, 'enrolment'],
  [/\benrollments\b/gi, 'enrolments'],
  [/\bfulfill\b/gi, 'fulfil'],
  [/\bprogram\b/gi, 'programme'],
  [/\bprograms\b/gi, 'programmes'],
  [/\boptimize\b/gi, 'optimise'],
  [/\boptimizes\b/gi, 'optimises'],
  [/\boptimized\b/gi, 'optimised'],
  [/\boptimizing\b/gi, 'optimising'],
  [/\boptimization\b/gi, 'optimisation'],
  [/\boptimizations\b/gi, 'optimisations'],
  [/\borganize\b/gi, 'organise'],
  [/\borganizes\b/gi, 'organises'],
  [/\borganized\b/gi, 'organised'],
  [/\borganizing\b/gi, 'organising'],
  [/\borganization\b/gi, 'organisation'],
  [/\borganizations\b/gi, 'organisations'],
  [/\borganizational\b/gi, 'organisational'],
  [/\bprioritize\b/gi, 'prioritise'],
  [/\bprioritizes\b/gi, 'prioritises'],
  [/\bprioritized\b/gi, 'prioritised'],
  [/\bprioritizing\b/gi, 'prioritising'],
  [/\bprioritization\b/gi, 'prioritisation'],
  [/\bcustomize\b/gi, 'customise'],
  [/\bcustomizes\b/gi, 'customises'],
  [/\bcustomized\b/gi, 'customised'],
  [/\bcustomizing\b/gi, 'customising'],
  [/\bcustomization\b/gi, 'customisation'],
  [/\bcustomizations\b/gi, 'customisations'],
  [/\brealize\b/gi, 'realise'],
  [/\brealizes\b/gi, 'realises'],
  [/\brealized\b/gi, 'realised'],
  [/\brealizing\b/gi, 'realising'],
  [/\brecognize\b/gi, 'recognise'],
  [/\brecognizes\b/gi, 'recognises'],
  [/\brecognized\b/gi, 'recognised'],
  [/\banalyze\b/gi, 'analyse'],
  [/\banalyzes\b/gi, 'analyses'],
  [/\banalyzed\b/gi, 'analysed'],
  [/\banalyzing\b/gi, 'analysing'],
  [/\bauthorize\b/gi, 'authorise'],
  [/\bauthorizes\b/gi, 'authorises'],
  [/\bauthorized\b/gi, 'authorised'],
  [/\bauthorizing\b/gi, 'authorising'],
  [/\bauthorization\b/gi, 'authorisation'],
  [/\bstandardize\b/gi, 'standardise'],
  [/\bstandardizes\b/gi, 'standardises'],
  [/\bstandardized\b/gi, 'standardised'],
  [/\bstandardizing\b/gi, 'standardising'],
  [/\bstandardization\b/gi, 'standardisation'],
  [/\bspecialize\b/gi, 'specialise'],
  [/\bspecializes\b/gi, 'specialises'],
  [/\bspecialized\b/gi, 'specialised'],
  [/\bspecializing\b/gi, 'specialising'],
  [/\bspecialization\b/gi, 'specialisation'],
  [/\bmaximize\b/gi, 'maximise'],
  [/\bmaximized\b/gi, 'maximised'],
  [/\bminimize\b/gi, 'minimise'],
  [/\bminimized\b/gi, 'minimised'],
  [/\bcapitalized\b/gi, 'capitalised'],
  [/\bcentralized\b/gi, 'centralised'],
  [/\bmonetize\b/gi, 'monetise'],
  [/\bmonetized\b/gi, 'monetised'],
  [/\bcatalog\b/gi, 'catalogue'],
  [/\bdialog\b/gi, 'dialogue'],
  [/\bpercent\b/gi, 'per cent']
];

function convertToUKEnglish(text) {
  if (!text) return text;
  let res = text;
  for (const [pattern, replacement] of UK_SPELLING_MAP) {
    res = res.replace(pattern, (match) => {
      if (match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      return replacement;
    });
  }
  return res;
}

function detectUKEnglish(text = '', brandName = '', brandPrinciples = '', brandGuidelines = '', clientIsUK = false) {
  if (clientIsUK) return true;
  const sample = `${text} ${brandName} ${brandPrinciples} ${brandGuidelines}`.toLowerCase();

  const ukPatterns = [
    /\b(colour|colours|coloured|colouring|honour|honours|honoured|honouring|labour|labours|laboured|neighbour|neighbours|neighbourhood|neighbourhoods|flavour|flavours|flavoured|favour|favours|favoured|favourite|favourites|harbour|harbours|rumour|rumours|humour|humorous|splendour|vigour|glamour|behaviour|behaviours)\b/i,
    /\b(organise|organised|organises|organising|organisation|organisations|organisational|prioritise|prioritised|prioritises|prioritising|prioritisation|customise|customised|customises|customising|customisation|customisations|optimise|optimised|optimises|optimising|optimisation|minimise|minimised|minimises|minimising|realise|realised|realises|realising|specialise|specialised|specialises|specialising|specialisation|recognise|recognised|recognises|recognising|analyse|analysed|analyses|analysing|authorise|authorised|authorises|authorising|authorisation|maximise|maximised|maximises|maximising|standardise|standardised|standardising|standardisation|initialise|initialised|initialises|initialising|emphasise|emphasised|emphasising|synthesise|synthesised|scrutinise|scrutinised|capitalise|capitalised|centralise|centralised|monetise|monetised)\b/i,
    /\b(centre|centres|centred|centring|theatre|theatres|metre|metres|fibre|fibres|calibre|sombre|litre|litres)\b/i,
    /\b(travelling|travelled|traveller|travellers|cancelling|cancelled|cancellation|cancellations|levelling|levelled|modelling|modelled|signalling|signalled|fulfil|enrol|enrolment|skilful)\b/i,
    /\b(defence|defences|offence|offences|pretence|licence|licences)\b/i,
    /\b(catalogue|catalogues|dialogue|dialogues|analogue|analogues)\b/i,
    /\b(whilst|amongst|learnt|spelt|dreamt|cheque|cheques|programme|programmes|aeroplane|aeroplanes|tyre|tyres|grey|greyer|greyest|per cent|fca|fca-regulated|bank of england|hmrc)\b/i,
    /[£]\s*\d+|\b(gbp|pounds? sterling|pence)\b/i
  ];

  return ukPatterns.some(rx => rx.test(sample));
}

// Deterministic rule-based fallback rewrite in case no API key is provided
function generateFallbackOptions(originalText, findings = [], brandName = '', brandPrinciples = '', brandGuidelines = '', banned = [], subs = {}, isUK = false) {
  const isSaarinen = (brandName && /saarinen|modernist|arch/i.test(brandName)) || /organic|sculptural|architectural/i.test(brandPrinciples);
  const isFintech = (brandName && /fintech|compliance/i.test(brandName)) || /fca|prudent|measured/i.test(brandPrinciples);
  const hasBrand = (brandName && brandName !== 'No Guidelines (Raw Screening)') || (brandPrinciples && brandPrinciples.length > 5);

  let option1, option2, option3;
  let interp1, interp2, interp3;

  if (isSaarinen) {
    interp1 = "Channels Mid-Century Modernist principles into rhythmic, conversational cadence, emphasizing structural clarity and honest functional design.";
    option1 = "Here is what we build: technology with clean lines, honest structure, and zero pretense. No hype. No unverified claims. Just dependable systems designed to do what they promise.\n\nProtected by continuous encryption protocols and audited standards. Simple, transparent terms for every team.\n\nSettlement completes in 2 business days. Form following function.";

    interp2 = "Translates modernist architectural restraint into an evocative narrative of raw materials, functional discipline, and lasting craft.";
    option2 = "A good structure doesn't demand attention with loud signs. It stands because the foundation is sound.\n\nWe don't manufacture miraculous shortcuts. What we craft is quiet, disciplined infrastructure: independently verified security, zero hidden fees, and payments that move without friction.\n\nClear agreements. 2-day settlements. Built for those who value enduring craft.";

    interp3 = "Applies modernist principles through direct-response clarity, converting functional elegance into scannable structural benefits.";
    option3 = "Architectural payment processing engineered for structural integrity.\n\n• Verified Defense: Continuous 256-bit encryption verified through independent third-party audits.\n• Clear Terms: Transparent account setup with no hidden maintenance fees.\n• Dependable Cadence: Predictable 2-day settlement cycles for all reconciled accounts.\n\nReview our architectural specifications to evaluate the system.";
  } else if (isFintech) {
    interp1 = "Interprets fintech compliance rules through friendly, plainspoken plain English, replacing high-pressure urgency with open clarity.";
    option1 = "Let's be open from day one: payment processing should never come with fine print surprises. We build systems that keep your transactions moving smoothly and your compliance intact.\n\nEvery transfer uses 256-bit encryption and undergoes independent audits. Standard accounts carry no setup fee.\n\nSettlement clears in 2 business days. Clear terms, every step of the way.";

    interp2 = "Translates rigorous regulatory standards into an authentic, grounded narrative about institutional trust and transparency.";
    option2 = "Trust in finance isn't won with promises of effortless wealth. It's earned through audited systems and quiet consistency.\n\nWe provide disciplined payment processing: fortified with third-party verified security, structured without speculative claims, and engineered to settle cleanly in 2 business days.\n\nHonest technology. Resilient operations.";

    interp3 = "Channels fintech compliance guidelines into razor-sharp, risk-qualified commercial value propositions and structured disclosures.";
    option3 = "Institutional-grade payment processing with full regulatory transparency.\n\n• Audited Security: Industry-standard 256-bit encryption validated via third-party compliance reviews.\n• Transparent Pricing: Clear standard tier onboarding with no hidden administrative fees.\n• Verified Settlement: Predictable 2 business day settlement schedules for merchant accounts.\n\nAccess our compliance documentation and fee schedule today.";
  } else if (hasBrand) {
    const brandLabel = brandName || 'your brand';
    interp1 = `Interprets the ${brandLabel} guidelines into punchy, conversational plain English and warm, rhythmic cadence, stripping out corporate jargon.`;
    option1 = `Here is how we work: clear communication, tested systems, and zero empty buzzwords. We took your core principles and put them into plain English that speaks directly to your audience.\n\nEvery transaction is protected by 256-bit encryption and reviewed through ongoing compliance audits. Clear, straightforward pricing with no hidden surprises.\n\nSettlement in 2 business days. Direct and dependable.`;

    interp2 = `Translates the ${brandLabel} guidelines into an atmospheric, grounded narrative with visceral sensory imagery and poetic pacing.`;
    option2 = `Good work speaks quietly. It doesn't rely on unprovable promises or shouting from the rooftops.\n\nWe build payment infrastructure grounded in honesty: fortified with audited security, engineered without false urgency, and designed to carry your business forward without drama.\n\nSettlement in 2 business days. Technology that honors the craft.`;

    interp3 = `Applies the ${brandLabel} guidelines through direct-response commercial precision, structuring key value propositions into scannable proof points.`;
    option3 = `High-efficiency payment infrastructure aligned with verified compliance standards.\n\n• Certified Protection: Bank-grade encryption verified through rigorous third-party audits.\n• Transparent Structure: Clear account setup with no hidden maintenance fees or speculative claims.\n• Reliable Settlement: Consistent 2 business day settlement timelines across all reconciled accounts.\n\nConnect with our team to review technical integration specifications.`;
  } else {
    interp1 = "Conversational, rhythmic plain English with friendly cadence and active verbs, removing false urgency and absolute guarantees.";
    option1 = "Here is what we do: we build payments that work when you need them. No buzzwords. No unprovable guarantees. Just clear, tested technology that keeps your money moving and your operations sound.\n\nEvery transfer is protected by 256-bit encryption and audited regularly. Standard accounts are free to set up, with transparent pricing for enterprise features.\n\nSettlement completes in 2 business days. Ready when you are.";

    interp2 = "Visceral narrative perspective with lyrical pacing, gritty honesty, and evocative metaphors.";
    option2 = "Good business doesn't need hype. It needs pipes that don't leak.\n\nWe don't promise miraculous zero-risk windfalls. Nobody honest can. What we deliver is disciplined payment architecture: fortified with rigorous third-party audited security, built without hidden fees, and designed to move funds without drama.\n\nClear terms. Settlement in 2 business days. Work with people who respect the craft.";

    interp3 = "Razor-sharp direct-response clarity with scannable commercial structure, problem-to-solution momentum, and rigorous compliance.";
    option3 = "Modern payment processing built for reliable scale.\n\n• Verified Security: Bank-grade encryption verified through independent third-party audits.\n• Transparent Pricing: Free standard onboarding with no hidden maintenance fees.\n• Dependable Execution: Predictable 2-day settlement cycles for all reconciled accounts.\n\nSet up your merchant account today to review our compliance documentation and test the integration.";
  }

  if (isUK) {
    interp1 = convertToUKEnglish(interp1);
    interp2 = convertToUKEnglish(interp2);
    interp3 = convertToUKEnglish(interp3);
    option1 = convertToUKEnglish(option1);
    option2 = convertToUKEnglish(option2);
    option3 = convertToUKEnglish(option3);
  }

  return [
    {
      option: 1,
      heading: "Option 1",
      brandInterpretation: interp1,
      copy: option1
    },
    {
      option: 2,
      heading: "Option 2",
      brandInterpretation: interp2,
      copy: option2
    },
    {
      option: 3,
      heading: "Option 3",
      brandInterpretation: interp3,
      copy: option3
    }
  ];
}

// Rewrite endpoint
app.post('/api/rewrite', async (req, res) => {
  const {
    text,
    findings = [],
    brandName,
    brandPrinciples,
    brandGuidelines,
    banned = [],
    subs = {},
    isUploadedGuidelines = false,
    isUK: clientIsUK = false
  } = req.body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const guidelinesContent = (brandGuidelines || brandPrinciples || '').trim();
  const hasGuidelines = guidelinesContent.length > 0 && brandName !== 'No Guidelines (Raw Screening)';
  const isUK = detectUKEnglish(text, brandName, brandPrinciples, brandGuidelines, clientIsUK);

  const ai = getAIClient();

  if (!ai) {
    // If no API key configured, return high-craft rule-based rewrites reflecting brand guidelines and UK English
    return res.json({
      success: true,
      options: generateFallbackOptions(text, findings, brandName, brandPrinciples, brandGuidelines, banned, subs, isUK),
      isUK,
      source: 'fallback'
    });
  }

  try {
    const findingsSummary = findings.length
      ? findings.map(f => {
          const capInfo = f.capRule ? ` [UK CAP Code ${f.capRule}${f.capSection ? ` §${f.capSection}` : ''}]` : '';
          return `- [${f.sev.toUpperCase()}]${capInfo} ${f.rule}: Flagged text "${f.text}" -> ${f.msg} (Required Fix: ${f.fix})`;
        }).join('\n')
      : 'General promotional tone, unevidenced claims, and lack of compliance precision.';

    const systemPrompt = `You are an elite master copywriter and advertising compliance specialist accredited in UK Advertising Standards (ASA / CAP Code Edition 12, 2024).
Your task is to take drafted promotional copy that has been flagged for regulatory breaches and governance issues, and produce exactly THREE distinct rewrites that address and fix ALL governance and regulatory breaches.

CRITICAL REGULATORY COMPLIANCE MANDATES (UK CAP CODE & FCA STANDARDS):
1. CAP Code §3.7 & §3.8 — SUBSTANTIATION & CONSUMER PERCEPTION:
   - Marketers must hold documentary evidence before publication for all objective claims. Adequacy of evidence is judged against the claim as the consumer is likely to understand it.
   - Eliminate or qualify proof claims ("clinically proven", "scientifically proven", "doctor recommended"). Replace with verifiable, objective facts or reference specific published trials/audits.
   - Eliminate absolute security claims ("100% secure", "unhackable", "completely safe"). Consumers perceive these as guarantees against all future threats; replace with audited technical safeguards (e.g. "256-bit AES encryption", "SOC-2 Type II certified infrastructure").

2. CAP Code §3.33 — COMPARISONS WITH IDENTIFIABLE COMPETITORS:
   - Superiority claims ("better than all competitors", "cheaper than rivals", "outperforms all others") must compare like-with-like objectively, must not unfairly denigrate competitors, and must signpost verifiable evidence accessible to consumers.
   - Replace aggressive or unevidenced comparative claims with distinctive, self-standing objective benefits.

3. CAP Code §3.33 / CAP 11 — ENVIRONMENTAL & GREEN CLAIMS (ASA 2023 Guidance & CMA Green Claims Code):
   - Life-Cycle Basis: The basis of environmental claims must be stated clearly. Claims must reflect the entire life-cycle of the product or service unless explicitly qualified.
   - Absolute Green Claims: Absolute environmental claims ("carbon neutral", "net zero", "eco-friendly", "planet-positive") must be substantiated by a high level of robust evidence covering all scopes of emissions. If based on offsetting, the scheme standard must be transparently disclosed.
   - Narrow broad claims (e.g. change "eco-friendly packaging" to "bottle made from 100% post-consumer recycled plastic, excluding cap").

4. CAP Code §3.1, §3.23 & DMCC ACT 2024 — MISLEADING CLAIMS, FALSE URGENCY & 'FREE':
   - Eliminate false scarcity and urgency ("won't last", "act now", "last chance", "hurry", "offer ends soon") unless a genuine, verifiable deadline or scarcity applies.
   - Eliminate absolute guarantees of profit or zero risk ("guaranteed returns", "risk-free", "zero risk"). In financial promotions, state risks prominently.
   - Qualify "free" claims at the point of communication if conditions or paid tiers apply (Rule 3.23).

5. GENERAL COPY MECHANICS & TONE:
   - Eliminate unevidenced superlatives ("world-class", "best-in-class", "unbeatable").
   - Eliminate exclamation marks and shouting. Let the facts do the persuading.

CRITICAL MANDATE — EACH REWRITE MUST EXPLICITLY REMEDIATE IDENTIFIED BREACHES:
Each proposed rewrite alternative MUST directly resolve every regulatory breach flagged in the review while preserving commercial vitality and punch.

CRITICAL DIALECT & SPELLING LOCALISATION MANDATE:
${isUK ? `THE INPUT TEXT IS IN UK ENGLISH (British English).
All THREE rewritten options and all brand interpretations MUST be written strictly in UK ENGLISH (British English spelling, grammar, punctuation, and idioms).
- MANDATORY UK SPELLINGS (NEVER use US spellings):
  * -ise / -isation: e.g. optimise, customise, organise, prioritise, categorise, recognise, authorise, specialise, analyse, standardise, capitalise. (NEVER optimize, customize, organize, prioritize, analyze, recognize, specialize).
  * -our: e.g. colour, behaviour, honour, labour, flavour, neighbour, favourite. (NEVER color, behavior, honor, labor, flavor).
  * -re: e.g. centre, theatre, metre, fibre, calibre. (NEVER center, theater, meter, fiber).
  * -ence: e.g. defence, offence, licence (noun). (NEVER defense, offense, license as a noun).
  * double-l: e.g. cancelled, cancelling, travelling, travelled, traveller, modelled, levelling, enrolment, fulfil. (NEVER canceled, traveling).
  * vocabulary & style: e.g. programme (not program for non-software), per cent (not percent), whilst, amongst.
- Match the UK English tone and vocabulary faithfully.` : `Preserve the spelling dialect of the input text. If the input text is in UK English, use UK English across all options; if US English is used, adhere to US conventions.`}

STYLISTIC FOUNDATIONS FOR THE 3 OPTIONS:
- Option 1 must be written in the distinct stylistic voice of Vikki Ross: conversational, rhythmic, punchy, human, warm, using everyday British-influenced plain English, active verbs, subtle repetition, and musical cadence.
- Option 2 must be written in the distinct stylistic voice of Cole Schafer: visceral, narrative-driven, lyrical cadence, gritty, evocative metaphors, short poetic lines, and authentic storytelling.
- Option 3 must be written in the distinct stylistic voice of Alex Catoni: razor-sharp direct-response clarity, crisp value proposition, problem-to-solution momentum, scannable precision, and high-converting commercial punch.

CRITICAL REQUIREMENT — HOW THE 3 WRITERS MUST INTERPRET THE BRAND VOICE GUIDELINES:
${hasGuidelines ? `The client has provided specific Brand Voice Guidelines (${isUploadedGuidelines ? 'uploaded from their guidelines document' : 'configured tone rules'}).
Each of the 3 writers MUST uniquely interpret and channel these brand guidelines through their signature copywriting lens:
- Option 1 (Vikki Ross lens): Interprets the brand guidelines through human, conversational warmth. She absorbs the brand's tone pillars, personality, and values, translating them into friendly plain English, relatable everyday dialogue, short punchy sentences, and effortless cadence without losing the brand's core essence.
- Option 2 (Cole Schafer lens): Interprets the brand guidelines through visceral narrative storytelling. He absorbs the brand's ethos and guidelines, translating them into evocative imagery, poetic pacing, authentic texture, and grounded emotional depth.
- Option 3 (Alex Catoni lens): Interprets the brand guidelines through razor-sharp direct-response commercial precision. He translates the brand's positioning and rules into high-converting clarity, undeniable value propositions, scannable bullet points or structured flow, and persuasive commercial momentum.
- All 3 writers must strictly obey the brand's banned words (never use them under any circumstance) and seamlessly incorporate preferred vocabulary substitutions.` : `No custom brand guidelines are set. The 3 writers should each interpret the copy with universal clarity and regulatory discipline through their signature stylistic voices.`}

IMPORTANT CONSTRAINTS:
- DO NOT INCLUDE OR MENTION THE NAMES OF THE COPYWRITERS (Vikki Ross, Cole Schafer, Alex Catoni) anywhere in your output.
- Label the options strictly as "Option 1", "Option 2", and "Option 3".
- Include a "brandInterpretation" field for each option: A concise 1-2 sentence description explaining how this writer's distinctive lens interpreted and applied the brand voice guidelines to the copy (written objectively without naming any writers, e.g. "Channels the brand guidelines into rhythmic, conversational plain English and warm, relatable cadence, removing corporate jargon." or "Interprets the guidelines through visceral narrative depth, using grounded sensory metaphors to express the brand's craftsmanship.").
${isUK ? '- Ensure all brandInterpretation descriptions and all copy options are written with British/UK English spelling (e.g. "rhythmic, conversational", "focused on defence and organised operations").' : ''}
- Do not add meta-commentary, markdown backticks outside JSON, or conversational filler.
- Return ONLY a valid JSON object matching this schema:
{
  "options": [
    {
      "option": 1,
      "heading": "Option 1",
      "brandInterpretation": "...",
      "copy": "..."
    },
    {
      "option": 2,
      "heading": "Option 2",
      "brandInterpretation": "...",
      "copy": "..."
    },
    {
      "option": 3,
      "heading": "Option 3",
      "brandInterpretation": "...",
      "copy": "..."
    }
  ]
}`;

    const userPrompt = `ORIGINAL FLAGGED COPY:
"""
${text}
"""

GOVERNANCE FINDINGS TO FIX:
${findingsSummary}

${isUK ? `IMPORTANT: The input copy is in UK English. All outputted text and brand interpretations MUST be strictly in UK English.\n` : ''}
${hasGuidelines ? `
======================================================
CLIENT BRAND VOICE GUIDELINES (${isUploadedGuidelines ? 'UPLOADED DOCUMENT' : 'ACTIVE BRAND RULES'}):
Brand Name: ${brandName || 'Client Brand'}
Guidelines & Principles:
"""
${guidelinesContent}
"""
${Object.keys(subs).length ? `Preferred Term Substitutions:\n${Object.entries(subs).map(([k, v]) => `• Use "${v}" instead of "${k}"`).join('\n')}` : ''}
${banned.length ? `Banned Words & Lexicon to Strictly Avoid: ${banned.join(', ')}` : ''}
======================================================
` : 'No custom brand guidelines provided.'}

Generate the 3 compliant rewritten versions in JSON format now, ensuring all 3 options distinctly reflect how the 3 writers interpreted the brand guidelines while resolving every regulatory finding${isUK ? ' using strict UK English' : ''}.`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        }
      });
    } catch (modelErr) {
      // Fallback to gemini-3.1-flash-lite if flash is experiencing temporary spikes
      console.warn('Primary model error, attempting fallback model:', modelErr?.message);
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        }
      });
    }

    const responseText = response.text?.trim() || '{}';
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (e) {
      // Clean possible wrapper
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Could not parse JSON response from model');
      }
    }

    if (parsed && Array.isArray(parsed.options) && parsed.options.length >= 3) {
      // Ensure copywriter names are scrubbed if any slipped in, and apply UK English conversion if detected
      const scrubbed = parsed.options.slice(0, 3).map((opt, i) => {
        let copy = opt.copy || '';
        let brandInterpretation = opt.brandInterpretation || '';
        copy = copy.replace(/Vikki Ross|Cole Schafer|Alex Catoni/gi, '').trim();
        brandInterpretation = brandInterpretation.replace(/Vikki Ross|Cole Schafer|Alex Catoni/gi, '').trim();

        if (!brandInterpretation) {
          if (i === 0) {
            brandInterpretation = hasGuidelines
              ? `Interprets ${brandName || 'the brand'} guidelines through rhythmic, conversational plain English and warm human cadence.`
              : 'Conversational, rhythmic plain English with friendly cadence and active verbs.';
          } else if (i === 1) {
            brandInterpretation = hasGuidelines
              ? `Translates ${brandName || 'the brand'} guidelines into an evocative narrative perspective with visceral metaphors and poetic pacing.`
              : 'Visceral narrative perspective with lyrical pacing, gritty honesty, and evocative metaphors.';
          } else {
            brandInterpretation = hasGuidelines
              ? `Channels ${brandName || 'the brand'} guidelines through direct-response commercial precision and scannable value claims.`
              : 'Direct-response clarity with scannable commercial structure and problem-to-solution momentum.';
          }
        }

        if (isUK) {
          copy = convertToUKEnglish(copy);
          brandInterpretation = convertToUKEnglish(brandInterpretation);
        }

        return {
          option: i + 1,
          heading: `Option ${i + 1}`,
          brandInterpretation,
          copy
        };
      });
      return res.json({ success: true, options: scrubbed, isUK, source: 'gemini' });
    } else {
      return res.json({
        success: true,
        options: generateFallbackOptions(text, findings, brandName, brandPrinciples, brandGuidelines, banned, subs, isUK),
        isUK,
        source: 'fallback'
      });
    }
  } catch (err) {
    console.error('Gemini rewrite error:', err);
    return res.json({
      success: true,
      options: generateFallbackOptions(text, findings, brandName, brandPrinciples, brandGuidelines, banned, subs, isUK),
      isUK,
      source: 'fallback_error',
      error: err.message
    });
  }
});

// Serve static assets from project root
app.use(express.static(__dirname));

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Voice Governor running on http://${HOST}:${PORT}`);
});

// Hosts that supply their own handler import the app rather than the listener.
export default app;

