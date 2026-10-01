export const MAX_DRAFT = 5000;
export const MAX_PROFILE_BYTES = 32000;

function object(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).some(key => !keys.includes(key)) ||
      keys.some(key => !Object.hasOwn(value, key))) {
    throw new Error(`${label} has missing or unrecognised fields.`);
  }
}

function string(value, label, max, allowEmpty = false) {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim()) || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value)) {
    throw new Error(`${label} must be ${allowEmpty ? 'text' : 'non-empty text'} of at most ${max} characters.`);
  }
  return value;
}

function list(value, label, min, max, itemMax) {
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    throw new Error(`${label} needs ${min} to ${max} entries.`);
  }
  const result = value.map(item => string(item, label, itemMax).trim());
  if (result.some(item => /[\r\n]/u.test(item))) throw new Error(`${label} needs one entry per line. An imported entry cannot contain a line break.`);
  if (new Set(result.map(item => item.toLocaleLowerCase('en'))).size !== result.length) {
    throw new Error(`${label} contains duplicate entries.`);
  }
  return result;
}

export function validateProfile(value) {
  object(value, ['format', 'version', 'name', 'audience', 'language', 'principles', 'goodExamples', 'poorExamples', 'avoid', 'preferred'], 'Profile');
  if (value.format !== 'voice-companion' || value.version !== 1) throw new Error('Use a VoiceKeeping version 1 profile exported from this app.');
  if (!['en-GB', 'en-US'].includes(value.language)) throw new Error('Choose UK English or US English.');
  if (!Array.isArray(value.preferred) || value.preferred.length > 50) throw new Error('Preferred wording allows up to 50 pairs.');
  const profile = {
    format: 'voice-companion', version: 1,
    name: string(value.name, 'Brand name', 100).trim(),
    audience: string(value.audience, 'Audience', 600).trim(),
    language: value.language,
    principles: list(value.principles, 'Voice principles', 3, 5, 400),
    goodExamples: list(value.goodExamples, 'Good examples', 0, 6, 600),
    poorExamples: list(value.poorExamples, 'Poor examples', 0, 6, 600),
    avoid: list(value.avoid, 'Words to avoid', 0, 50, 100),
    preferred: value.preferred.map(pair => {
      object(pair, ['from', 'to'], 'Preferred wording');
      const from = string(pair.from, 'Wording to replace', 100).trim();
      const to = string(pair.to, 'Preferred wording', 100).trim();
      if (/[\r\n]/u.test(from + to)) throw new Error('Each preferred wording pair must use one line per field.');
      if (from.toLowerCase() === to.toLowerCase()) throw new Error('Preferred wording must differ from the wording it replaces.');
      return { from, to };
    })
  };
  if (new Set(profile.preferred.map(pair => pair.from.toLowerCase())).size !== profile.preferred.length) throw new Error('Each wording to replace needs just one preferred version.');
  if (new TextEncoder().encode(JSON.stringify(profile)).length > MAX_PROFILE_BYTES) throw new Error('Profile is too large. Keep it below 32 KB.');
  return profile;
}

export function parseProfile(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_PROFILE_BYTES) throw new Error('Choose a profile file smaller than 32 KB.');
  let value;
  try { value = JSON.parse(text.replace(/^\uFEFF/, '')); } catch { throw new Error('This file is not valid JSON. Choose a profile exported from VoiceKeeping.'); }
  return validateProfile(value);
}

export function exportProfile(profile) {
  return JSON.stringify(validateProfile(profile), null, 2) + '\n';
}

export function validateDraft(text) {
  return string(text, 'Draft', MAX_DRAFT);
}

export function profileRules(profile) {
  return [
    { id: 'audience', text: `Write for: ${profile.audience}`, kind: 'tone' },
    { id: 'language', text: profile.language === 'en-GB' ? 'Use UK English.' : 'Use US English.', kind: 'tone' },
    ...profile.principles.map((text, i) => ({ id: `principle-${i + 1}`, text, kind: 'tone' })),
    ...profile.goodExamples.map((text, i) => ({ id: `good-${i + 1}`, text: `Sound like this: ${text}`, kind: 'tone' })),
    ...profile.poorExamples.map((text, i) => ({ id: `poor-${i + 1}`, text: `Avoid this style: ${text}`, kind: 'tone' })),
    ...profile.avoid.map((term, i) => ({ id: `avoid-${i + 1}`, text: `Avoid “${term}”.`, kind: 'word', term })),
    ...profile.preferred.map((pair, i) => ({ id: `preferred-${i + 1}`, text: `Use “${pair.to}” instead of “${pair.from}”.`, kind: 'word', term: pair.from, replacement: pair.to }))
  ];
}

export function wordFindings(text, profile) {
  const findings = [];
  for (const rule of profileRules(profile).filter(rule => rule.kind === 'word')) {
    const escaped = rule.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, 'giu');
    for (const match of text.matchAll(pattern)) {
      findings.push({ start: match.index, end: match.index + match[0].length, quote: match[0], ruleId: rule.id, rule: rule.text, replacement: rule.replacement ?? null,
        reason: 'Exact phrase match, ignoring letter case. Decide whether the rule fits this context.' });
    }
  }
  return findings.sort((a, b) => a.start - b.start || a.end - b.end);
}

// These checks are deliberately conservative. They do not establish factual truth.
const factualPattern = /[\d£$€%]|\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|hundred|thousand|million|billion|half|quarter|first|second|third|days?|weeks?|months?|years?|hours?|minutes?|seconds?|daily|weekly|monthly|annually|tomorrow|today|yesterday|noon|midnight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|before|after|within|until|unless|except|excluding|excluded|exclusions?|conditions?|subject to|provided|only|not|never|no|without|if|when|must|cannot|can't|won't|don't|doesn't|isn't|aren't|free|costs?|prices?|fees?|contains?|includes?|included|guarantee\w*|proven|certified|audited|secure|security|encryption|evidence|research|study|studies|trial|trials)\b/iu;
const namePattern = /\b(?:[A-Z][a-z]+(?:[ '-][A-Z][a-z]+)+|[A-Z]{2,}|[a-z]+[A-Z]\w*|[A-Z][a-z]+)\b/gu;
const sentenceStarters = new Set(['A', 'An', 'The', 'We', 'Our', 'You', 'Your', 'It', 'This', 'That', 'These', 'Those', 'Use', 'Get', 'Try', 'Make', 'Find', 'Choose', 'Start', 'Let', 'Here', 'There', 'With', 'For', 'And', 'But']);

export function protectedSpans(text) {
  const spans = [];
  for (const part of new Intl.Segmenter('en', { granularity: 'sentence' }).segment(text)) {
    if (factualPattern.test(part.segment)) spans.push({ start: part.index, end: part.index + part.segment.length, quote: part.segment.trim(), reason: 'This sentence may contain a fact, claim, time, condition or exclusion.' });
  }
  for (const match of text.matchAll(namePattern)) {
    if (!sentenceStarters.has(match[0])) spans.push({ start: match.index, end: match.index + match[0].length, quote: match[0], reason: 'This may be a name or abbreviation.' });
  }
  return spans;
}

function changedRange(quote, replacement, start) {
  let prefix = 0;
  while (prefix < quote.length && prefix < replacement.length && quote[prefix] === replacement[prefix]) prefix++;
  let suffix = 0;
  while (suffix < quote.length - prefix && suffix < replacement.length - prefix && quote[quote.length - 1 - suffix] === replacement[replacement.length - 1 - suffix]) suffix++;
  return { start: start + prefix, end: start + quote.length - suffix, added: replacement.slice(prefix, replacement.length - suffix) };
}

export function applyEdits(text, edits) {
  return [...edits].sort((a, b) => b.start - a.start).reduce((copy, edit) => copy.slice(0, edit.start) + edit.replacement + copy.slice(edit.end), text);
}

export function validateReview(raw, text, profile) {
  object(raw, ['edits', 'decisions'], 'AI response');
  for (const key of ['edits', 'decisions']) {
    if (!Array.isArray(raw[key]) || raw[key].length > 20) throw new Error('AI response has an invalid list.');
  }
  const rules = profileRules(profile);
  const local = wordFindings(text, profile);
  const protections = protectedSpans(text);
  const edits = [];
  const decisions = raw.decisions.map(item => {
    object(item, ['quote', 'reason'], 'Decision');
    string(item.quote, 'Decision passage', MAX_DRAFT);
    string(item.reason, 'Decision explanation', 600);
    if (!text.includes(item.quote)) throw new Error('A decision refers to a passage outside the draft.');
    return { quote: item.quote, reason: item.reason };
  });
  const ranges = [];
  for (const item of raw.edits) {
    object(item, ['quote', 'replacement', 'ruleId', 'reason'], 'Edit');
    string(item.quote, 'Edit passage', 600);
    string(item.replacement, 'Replacement', 700, true);
    string(item.reason, 'Edit explanation', 600);
    const rule = rules.find(rule => rule.id === item.ruleId);
    const start = text.indexOf(item.quote);
    if (!rule || start < 0 || start !== text.lastIndexOf(item.quote) || item.quote === item.replacement) throw new Error('An edit cannot be traced to one passage and one profile rule.');
    const end = start + item.quote.length;
    if (ranges.some(range => start < range.end && end > range.start)) throw new Error('AI edits overlap.');
    ranges.push({ start, end });
    if (rule.kind === 'word' && !local.some(finding => finding.ruleId === rule.id && finding.start >= start && finding.end <= end)) throw new Error('An edit cites a word rule that does not match this passage.');
    const change = changedRange(item.quote, item.replacement, start);
    const protection = protections.find(span => change.start < span.end && change.end > span.start || change.start === change.end && change.start >= span.start && change.start <= span.end);
    const newFact = factualPattern.test(change.added) || [...change.added.matchAll(namePattern)].some(match => !sentenceStarters.has(match[0]));
    const candidate = applyEdits(text, [{ start, end, replacement: item.replacement }]);
    const introducesRule = wordFindings(item.replacement, profile).some(finding => !wordFindings(item.quote, profile).some(old => old.ruleId === finding.ruleId));
    if (protection || newFact || introducesRule || candidate.length > MAX_DRAFT) {
      decisions.push({ quote: item.quote, reason: protection ? `${protection.reason} The proposed edit was withheld. Review the original wording yourself.` : 'The proposed edit may add a fact, conflict with your word rules or exceed the length limit. It was withheld.' });
      continue;
    }
    edits.push({ ...item, start, end, rule: rule.text, kind: rule.kind === 'word' ? 'Rule match' : 'Tone suggestion' });
  }
  const copy = applyEdits(text, edits);
  if (copy.length > MAX_DRAFT) throw new Error('The suggested edit exceeds the draft limit.');
  return { edits, decisions, copy };
}
