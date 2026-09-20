# Product

## Register

product

## Users

**Primary: the person briefing a copywriter.** A brand owner, comms lead or
agency account lead who has a draft, or a rough idea of one, and needs to hand
a writer something better than "make it sound like us". They are not the author.
They are the person who decides what the author should go and do.

Their context: mid-task, under time pressure, with a draft in one hand and a
writer or an agency waiting. They want the weak points found and named fast,
with enough substance that the writer can act on it without a meeting.

**Secondary: the copywriter receiving the output.** They read it as a brief, not
as a correction. It has to tell them what to go and find, not just what to
delete.

**Explicitly not a user: legal or compliance sign-off.** The tool hands off to
them. It never stands in for them. A reviewer may read the output as a heads-up,
but the product is not built for their workflow and must never imply their
approval.

## Product Purpose

Voice Governor is a springboard for copy creation, built on claimable evidence.

It takes a draft and returns a starting point: where the language is doing no
work, where a claim is made with nothing behind it, and where a phrase carries
UK regulatory risk with the source of that risk named. The output is a brief
for a human writer.

It does not write the copy. It does not clear the copy.

What success looks like:
- A copywriter can start work from the output without asking a follow-up question.
- Every flagged claim comes with what evidence would make it claimable.
- Legal still signs off, and the tool has made that conversation shorter.

What failure looks like:
- Someone ships copy because the tool said the score was high enough.
- Someone treats a clean screen as legal clearance.
- The output reads as a list of deletions, so the writer learns nothing.

## Brand Personality

**[ASSUMED - not yet confirmed by Julian. Strike anything wrong.]**

Exact, unhurried, accountable. The interface behaves like a working document
rather than a verdict: it shows what it found, says how sure it is, cites where
the rule comes from, and leaves the decision with the person reading.

Dry, not cold. It is allowed to be direct about a weak claim. It is not allowed
to be pleased with itself, and it does not congratulate the user.

## Anti-references

**[ASSUMED except where marked confirmed. Strike anything wrong.]**

- **Brand Schema's own identity. [Confirmed: separation principle, 25 JUL 2026.]**
  The reviewer must never carry Brand Schema's doctrine as its own standard, or
  wear its typography or Signal red. Each customer's rules are the standard. The
  product's own voice lives only in how it presents itself.
- **Anything that implies legal clearance. [Confirmed: Julian, this session.]**
  No green ticks that read as "approved", no language of passing or failing a
  legal test, no certificate, no badge.
- **[ASSUMED] The red compliance reflex.** Red for a red-flag tool is the first
  answer the training data gives. The product's whole argument is about not
  sounding like your category, so looking exactly like your category is a
  self-inflicted wound. Open question: dropping red means a real repalette.
- **[ASSUMED] Consumer writing assistants (Grammarly, Hemingway).** Encouraging
  scores, streaks, cheerful cards, a grade that goes up when you comply.
- **[ASSUMED] Generic SaaS dashboard.** Metric tiles, a score gauge as the hero,
  identical card grids, gradient accents.

## Design Principles

1. **The output is a brief, not a verdict.** Every screen should read as
   something you forward to a writer. Where the tool currently returns
   "BLOCKED", that is a claim of authority the product does not have. Open
   tension, see below.
2. **Name the evidence that would fix it.** A finding that only says "cut this"
   has failed. It has to say what figure, source or artefact would make the
   claim usable.
3. **The human is the author.** The tool never presents its rewrite as finished
   copy. Anything it generates is labelled as raw material.
4. **Screening is not sign-off.** The disclaimer is load-bearing, not legal
   boilerplate. It survives every redesign and it is never tucked into a footer
   nobody reads.
5. **State the confidence.** Where a judgement is a pattern match rather than a
   certainty, the interface says so on the record.

## Accessibility & Inclusion

WCAG 2.2 AA, measured rather than estimated.

- Every text and background pair computed at 4.5:1 or better, in both themes.
  Verified 20 SEP 2026.
- Non-text marks, dots, bars and rules, meet 3:1.
- `prefers-reduced-motion` shows the finished state. No entrance animation plays.
- Theme follows the operating system by default and remembers an explicit choice.
- Severity is never carried by colour alone. The word sits beside the mark.
- Interactive targets 24px minimum, 44px on touch.

## Open tensions

Recorded, not resolved. These change the design if they move.

1. **Verdict versus brief.** The app returns a score out of 100 and a
   "BLOCKED - REGULATORY BREACH" pill. Julian's stated purpose is a springboard
   and a briefing guide that does not replace legal sign-off. The current
   framing overclaims. Unresolved.
2. **Commercial position.** Whether this is free and feeds the paid Brand Schema
   Audit, sold on its own, or internal only. Unanswered, and it decides whether
   the interface should expose the limit of what a screen can judge.
3. **The red palette.** See anti-references.
4. **README is stale.** It still describes a single HTML file with no build step
   and no dependencies. There is now an Express server, a Gemini call and a
   package manifest.
