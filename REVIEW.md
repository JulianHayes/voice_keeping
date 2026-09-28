# VoiceKeeping: local review

**The first local version is implemented. All 34 automated checks pass. Real Gemini output is still unverified because no local API key was available.**

Open [the local app](http://127.0.0.1:3000). The preview is running on this computer only.

## Try it

1. Open **Try a fictional example** and select **Use Alder Studio example**.
2. Check the form, then select **Confirm profile**.
3. Select **Load example draft**, then **Review draft**.

You should see the original £29 workbook draft and one exact match for “seamless”. The app will say AI rewriting is not set up. It will not invent a rewrite.

To try a real AI edit, follow the private key setup steps in [README.md](README.md). Never paste the key into the app or this report.

## What changed

- Replaced the old governance score, clearance badge, regulatory screen and imposed writer styles with the customer's own profile.
- Added a plain-language profile form, explicit confirmation and reusable file export.
- Imports validate the whole file and replace every field, including empty word lists. Invalid files leave the current profile alone.
- Exact local matches quote the passage and show the customer's rule. Model tone judgements use a separate label.
- One suggested draft is assembled from small, traceable edits. A checkbox lets the user exclude each edit.
- Names and factual patterns have conservative edit guards. Withheld edits become decisions. These checks are incomplete and can block harmless changes.
- Removed both stored payment-copy fallback paths. Missing keys, timeouts, provider failures and malformed output preserve the draft and local findings.
- Added readable errors, a short-writing limit, explicit English choice, copy/download feedback and response cancellation when the draft changes.
- Restricted public files to the browser assets. The app no longer serves its server source and dependency files.
- Updated the product description and run instructions. Kept the existing HTML, JavaScript and Express stack.

## Checks completed

| Check | Result and limit |
|---|---|
| Profile and server tests | 19 passed |
| Chrome journeys | 15 passed |
| Syntax/build check | Passed. This app needs no compiled bundle |
| £29 Alder draft | A mocked “seamless” to “simple” edit kept all other text exactly. Price, 12 exercises, payment condition, two working days and exclusion retained |
| Clean copy and one banned phrase | Passed. No invented change on a clean response |
| Two contrasting profiles | Different local findings and different profiles in model requests confirmed. Mocked tone responses handled correctly. Real tone quality remains untested |
| Profile file round trip | Browser download and import/export data checked |
| Empty lists and invalid profiles | Passed. No prior-brand rules retained after confirmed replacement |
| Missing API key | Actual local server returned unavailable. Original and local findings retained |
| Provider/network errors, timeout and malformed output | Controlled test cases returned unavailable without invented output |
| Invented evidence and changed facts | Covered examples were withheld. This is not a universal factual guarantee |
| Changing draft while awaiting AI | Stale response discarded |
| Copy and download | Content matched the selected edits. Clipboard denial produced an honest manual-copy message |
| Keyboard and narrow screen | Dialog Enter, Tab, Escape and focus checked. No horizontal overflow at 320px, including a long brand name |
| Accessibility scans | No axe violations in the tested desktop result and 320px failure states. This is not a complete accessibility audit |
| Logo motion | Five strokes settle into a V, play once and stay still during editing. Reduced motion shows the final V immediately |
| Dependency install | npm reported zero known vulnerabilities at installation time |
| Git whitespace check | Passed |

The first browser run reported all checks passing but hung during process cleanup inside the restricted runner. It was stopped, then rerun with normal process permissions. The final run exited successfully with 15 passed in 13.7 seconds.

## Design status

The working app has strong headings, square controls, a large draft area, a black circular review action and the new five-stroke V motion.

The latest olive, mint, yellow, coral and silver composition remains a separate design study for Julian's review. This build keeps neutral surfaces while that composition and the pack section mapping are unsettled. It is not presented as the final colour design.

[Desktop screenshot](review-assets/desktop.png) · [320px screenshot](review-assets/mobile.png)

## Repository and runtime

- Repository: [JulianHayes/voice_keeping](https://github.com/JulianHayes/voice_keeping), public when checked on 28 September 2026.
- Base: `18b4d8ea6acee0ec9e714d41aa37dbef4d78c13d`.
- Local branch: `codex/voice-companion`.
- Julian authorised saving the project to the renamed repository on 28 September 2026. This review records local prototype checks. Production deployment and production settings are outside those checks.
- Node 24.15.0, npm 10.9.8, Express 4.22.3 and Google GenAI SDK 2.24.0 were used.
- npm and `package-lock.json` record the tested install. The inherited `bun.lock` remains unchanged. Before an approved deployment, select npm explicitly or reconcile the older Bun lock. Vercel's detection depends on lock files and configuration, so do not assume its current selection. [Vercel package-manager documentation](https://vercel.com/docs/package-managers).

The original code demonstrably substituted payment copy when keys were missing, provider calls failed or output was unsuitable. The exact event that triggered the live Vercel failure remains unknown. The checkout contains no deployment logs or local API key. Production settings were not changed.

The model and request fields were checked against [Google's model documentation](https://ai.google.dev/gemini-api/docs/models) and [SDK configuration reference](https://googleapis.github.io/js-genai/release_docs/interfaces/types.GenerateContentConfig.html). That does not establish access or successful live output.

## What I have not addressed

Before launch, resolve:

1. **Real AI validation.** Use an authorised key to assess both contrasting profiles, the factual cases, real failures and actual usage cost.
2. **Final design.** Review the latest composition, kit sections, palette and logo.
3. **Customer access and cost limits.** There is no account system, rate allowance, billing or public API access restriction.
4. **Privacy and hosting.** Confirm provider data handling, customer wording, install choice and an approved preview deployment.
5. **Commercial proof.** Kit quality, discovery, willingness to pay, support effort and the income target remain unproven.
