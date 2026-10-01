import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProfile, parseProfile, exportProfile, wordFindings, validateReview, applyEdits, protectedSpans } from '../domain.js';
import { alder, playful, draft, safeEdit, response } from './fixtures.js';

test('profile export/import round trip and deliberately empty replacement lists', () => {
  assert.deepEqual(parseProfile(exportProfile(alder)), alder);
  let active = parseProfile(exportProfile(alder));
  assert.equal(wordFindings(draft, active).length, 1);
  active = parseProfile(exportProfile(playful));
  assert.deepEqual(active, playful);
  assert.equal(wordFindings(draft, active).length, 0);
  assert.deepEqual(active.avoid, []);
  assert.deepEqual(active.preferred, []);
});

test('malformed and oversized profiles are rejected without guessing missing rules', () => {
  for (const value of ['{', '{}', 'null', JSON.stringify({ ...alder, version: 2 }), JSON.stringify({ ...alder, avoid: 'seamless' }), JSON.stringify({ ...alder, preferred: [{ from: 'x' }] }), JSON.stringify({ ...alder, principles: ['one'] }), JSON.stringify({ ...alder, ignored: true }), JSON.stringify({ ...alder, avoid: ['x', 'X'] })]) assert.throws(() => parseProfile(value));
  assert.throws(() => parseProfile(' '.repeat(32001)));
  assert.throws(() => validateProfile({ ...alder, preferred: [{ from: 'same', to: 'same' }] }));
  assert.throws(() => validateProfile({ ...alder, goodExamples: ['two\nlines'] }));
  assert.throws(() => validateProfile({ ...alder, preferred: [{ from: 'two\nlines', to: 'one line' }] }));
});

test('exact word rules match case and punctuation, not unrelated substrings', () => {
  const profile = { ...alder, avoid: ['seamless', 'C++', 'best-in-class', 'café'], preferred: [] };
  const findings = wordFindings('SEAMLESS. seamlessness C++ best-in-class café décafé!', profile);
  assert.deepEqual(findings.map(item => item.quote), ['SEAMLESS', 'C++', 'best-in-class', 'café']);
  assert.equal(wordFindings('A simple plan.', alder).length, 0);
});

test('the two customers determine different reviews, with no global tone bans', () => {
  const text = 'A seamless plan!';
  assert.equal(wordFindings(text, alder).length, 1);
  assert.equal(wordFindings(text, playful).length, 0);
  assert.equal(validateReview({ edits: [], decisions: [] }, text, playful).copy, text);
  assert.throws(() => validateReview(response, text, playful));
});

test('Alder edit preserves the name, price, quantity, time, condition and exclusion exactly', () => {
  const result = validateReview(response, draft, alder);
  assert.equal(result.copy, draft.replace('seamless', 'simple'));
  assert.equal(result.edits.length, 1);
  for (const literal of ['Alder Studio', '£29', '12 exercises', 'after payment', 'within two working days', 'Personal advice is not included.']) assert.ok(result.copy.includes(literal));
  assert.equal(applyEdits(draft, []), draft);
});

test('clean copy stays unchanged without invented output', () => {
  const text = 'Use the workbook to plan your brand voice.';
  const result = validateReview({ edits: [], decisions: [] }, text, alder);
  assert.equal(result.copy, text);
  assert.deepEqual(result.edits, []);
});

test('edits touching facts and names are withheld as decisions', () => {
  for (const [quote, replacement] of [['£29', '£19'], ['12', '10'], ['Alder Studio', 'Birch Studio'], ['after payment', 'before payment'], ['two working days', 'one working day'], ['not included', 'included']]) {
    const result = validateReview({ edits: [{ quote, replacement, ruleId: 'principle-1', reason: 'Mock attempted factual change.' }], decisions: [] }, draft, alder);
    assert.equal(result.copy, draft, quote);
    assert.equal(result.decisions.length, 1, quote);
  }
  assert.ok(protectedSpans(draft).length > 0);
});

test('new evidence cannot replace a style phrase', () => {
  for (const replacement of ['independently audited', '256-bit encrypted', 'certified', 'proven', 'SOC-2 protected']) {
    const result = validateReview({ edits: [{ ...safeEdit, replacement }], decisions: [] }, draft, alder);
    assert.equal(result.copy, draft);
    assert.equal(result.decisions.length, 1);
  }
});

test('invalid, overlapping, ambiguous and unrelated output is rejected', () => {
  for (const raw of [{ options: [{ copy: 'payment infrastructure' }] }, { edits: null, decisions: [] }, { edits: [{ ...safeEdit, quote: 'not in draft' }], decisions: [] }, { edits: [{ ...safeEdit, ruleId: 'invented' }], decisions: [] }, { edits: [safeEdit, safeEdit], decisions: [] }, { edits: [], decisions: [{ quote: 'not in draft', reason: 'test' }] }, { edits: [{ ...safeEdit, quote: 'plan', replacement: 'prepare' }], decisions: [] }]) assert.throws(() => validateReview(raw, draft, alder));
  assert.throws(() => validateReview(response, 'seamless seamless', alder));
});

test('a suggested edit cannot introduce a new avoided word', () => {
  const result = validateReview({ edits: [{ ...safeEdit, replacement: 'utilise' }], decisions: [] }, draft, alder);
  assert.equal(result.copy, draft);
  assert.equal(result.edits.length, 0);
});

test('tone edits carry the exact customer rule and retain a distinct suggestion label', () => {
  const result = validateReview({ edits: [{ quote: 'rather nice', replacement: 'useful', ruleId: 'principle-3', reason: 'Your principle asks for specific wording.' }], decisions: [] }, 'A rather nice way to plan.', alder);
  assert.equal(result.edits[0].kind, 'Tone suggestion');
  assert.equal(result.edits[0].rule, alder.principles[2]);
  assert.equal(result.copy, 'A useful way to plan.');
});
