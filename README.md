# VoiceKeeping

Apply your own brand voice guidelines to a short draft. Create and confirm a profile, review specific passages, then choose which suggested edits to keep.

This README describes the existing copy amendment prototype. The current product focus is tier 1: a tool to develop brand voice guidelines and deliver a PDF for a one-off fee. See [PRODUCT.md](PRODUCT.md) for the three-tier plan and the Mistral direction for tiers 2 and 3.

VoiceKeeping is the chosen name. Domain and trade mark availability remain unchecked. This is a local first version, not a launched paid service.

## Project files and outputs

The project repository is [JulianHayes/voice_keeping](https://github.com/JulianHayes/voice_keeping). The current development branch is `codex/voice-companion`.

- [PRODUCT.md](PRODUCT.md) records the current direction, with tier 1 as the focus.
- [outputs/README.md](outputs/README.md) indexes project deliverables and earlier design studies. Save future VoiceKeeping outputs in `outputs/`.
- [REVIEW.md](REVIEW.md) records the existing copy amendment prototype's checks and limits.
- [review-assets](review-assets) contains screenshots of that prototype.

## Run it on your computer

You need Node.js 22 or later and npm.

1. Open a terminal in this folder.
2. Run `npm ci` to install the recorded dependency versions.
3. Run `npm run dev`.
4. Open [VoiceKeeping locally](http://127.0.0.1:3000).
5. Keep the terminal running. Press Ctrl+C in that terminal when you want to stop.

The app uses plain HTML, browser JavaScript and Express. There is no framework build or database. Opening the HTML file directly will not run the app.

Without an AI key, profile creation, imports, exports and local word checks work. Rewriting shows an unavailable message. There are no example rewrites presented as real output.

### Enable real AI reviews locally

1. Copy `.env.example` to a new file called `.env` in this folder.
2. Put your authorised Gemini API key after `GEMINI_API_KEY=`. Do not put it in browser code or commit the file.
3. Leave `GEMINI_MODEL=gemini-3.8-flash` unless you have checked a different available model.
4. Stop and restart the server.
5. Run a review using a fictional draft. Check both the response and the provider's usage record.

The key stays on the server. Reviews send the draft and profile to Google Gemini. The app does not write either to disk, use browser storage or log their contents. Hosting and provider data handling still need review before customer use.

The default model and SDK request fields were checked against [Google's model list](https://ai.google.dev/gemini-api/docs/models) and [Google's SDK reference](https://googleapis.github.io/js-genai/release_docs/interfaces/types.GenerateContentConfig.html) on 28 September 2026. That confirms the documented interface, not access from your account or successful real output.

## Use it

1. Select **Create your profile** and enter your audience, 3 to 5 principles, examples, words to avoid and preferred wording.
2. Check the form and select **Confirm profile**.
3. Select **Export profile** to keep a reusable file.
4. Paste up to 5,000 characters and select **Review draft**.
5. Read the exact **Rule matches**, uncertain **Tone suggestions** and anything labelled **Needs your decision**.
6. Untick edits you do not want. Read the one suggested draft, then copy or download it.

**Import profile** accepts the app's version 1 JSON file. It loads a form for confirmation. It replaces the whole profile, including empty lists. Invalid files leave the confirmed profile unchanged. General guideline documents and old Voice Governor imports are not silently converted.

There is one active brand. The initial language scope is UK or US English. Export your profile before closing. The draft and profile are held only in the current page and are lost on refresh.

## What the checks mean

- Word checks run locally. They match your exact phrases, ignoring case and respecting word boundaries.
- Gemini supplies small edits tied to your profile rules, not a replacement document. The app reconstructs one suggestion from the original and the accepted edits.
- The app checks response shape, quoted passages, rule references and overlapping edits. Invalid responses are unavailable, not success.
- Conservative checks withhold edits around recognised names, numbers, prices, time periods, conditions, exclusions and some claim terms. They also reject some newly added factual patterns.
- These pattern checks can miss facts and can withhold harmless edits. They do not verify evidence or guarantee unchanged meaning. Read the complete result before using it.
- Provider failures, timeouts, missing credentials and malformed output retain the original draft and local findings. They never produce a stored substitute.

## Checks

- `npm run build`: syntax checks for the server and browser modules. It produces no bundle.
- `npm run lint`: the same syntax checks.
- `npm test`: profile, factual guard, response handling and HTTP tests.
- `npm run test:browser`: Chrome journeys, copy/download tests and automated accessibility scans.

Browser tests use a separate server at port 3107 and the installed Google Chrome. They force an empty API key. Successful AI output and provider failures are mocked in the test runner only. There is no mock mode in the product. If Chrome is missing, install Chrome or change the test channel to a locally installed Playwright browser.

The normal preview defaults to port 3000 and this computer only. `PORT` and `HOST` can be set for another local environment. `npm start` starts the same server. Importing the default Express export does not open a second listener.

## Before a paid launch

Real AI quality, access limits, cost controls, privacy wording and hosting behaviour need validation. The first version has no customer accounts, billing, usage metering or public access restriction. Do not expose a paid API key to unrestricted public traffic.

No changes to GitHub visibility, Vercel settings or the live app are required to run this local preview. See [the review record](REVIEW.md) for what was actually tested.
