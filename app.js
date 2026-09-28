import { MAX_DRAFT, MAX_PROFILE_BYTES, validateProfile, parseProfile, exportProfile, validateDraft, profileRules, wordFindings, validateReview, applyEdits } from './domain.js';

const $ = id => document.getElementById(id);
const el = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
};
const lines = value => value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
const exampleProfile = {
  format: 'voice-companion', version: 1, name: 'Alder Studio', language: 'en-GB',
  audience: 'Small business owners defining how their brand sounds.',
  principles: ['Be clear and direct. Use familiar words.', 'Be warm and useful. Avoid hype.', 'Be specific. Let the details speak.'],
  goodExamples: ['Put your brand voice into words.'],
  poorExamples: ['Revolutionise everything with our world-class solution!'],
  avoid: ['seamless'], preferred: [{ from: 'utilise', to: 'use' }]
};
const exampleDraft = 'Alder Studio offers a seamless way to plan your brand voice. The workbook costs £29 and contains 12 exercises. Download the PDF after payment. Email support replies within two working days. Personal advice is not included.';
let activeProfile = null;
let result = null;
let original = '';
let pending = null;
let revision = 0;
let importRevision = 0;

function updateControls() {
  const length = $('draft').value.length;
  const words = $('draft').value.trim().match(/\S+/g)?.length || 0;
  $('counter').textContent = `${words} words · ${length.toLocaleString('en-GB')} / 5,000`;
  $('review').disabled = !activeProfile || !$('draft').value.trim() || length > MAX_DRAFT || Boolean(pending);
  $('cancel-review').hidden = !pending;
  $('review-help').textContent = pending ? 'Reviewing your draft. You can keep writing or cancel.' : !activeProfile ? 'Confirm your voice profile, then add a draft.' : !length ? 'Add a draft to review against your confirmed profile.' : 'Your original stays unchanged. You choose which edits to keep.';
}

function clearReview(message = 'Your draft or profile changed. Review again when you are ready.') {
  revision++;
  pending?.abort();
  pending = null;
  result = null;
  $('suggestion').hidden = true;
  $('review-results').hidden = true;
  $('empty-review').hidden = false;
  $('review-status').textContent = message;
  $('copy-status').textContent = '';
  $('edited-draft').value = '';
  for (const id of ['local-findings', 'ai-findings', 'decisions', 'marked-draft']) $(id).replaceChildren();
  updateControls();
}

function showProfile() {
  const container = $('profile-summary');
  container.replaceChildren(el('h3', activeProfile.name, 'profile-name'), el('p', activeProfile.audience));
  const details = el('details');
  details.append(el('summary', 'View confirmed rules'));
  const list = el('ul');
  for (const rule of profileRules(activeProfile)) list.append(el('li', rule.text));
  details.append(list, el('p', `${activeProfile.avoid.length} words to avoid. ${activeProfile.preferred.length} preferred wording pairs.`));
  container.append(details);
  $('edit-profile').textContent = 'Edit voice profile';
  $('export-profile').disabled = false;
  $('profile-status').textContent = 'Profile confirmed. Export it to keep a copy.';
}

function addPreferred(pair = { from: '', to: '' }) {
  if ($('preferred-rows').children.length >= 50) return;
  const row = el('div', undefined, 'preferred-row');
  for (const [key, labelText] of [['from', 'Instead of'], ['to', 'Use']]) {
    const label = el('label', labelText);
    const input = el('input');
    input.dataset.field = key;
    input.value = pair[key];
    input.maxLength = 100;
    input.required = true;
    label.append(input);
    row.append(label);
  }
  const remove = el('button', 'Remove');
  remove.type = 'button';
  remove.addEventListener('click', () => { row.remove(); $('add-preferred').focus(); });
  row.append(remove);
  $('preferred-rows').append(row);
}

function openProfile(profile = activeProfile) {
  $('profile-form').reset();
  $('form-error').textContent = '';
  $('preferred-rows').replaceChildren();
  if (profile) {
    $('profile-name').value = profile.name;
    $('profile-audience').value = profile.audience;
    $('profile-language').value = profile.language;
    for (const [id, key] of [['principles', 'principles'], ['good', 'goodExamples'], ['poor', 'poorExamples'], ['avoid', 'avoid']]) $('profile-' + id).value = profile[key].join('\n');
    profile.preferred.forEach(addPreferred);
  }
  $('profile-dialog').showModal();
  $('profile-name').focus();
}

function profileFromForm() {
  return validateProfile({
    format: 'voice-companion', version: 1,
    name: $('profile-name').value, audience: $('profile-audience').value,
    language: $('profile-language').value,
    principles: lines($('profile-principles').value), goodExamples: lines($('profile-good').value),
    poorExamples: lines($('profile-poor').value), avoid: lines($('profile-avoid').value),
    preferred: [...$('preferred-rows').children].map(row => ({ from: row.querySelector('[data-field="from"]').value, to: row.querySelector('[data-field="to"]').value }))
  });
}

function download(text, name, type) {
  const link = el('a');
  const url = URL.createObjectURL(new Blob([text], { type }));
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function filename(suffix) {
  return `${activeProfile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'brand'}-${suffix}`;
}

function markDraft(findings) {
  const container = $('marked-draft');
  container.replaceChildren();
  let cursor = 0;
  for (const finding of [...findings].sort((a, b) => a.start - b.start || b.end - a.end)) {
    if (finding.start < cursor) continue;
    container.append(document.createTextNode(original.slice(cursor, finding.start)));
    const mark = el('mark', original.slice(finding.start, finding.end));
    mark.title = finding.rule || finding.kind;
    container.append(mark);
    cursor = finding.end;
  }
  container.append(document.createTextNode(original.slice(cursor)));
}

function showLocal(findings) {
  const container = $('local-findings');
  container.replaceChildren(el('h3', `Word rules: ${findings.length} ${findings.length === 1 ? 'match' : 'matches'}`));
  if (!findings.length) container.append(el('p', 'No exact word-rule matches. This does not assess tone or verify facts.'));
  for (const finding of findings) {
    const article = el('article', undefined, 'finding');
    article.append(el('p', 'Rule match', 'kind'), el('blockquote', finding.quote), el('p', `Your rule: ${finding.rule}`), el('p', finding.reason));
    article.append(el('p', finding.replacement ? `Preferred wording: “${finding.replacement}”. Check the meaning before using it.` : 'Suggested action: remove or reword this phrase if it is not needed for accuracy.'));
    container.append(article);
  }
}

function showSuggestion() {
  const selected = [...$('ai-findings').querySelectorAll('input:checked')].map(input => result.edits[Number(input.value)]);
  $('edited-draft').value = applyEdits(original, selected);
  const remaining = wordFindings($('edited-draft').value, activeProfile).length;
  $('change-summary').textContent = result.edits.length ? `${selected.length} of ${result.edits.length} suggested edits included. Untick any change you do not want.${remaining ? ` ${remaining} word-rule ${remaining === 1 ? 'match remains' : 'matches remain'}.` : ''}` : result.decisions.length || remaining ? 'No edits applied. Read the findings and decisions alongside the unchanged original.' : 'No changes suggested by this review. The text below is your original draft.';
  $('copy-status').textContent = '';
  $('suggestion').hidden = false;
}

function showAI() {
  const container = $('ai-findings');
  container.replaceChildren();
  if (result.edits.length) container.append(el('h3', 'Choose your changes'));
  result.edits.forEach((edit, index) => {
    const article = el('article', undefined, 'finding');
    article.append(el('p', edit.kind, 'kind'), el('blockquote', edit.quote), el('p', `Your rule: ${edit.rule}`), el('p', edit.reason));
    if (edit.kind === 'Tone suggestion') article.append(el('p', 'AI judgement. You may prefer your original wording.', 'quiet'));
    const label = el('label');
    const checkbox = el('input');
    checkbox.type = 'checkbox';
    checkbox.value = String(index);
    checkbox.checked = true;
    checkbox.addEventListener('change', showSuggestion);
    label.append(checkbox, el('span', edit.replacement ? `Include: “${edit.replacement}”` : `Include removal of “${edit.quote}”`));
    article.append(label);
    container.append(article);
  });
  $('decisions').replaceChildren();
  if (result.decisions.length) $('decisions').append(el('h3', 'Needs your decision'));
  for (const decision of result.decisions) {
    const article = el('article', undefined, 'finding decision');
    article.append(el('blockquote', decision.quote), el('p', decision.reason));
    $('decisions').append(article);
  }
  showSuggestion();
}

async function reviewDraft() {
  if (pending || !activeProfile) return;
  const text = $('draft').value;
  try { validateDraft(text); } catch (error) { $('review-status').textContent = error.message; return; }
  clearReview('Word checks complete. Reviewing tone and preparing suggested edits…');
  const currentRevision = revision;
  original = text;
  const profile = activeProfile;
  const local = wordFindings(text, profile);
  showLocal(local);
  markDraft(local);
  $('review-results').hidden = false;
  $('empty-review').hidden = true;
  pending = new AbortController();
  const controller = pending;
  const timer = setTimeout(() => controller.abort(), 35000);
  updateControls();
  try {
    const response = await fetch('/api/rewrite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, profile }), signal: controller.signal });
    const data = await response.json();
    if (revision !== currentRevision) return;
    if (!response.ok || data?.success !== true || data.source !== 'gemini') {
      const reasons = { not_configured: 'AI rewriting is not set up.', provider_unavailable: 'AI rewriting is unavailable. Try again later.', invalid_response: 'The AI response could not be used. Try again later.' };
      throw new Error(reasons[data?.code] || 'AI rewriting is unavailable. Try again later.');
    }
    result = validateReview(data.review, text, profile);
    showAI();
    markDraft([...local, ...result.edits]);
    $('review-status').textContent = `Review ready for ${profile.name}. Word matches are exact. Tone suggestions need your judgement.`;
  } catch (error) {
    if (revision !== currentRevision) return;
    result = null;
    $('suggestion').hidden = true;
    const known = /^AI rewriting|^The AI response/.test(error.message);
    $('review-status').textContent = `${known ? error.message : 'AI rewriting is unavailable or returned an unusable response.'} Your original draft and local word findings are unchanged. Tone has not been assessed.`;
  } finally {
    clearTimeout(timer);
    if (revision === currentRevision) { pending = null; updateControls(); }
  }
}

$('edit-profile').addEventListener('click', () => openProfile());
$('example-profile').addEventListener('click', () => openProfile(exampleProfile));
$('close-profile').addEventListener('click', () => $('profile-dialog').close());
$('profile-dialog').addEventListener('close', () => $('edit-profile').focus());
$('add-preferred').addEventListener('click', () => { addPreferred(); $('preferred-rows').lastElementChild?.querySelector('input').focus(); });
$('profile-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    activeProfile = profileFromForm();
    importRevision++;
    showProfile();
    clearReview('Profile confirmed. Add a draft and review it against these rules.');
    $('profile-dialog').close();
  } catch (error) { $('form-error').textContent = error.message; }
});
$('import-profile').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  const id = ++importRevision;
  try {
    if (file.size > MAX_PROFILE_BYTES) throw new Error('Choose a profile file smaller than 32 KB.');
    const profile = parseProfile(await file.text());
    if (id !== importRevision) return;
    openProfile(profile);
    $('form-error').textContent = 'Profile loaded for checking. Confirm it to replace all current rules.';
  } catch (error) { if (id === importRevision) $('profile-status').textContent = `Import failed. ${error.message} Your current profile is unchanged.`; }
  finally { event.target.value = ''; }
});
$('export-profile').addEventListener('click', () => {
  if (!activeProfile) return;
  download(exportProfile(activeProfile), filename('voice-profile.json'), 'application/json');
  $('profile-status').textContent = 'Profile download requested. Keep this file for your next draft.';
});
$('draft').addEventListener('input', () => clearReview());
$('example-draft').addEventListener('click', () => {
  if ($('draft').value.trim() && !window.confirm('Replace your current draft with the fictional example?')) return;
  $('draft').value = exampleDraft;
  clearReview('Fictional draft loaded. Confirm a profile, then review.');
});
$('review').addEventListener('click', reviewDraft);
$('cancel-review').addEventListener('click', () => pending?.abort());
$('copy-edit').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('edited-draft').value); $('copy-status').textContent = 'Copied to clipboard.'; }
  catch { $('edited-draft').focus(); $('edited-draft').select(); $('copy-status').textContent = 'Copy was blocked by your browser. Text selected. Press Ctrl+C, or use your device’s Copy command.'; }
});
$('download-edit').addEventListener('click', () => {
  if (!result) return;
  download($('edited-draft').value, filename('suggested-edit.txt'), 'text/plain;charset=utf-8');
  $('copy-status').textContent = 'Edit download requested. Read it through before use.';
});
fetch('/api/status').then(response => { if (!response.ok) throw new Error(); return response.json(); }).then(status => {
  $('service-status').textContent = status.aiConfigured ? 'AI is configured. Availability is checked when you review.' : 'AI is not set up here. Profile tools and local word checks still work.';
}).catch(() => { $('service-status').textContent = 'AI availability could not be checked. Local word checks still work.'; });
updateControls();

// Keep all five lines vertical as they move into a V. Play once on opening.
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const logo = $('voice-mark');
const logoStart = [[22,42,22,50,22,58], [36,31,36,50,36,69], [50,22,50,50,50,78], [64,31,64,50,64,69], [78,42,78,50,78,58]];
const logoEnd = [[22,18,22,29,22,40], [36,38,36,49,36,60], [50,58,50,69,50,80], [64,38,64,49,64,60], [78,18,78,29,78,40]];
let logoFrame;
function drawLogo(points) {
  logo.querySelectorAll('path').forEach((path, index) => { const p = points[index]; path.setAttribute('d', `M${p[0]} ${p[1]} L${p[2]} ${p[3]} L${p[4]} ${p[5]}`); });
}
function settleLogo() {
  cancelAnimationFrame(logoFrame);
  drawLogo(logoEnd);
  logo.dataset.phase = 'settled';
}
if (motionPreference.matches) settleLogo();
else {
  let started;
  drawLogo(logoStart);
  logo.dataset.phase = 'start';
  const lag = [0, 45, 90, 45, 0];
  const frame = now => {
    started ??= now;
    const elapsed = now - started;
    if (elapsed >= 1440) { settleLogo(); return; }
    drawLogo(logoStart.map((points, index) => {
      const t = Math.max(0, Math.min(1, (elapsed - 300 - lag[index]) / 1050));
      const ease = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      return points.map((value, point) => value + (logoEnd[index][point] - value) * ease);
    }));
    logoFrame = requestAnimationFrame(frame);
  };
  logoFrame = requestAnimationFrame(frame);
}
motionPreference.addEventListener('change', () => { if (motionPreference.matches) settleLogo(); });
