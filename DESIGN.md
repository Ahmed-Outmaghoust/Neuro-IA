---
name: نَسَق — ورشة النمط الشبكي
description: تعلّم الشبكات العصبية عبر إشارات حيّة وتجارب قصيرة باللغة العربية.
colors:
  forest: "#151d1c"
  forest-raised: "#1c2825"
  limestone: "#e8e1d1"
  paper: "#fcfbf7"
  graphite: "#202725"
  quiet-green-grey: "#6f7771"
  mint-signal: "#71d1ae"
  clay-negative: "#d87959"
  inference-gold: "#e2bd69"
  seam: "#d9d8cf"
typography:
  display:
    fontFamily: "Segoe UI, Tahoma, Arial, sans-serif"
    fontSize: "clamp(44px, 5.2vw, 74px)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.055em"
  headline:
    fontFamily: "Segoe UI, Tahoma, Arial, sans-serif"
    fontSize: "clamp(27px, 3vw, 39px)"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "Segoe UI, Tahoma, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.85
  label:
    fontFamily: "Segoe UI, Tahoma, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.4
rounded:
  control: "7px"
  network-stage: "13px"
  network-node: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  section: "76px"
components:
  button-primary:
    backgroundColor: "{colors.mint-signal}"
    textColor: "{colors.forest}"
    rounded: "{rounded.control}"
    height: "46px"
    padding: "0 17px"
  button-primary-hover:
    backgroundColor: "#91e4c2"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.graphite}"
    rounded: "{rounded.control}"
    height: "46px"
    padding: "0 17px"
---

# Design System: نَسَق

## Overview

**Creative North Star: ورشة النمط الشبكي.** The page feels like an active workshop where a student can trace how information becomes a decision. It uses joined geometric forms as a teaching device: a connection gets stronger when its current weight matters more, and every displayed prediction comes from the live model.

The audience is a curious 17-year-old beginner. Arabic copy stays brief and direct. The network remains the largest visual object in the learning surface; workshop materials frame its paths rather than decorate the whole page.

**Key Characteristics:**

- Arabic-first, right-to-left composition.
- Deep forest stage with limestone work surfaces.
- Mint signals, clay negative weights, and gold prediction marks.
- Real values beside every visualized model state.

## Colors

The palette separates the quiet workshop from the moving signal. Positive and negative influences use distinct colors, and labels always identify their meaning.

### Primary

- **Mint Signal** (#71d1ae): active data paths, positive weights, and primary actions.

### Secondary

- **Clay Negative** (#d87959): negative connection weights and mistake states.
- **Inference Gold** (#e2bd69): prediction emphasis and small completion marks.

### Neutral

- **Deep Forest** (#151d1c): hero, neural stages, and celebration surface.
- **Raised Forest** (#1c2825): diagram frames and inset stage surfaces.
- **Limestone** (#e8e1d1): page ground and quiet workshop areas.
- **Paper** (#fcfbf7): primary workbench surface.
- **Graphite** (#202725): main text.
- **Quiet Green-Grey** (#6f7771): supporting text.
- **Seam** (#d9d8cf): panel boundaries and rules.

### Named Rules

**The Signal Has a Job Rule.** Mint and clay identify actual positive and negative influence. Never use them as arbitrary decoration.

**The Model Stays Legible Rule.** Pair every color difference with a label or value so color is never the only explanation.

## Typography

**Display Font:** Segoe UI with Tahoma and Arial fallbacks.
**Body Font:** Segoe UI with Tahoma and Arial fallbacks.
**Label Font:** The same system stack, with tabular numerals for changing model values.

The system Arabic stack is available locally and keeps the page usable without a remote font service. Large titles are confident; body text stays open and readable.

### Hierarchy

- **Display** (700, clamp 44–74px, 1.2 line-height): opening statement.
- **Headline** (700, 27–39px, 1.35 line-height): chapter headings.
- **Title** (700, 22–24px, 1.4 line-height): experiment and game titles.
- **Body** (400, 13–17px, 1.8–1.9 line-height): short explanations, kept to a comfortable line length.
- **Label** (700, 10–12px, 1.4 line-height): chapter steps, small instructions, and model readings.

## Layout

The desktop opening uses a two-column composition in RTL order: Arabic story and action on the right; the live network stage on the left. At widths below 700px, these stack into one reading column and the network adopts its 340px compact design. Controls move below the scene on narrow screens. Chapter selection remains reachable by touch and keyboard.

Use 8px as the base spacing step. Main reading areas cap near 1160px; workbench panels use a single clear border. Keep each chapter's controls next to the result they affect.

## Elevation & Depth

Depth is tonal, not glossy. A slightly darker network stage separates live signals from paper controls. Borders and surface shifts carry most grouping; shadows stay quiet and never imitate glass.

## Shapes

Most controls use a 7px corner. The network stage uses 13px corners. Neurons are circles because their position and relationship matter in the diagram. Workbench panels remain square-edged so the lesson reads as a composed workshop surface.

## Components

- **Primary action:** mint fill, forest text, 46px minimum height, clear Arabic action label.
- **Secondary action:** transparent or paper fill with a visible seam and forest text.
- **Sliders:** native range controls with Arabic labels, visible live values, and keyboard support.
- **Neural network:** RTL flow from input at the right, through hidden neurons, to output at the left. Path width and color read from current parameters.
- **Feedback:** concise text near the changed control. Wins use a mint-tinted surface; mistakes remain explanatory and non-punitive.
- **Chapter navigation:** five named steps with current and completed states, plus a progress bar.

## Do's and Don'ts

- **Do** show the actual model value next to its visual effect.
- **Do** keep a visible explanation beside every unfamiliar slider.
- **Do** use the reduced-motion preference and preserve the same information in a still frame.
- **Don't** put a color, animation, or technical term in the way of the student's next action.
- **Don't** use workshop imagery as an unrelated background texture.
- **Don't** imply that the network understands a picture as a human does.
