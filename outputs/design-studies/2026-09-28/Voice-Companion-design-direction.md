# Voice Companion: visual direction

**Use Julian's extracted palette to make a clear connection between the pack and the app.**

This revision replaces the earlier cream, white, cobalt and charcoal directions. There is no charcoal mode. The design study is saved in Voice-Companion-design-preview.html. Its Workspace, Pack connection and Colour decisions buttons are presentation controls, not proposed app features.

## Composition

Use a green surround, large black typography, joined flat colour blocks and a silver-grey writing surface. Remove the promotional slogan and separate rounded cards. Restore the original five-line logo beside the app name, following Julian's latest direction. The app should have the graphic clarity of the supplied references.

The section headings are substantial coloured blocks with large, stacked titles: Your voice., Your words. and In practice. Pack numbering is secondary, used to identify the source of a rule. Do not put a large 01 before a small section label.

The primary action remains a substantial black circle. Secondary actions have square corners and simple outlines. Avoid gradients, heavy shadows and additional decoration.

## Logo motion

The five vertical lines from the first design move into a V. All five strokes remain visible. The centre stroke bends to form the bottom of the letter. Use black throughout.

Play once when the app opens, then hold the final V. Allow 300ms to see the original mark, followed by about 1.1 seconds of movement with a slight stagger. Do not loop or replay during ordinary editing. Respect reduced-motion settings by showing the final V immediately.

Voice-Companion-logo-motion.html shows the movement at a larger size. Voice-Companion-logo-motion.js supplies the shared animation. Voice-Companion-logo-v.svg is the static end frame. The main design preview includes the animation beside the app name. Clicking the mark replays it for review. The replay control is a study aid, not a required app feature.

## Colour roles

| Colour | Proposed role |
|---|---|
| #708166 | Olive green surround |
| #6AA992 | Mint voice block and study navigation |
| #CCD0C8 | Silver-grey draft and edited-copy surfaces |
| #F6DC19 | Vocabulary section and findings drawn from it |
| #F25A38 | Worked examples section |
| #0D0D0D | Main text, divisions and controls |
| #273240 | Secondary ink on light surfaces and main-button hover |
| #E4E2D1 | Tiny example-content annotation only |

The pack structure has not been agreed. These section assignments demonstrate the connection, rather than fix the final contents.

Use a section's colour, name and reference together. For example, a yellow finding tagged 02 / Your words points back to the vocabulary section in the pack. Colour alone must never mean approval, risk or error.

### Colours kept in reserve

- #A6A29F is an alternative neutral surround. The current direction uses olive.
- #FB2A00 and #FC2E02 are close alternatives for a sharper red-orange accent. They should not describe different meanings.
- #F25A38 and #F65619 are alternative warm accents. The current examples block uses the former.
- #F6DC19 and #EEC831 are alternative yellows. The current vocabulary block uses the former.
- #677163 and #6A7366 are darker green alternatives. Reserve them for graphics or large headings with a checked contrast pairing.

There is no need to use every extracted shade on the same screen.

## Typography and layout

The study uses locally available Bahnschrift with a sans-serif fallback. This is a local type study, not a final webfont distribution choice.

Use 48 to 80px for the wordmark, 38 to 47px for coloured section headings and 18 to 21px for draft text. Keep body line height around 1.5. Use lighter-weight numerals only for real information, such as a word count or a pack reference.

At desktop widths, the draft takes the wider left side. The coloured pack references form an adjoining right column. There is no floating panel gutter. On narrow screens the regions stack and the reference headings remain large enough to read.

The circular action is 126px across on desktop and 104px on small screens. Give it a clear two-line label. The actual app says Review draft. The study says Review example because it displays a fixed demonstration.

## Interactions and safeguards

Opening a coloured section shows its corresponding rules or examples. Keep controls keyboard accessible and show whether the section is expanded. Retain visible focus.

The demonstration review shows one word finding, with a source label, and an edited draft that preserves the other content. This is labelled fixed example content and makes no AI request. Do not use these demonstration results as real app fallbacks.

The product brief still governs profile handling, factual safeguards and honest failure states. Styling must preserve those behaviours. Copy actions need a visible confirmation. The live app has not been changed by this study.

## Contrast

Calculated contrast with #0D0D0D is 4.65:1 on olive, 7.13:1 on mint, 14.04:1 on yellow, 5.83:1 on coral and 12.42:1 on silver grey.

Black text on #677163 or #6A7366 gives only 3.81:1 or 3.94:1. Those pairs are unsuitable for ordinary small body text. Keep #273240 secondary text on light surfaces rather than the olive surround. Check the actual rendered focus, hover and error states during integration.

## What I have not addressed

- Final pack contents, section names and colour assignments.
- Final font licensing, naming or logo approval. The motion study is a proposed direction.
- Physical print matching. Test colour proofs on the chosen stock.
- Preference validation or changes to the live app. Review the revised composition before applying it throughout the product.
