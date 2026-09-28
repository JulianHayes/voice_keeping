export const alder = {
  format: 'voice-companion', version: 1, name: 'Alder Studio', language: 'en-GB',
  audience: 'Small business owners defining how their brand sounds.',
  principles: ['Be clear and direct. Use familiar words.', 'Be warm and useful. Avoid hype.', 'Be specific. Let the details speak.'],
  goodExamples: ['Put your brand voice into words.'], poorExamples: ['Revolutionise everything with our world-class solution!'],
  avoid: ['seamless'], preferred: [{ from: 'utilise', to: 'use' }]
};
export const playful = {
  ...alder, name: 'Confetti Club', audience: 'People who enjoy playful stationery.',
  principles: ['Sound playful. Exclamation marks are welcome.', 'Use imaginative language.', 'Be informal and friendly.'],
  goodExamples: ['Make a little mess!'], poorExamples: ['Please proceed with the procedure.'],
  avoid: [], preferred: []
};
export const draft = 'Alder Studio offers a seamless way to plan your brand voice. The workbook costs £29 and contains 12 exercises. Download the PDF after payment. Email support replies within two working days. Personal advice is not included.';
export const safeEdit = { quote: 'seamless', replacement: 'simple', ruleId: 'avoid-1', reason: 'Use a familiar word instead of the phrase you avoid.' };
export const response = { edits: [safeEdit], decisions: [] };
