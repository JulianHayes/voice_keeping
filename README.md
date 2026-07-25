# Voice Governor

A prototype brand voice governance tool. Paste a draft, get a score out of 100, flagged violations, and a suggested rewrite — checked against an editable brand ruleset and UK regulatory patterns.

**Status: prototype.** Single HTML file, no build step, no dependencies. Open `index.html` in a browser.

## What it checks

**Voice rules (run live, deterministic):**
- Banned vocabulary (editable in the UI)
- Superlative claims with no number or source beside them
- Sentence length, passive voice, exclamation marks, shouting caps
- Flesch reading ease

**Regulatory screen (pattern triggers, each citing its source):**
- FCA financial promotions — guaranteed returns, risk-free claims
- CAP Code — misleading claims, absolute security claims, use of "free", proof claims, promotions
- CMA Green Claims Code — unsubstantiated environmental claims
- DMCC Act 2024 — false urgency and scarcity

Any critical regulatory finding forces the verdict to "Blocked — regulatory", regardless of the overall score. Style problems lower a score. Legal problems stop the press.

## What is simulated

The tone review and rewrite panels are labelled **simulated**. In a production build they become a model call fed the same ruleset, so the deterministic checks stay auditable and the model only judges what rules cannot.

## Not legal advice

The regulatory checks are screening patterns, not legal judgement. "Carbon neutral" backed by a verified scheme is fine; "won't last" with a real end date is fine. The tool catches the risk so a qualified person can decide. Do not remove the disclaimer.

## Roadmap (if the prototype earns it)

1. Next.js app with a real model call against the same ruleset
2. Per-brand rulesets: each team uploads its approved voice, lexicon and claims
3. ASA rulings ingestion — the ASA publishes every ruling weekly; the ruleset learns from real adjudications
