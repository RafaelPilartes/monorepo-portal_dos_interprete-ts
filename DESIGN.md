---
name: Portal dos Intérpretes
description: Signed-in panels of the Academia Grace Mind interpreter portal, read like a clinic appointment book.
colors:
  brand-blue: "#0749ac"
  brand-blue-ink: "#ffffff"
  ink-navy: "#10192d"
  clinical-ground: "#f7f8fb"
  sheet: "#ffffff"
  quiet-fill: "#edf0f5"
  muted-ink: "#545d6d"
  blue-wash: "#e9f1fb"
  blue-wash-ink: "#063e93"
  hairline: "#dde1e9"
  input-stroke: "#848e9f"
  state-confirmed: "#19764a"
  state-waiting: "#a65707"
  state-refused: "#bf2222"
  banner-navy: "#131d34"
  night-ground: "#0c1018"
  night-sheet: "#121721"
  night-ink: "#ecf0f4"
  night-quiet-fill: "#1c212c"
  night-muted-ink: "#9ca5b4"
  night-blue-wash: "#1c2a40"
  night-blue-wash-ink: "#8bbaf9"
  night-hairline: "#252a37"
  night-input-stroke: "#323948"
  night-brand-blue: "#4993f3"
  night-brand-blue-ink: "#0b111e"
  night-state-confirmed: "#47c289"
  night-state-waiting: "#f7b23b"
  night-state-refused: "#e85e5e"
typography:
  headline:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "-0.01em"
  agenda-time:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\" 1"
  body:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: "-0.003em"
  nav:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.25
  label:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
  code:
    fontFamily: "Red Hat Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  sheet: "10px"
  pill: "9999px"
spacing:
  row-tight: "12px"
  row: "14px"
  gutter: "16px"
  section: "24px"
  page-x-lg: "40px"
  agenda-column: "76px"
components:
  button-primary:
    backgroundColor: "{colors.brand-blue}"
    textColor: "{colors.brand-blue-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "#205bb4"
  button-outline:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink-navy}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-outline-hover:
    backgroundColor: "{colors.quiet-fill}"
  button-ghost-hover:
    backgroundColor: "{colors.blue-wash}"
    textColor: "{colors.blue-wash-ink}"
  button-sm:
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  input:
    backgroundColor: "{colors.clinical-ground}"
    textColor: "{colors.ink-navy}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "36px"
  card:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink-navy}"
    rounded: "{rounded.sheet}"
    padding: "24px"
  table-head:
    backgroundColor: "{colors.quiet-fill}"
    textColor: "{colors.muted-ink}"
    typography: "{typography.label}"
    height: "36px"
    padding: "0 12px"
  table-cell:
    padding: "12px"
  nav-item:
    textColor: "{colors.ink-navy}"
    typography: "{typography.nav}"
    rounded: "{rounded.md}"
    height: "32px"
    padding: "0 10px"
  nav-item-active:
    backgroundColor: "{colors.blue-wash}"
    textColor: "{colors.blue-wash-ink}"
  status-pill-confirmed:
    textColor: "{colors.state-confirmed}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  status-pill-waiting:
    textColor: "{colors.state-waiting}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  status-pill-refused:
    textColor: "{colors.state-refused}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  status-pill-ended:
    backgroundColor: "{colors.quiet-fill}"
    textColor: "{colors.muted-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  agenda-when:
    typography: "{typography.agenda-time}"
    width: "76px"
  agenda-item:
    padding: "14px 0"
  waiting-count:
    backgroundColor: "{colors.blue-wash}"
    textColor: "{colors.blue-wash-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "28px"
  top-bar:
    backgroundColor: "{colors.sheet}"
    height: "56px"
  sidebar:
    backgroundColor: "{colors.sheet}"
    width: "256px"
---

# Design System: Portal dos Intérpretes

## Overview

**Creative North Star: "The Clinic Appointment Book"**

The three signed-in panels (requester, interpreter and Academy team) work like a calm clinic agenda. A list of things that happen at a time starts with the day and the time in a fixed left column, so you scan it the way a receptionist scans the day's book. Each screen answers two questions: what is waiting on me, and what comes next. Nothing decorative sits between the person and their next action. The system rejects the card-grid dashboard that leads with stats tiles.

The material is light and clinical. Content sits on a cool, faintly blue-tinted near-white ground, on white sheets with hairline borders. The text is ink-navy. Brand blue appears in only two places, the active location and the primary action. State colours (green for confirmed, amber for waiting, red for refused or disputed) appear as small dots and quiet pills, and they are dark enough to read as text. Public Sans, an institutional workhorse, sets every word, with tabular figures wherever numbers line up. Red Hat Mono is kept for request codes, references, IBANs and audit actions. Density is moderate: 36px controls, 14px agenda rows and 12px table cells.

**Scope.** This world applies to the three panels (`<html class="app-panel">` in `admin-web`, `requester-web` and `interpreter-web`), where shared components opt into it through the `panel:` variant. It also applies to the public site's inner pages through the page banner (cool ground, ink title, short brand-blue rule) and the solid ink-navy closing band. The site home is **out of scope**. It keeps its older look (gradient hero, Plus Jakarta Sans, lifted cards) by the Academy's decision, and nothing here governs it. The site does not set `app-panel`, so its inner pages still render in Plus Jakarta Sans with the root tokens (12px radius, the older shadow scale).

**Key Characteristics:**
- Time comes first: a 76px tabular column with the day above the time leads every timed list.
- Cool ground, white sheets, 1px hairlines. Depth comes from tone, not from lift.
- Brand blue only marks the active place and the primary action.
- State is carried by a dot and a word together, never by fill alone.
- Public Sans everywhere with tabular numbers. Red Hat Mono for codes.
- Portuguese for everything the user reads.

## Colors

The palette is a cool clinical neutral set with one brand blue and three quiet state colours.

### Primary
- **Academy Brand Blue** (brand-blue): the primary button fill, the active navigation icon, the "Hoje"/"Amanhã" day label in the agenda column, the focus ring, text selection (at 18%), and the short rule above inner-page titles on the site. White text on it passes comfortably.
- **Deep Blue Wash** (blue-wash, with blue-wash-ink): the active navigation item, ghost-button hover, the neutral count bubble in the waiting list, and the empty-state icon disc.

### Neutral
- **Clinical Ground** (clinical-ground): the page background behind every sheet. It is also the input field fill and the site inner-page banner.
- **Sheet White** (sheet): cards, the sidebar, the top bar, and popovers.
- **Ink Navy** (ink-navy): all body text and headings. Inactive navigation labels use it at 75%.
- **Muted Ink** (muted-ink): secondary lines, table headers, metadata, mono codes, and group labels.
- **Quiet Fill** (quiet-fill): table header strips (at 60%), outline-button hover, the tabs track, and "ended" pills (cancelled, expired, withdrawn).
- **Hairline** (hairline): every border and divider: sheet edges, agenda separators, the line between the time column and the content.
- **Input Stroke** (input-stroke): the border of fields and outline buttons.
- **Banner Navy** (banner-navy): the solid closing band on the site's inner pages (`.page-banner`).

### State colours
- **Confirmed Green** (state-confirmed): confirmed, accepted, completed, verified, active.
- **Waiting Amber** (state-waiting): every "awaiting…" state, invitations, applications, payment review, and urgent counts in the waiting list. Reply-by deadlines also use it as text.
- **Refused Red** (state-refused): declined, disputed, rejected, the "Urgente" marker, "Sair", and destructive actions.
- **Delivered Blue**: the "delivered" and "proof submitted" states reuse brand blue at the pill tint.

Pills put the state colour on a 10% tint of the same colour. The darkened panel values were chosen so the text holds at least 4.5:1 on that tint.

### Named Rules
**The Two Places Rule.** Brand blue marks where you are (the active navigation item, today in the agenda) and what you do next (the primary button). It is never decorative fill. One primary action per page header.

**The Dot-and-Word Rule.** Every status shows its colour as a 6px dot in `currentColor` beside a Portuguese label. Colour never carries state alone.

## Typography

**Display Font:** none in the panels. The page title is the largest step.
**Body Font:** Public Sans (with system-ui, sans-serif), weights 400/500/600/700, global tracking -0.003em.
**Label/Mono Font:** Red Hat Mono (with ui-monospace, SFMono-Regular, Menlo), weights 400/500.

**Character:** Public Sans is an institutional sans with no personality to perform. It reads like a well-kept form. Red Hat Mono separates machine references (request codes, payment references, IBANs, audit actions) from human text without shouting.

### Hierarchy
- **Headline** (600, 1.5rem, 1.25, -0.02em, balanced wrap): the page title in the page header. On the overview it is the greeting "Olá, Joana".
- **Title** (600, 0.9375rem, 1.375, -0.01em): card titles ("Próximos serviços", "À tua espera") and empty-state titles. They are small on purpose, so content outranks chrome.
- **Agenda time** (600, 0.9375rem, -0.01em, tabular): the time in the agenda column.
- **Body** (400–500, 0.875rem): rows, cells and descriptions. Page descriptions are capped at 65ch.
- **Nav** (400, 0.8125rem; 500 when active): sidebar items.
- **Label** (500, 0.75rem): table headers, pills, the day line of the agenda column, nav group labels. The sidebar app label ("Área do intérprete") is 0.6875rem at 500. Labels are sentence case, never uppercase-tracked.
- **Code** (Red Hat Mono 400, 0.75rem, muted ink): request codes such as `PI-…`, references, IBANs.

### Named Rules
**The Tabular Figures Rule.** Every table, and every element marked `tabular-nums`, sets numbers in tabular figures, so times, kwanza amounts and counts line up in columns.

**The Mono Is For Machines Rule.** Red Hat Mono is used only for identifiers a person might copy or quote back. It is never used for labels, headings or emphasis.

## Layout

The shell has a fixed 256px white sidebar on the left (from the `lg` breakpoint, 1024px; below that it becomes a slide-in drawer over a 30% ink scrim) and a sticky 56px white top bar with a hairline bottom. The top bar holds the context switcher on the left, then the bell, theme toggle and account menu. The work area is capped at 84rem (1344px) and centred. Its padding is 16px on phones, 24px from `sm` and 40px from `lg`, with 24px vertical padding (36px on `lg`).

Each page has the same reading order: a page header (title, optional description, one primary action aligned to the bottom-right from `sm`), then the agenda list or the table. Overview pages use a two-column grid on `lg` (`minmax(0,1fr)` plus a 22rem side column) with 24px gaps. The side column holds "À tua espera" and comes **first** on phones. Sections stack with 24px between them, and cards pad 24px.

Breakpoints are Tailwind's defaults (640 / 768 / 1024 / 1280). Secondary table columns hide below `sm`/`md` rather than wrapping.

## Elevation & Depth

The panels are flat by default and use tonal layering: the cool ground, then white sheets with hairlines. Cards carry only a barely visible shadow (sm). Buttons carry none in the panels, even though the site's buttons do. Larger shadows are kept for things that float above the page (menus, popovers, dialogs).

### Shadow Vocabulary
- **Sheet** (`0 1px 2px 0 hsl(222 47% 12% / 0.04)`): cards and the active tab.
- **Float** (`0 2px 8px -2px hsl(222 47% 12% / 0.08), 0 1px 2px 0 hsl(222 47% 12% / 0.04)`): dropdown menus and popovers.
- **Overlay** (`0 12px 32px -8px hsl(222 47% 12% / 0.14), 0 2px 6px 0 hsl(222 47% 12% / 0.05)`): dialogs and sheets over the page.

### Named Rules
**The Paper, Not Plastic Rule.** In the panels, nothing at rest lifts, glows or translates on hover. Hover changes a background tone (quiet fill, or blue wash at 40–50%) over 150ms, and that is all.

## Shapes

Corners are small and consistent. The panel radius base is 8px (lg). Buttons, inputs, nav items, table-header ends and inner boxes use 6px (md). Cards round slightly more, at 10px (sheet). Pills, count bubbles, avatars and status dots are fully round. Every edge is a 1px hairline. The agenda content column is set off from the time column by a 1px vertical hairline, and the rows of a list are separated by horizontal hairlines.

## Components

### Buttons
Quiet and precise. In the panels they never lift or scale.
- **Shape:** gently rounded (6px).
- **Primary:** brand-blue fill, white text, 500 weight, 36px tall with 16px side padding. Small is 32px with 12px padding, large is 40px. An icon sits at 16px with an 8px gap.
- **Hover / Focus:** the fill drops to 90% over 150ms. Focus shows a 2px brand-blue ring with a 2px offset.
- **Outline:** sheet fill, 1px input-stroke border, ink text. Hover shows the quiet fill.
- **Ghost:** no fill. Hover shows the blue wash with blue-wash-ink text (for example "Ver todos" in a card header).
- **Destructive:** red fill, white text, for irreversible actions only.

### Chips (status pills and badges)
- **Style:** a full pill, 2px × 8px, 0.75rem at 500. The text is in the state colour on a 10% tint of it, with no border in the panels. There is a 6px current-colour dot before the label.
- **State:** waiting is amber, confirmed is green, delivered or submitted is blue, refused or disputed is red, ended is quiet fill with muted ink. An unknown status shows "Estado desconhecido" in the ended style. The `Badge` primary variant becomes brand blue on a 10% tint in the panels. The "Urgente" marker is the red tinted badge at 10px.

### Cards / Containers
- **Corner Style:** 10px.
- **Background:** sheet white on the clinical ground.
- **Shadow Strategy:** Sheet (see Elevation & Depth).
- **Border:** 1px hairline.
- **Internal Padding:** 24px. Card headers that carry an action are a single row with the title on the left and a ghost button on the right.

### Inputs / Fields
- **Style:** 36px tall, 6px radius, 1px input-stroke border, clinical-ground fill, 12px horizontal padding, 0.875rem text, muted-ink placeholder.
- **Focus:** a 2px brand-blue ring with a 2px offset.
- **Error / Disabled:** disabled is 50% opacity with a not-allowed cursor. Errors are written in Portuguese beside the field.

### Tables
The header is a 36px quiet-fill strip at 60%, with 0.75rem/500 muted-ink labels and rounded ends (6px). Cells are padded 12px. Rows are separated by hairlines and take a 40% blue wash on hover. The first column of a timed table is the agenda column ("Quando").

### Navigation
- **Sidebar:** logo in a 56px header row, then the app label (0.6875rem, muted), then items 32px tall at 0.8125rem with 16px icons in muted ink. Items can sit in collapsible groups with 0.75rem/500 muted labels and a chevron.
- **Active:** blue-wash fill, blue-wash-ink text at 500, brand-blue icon, `aria-current="page"`. The most specific matching route wins.
- **Hover:** quiet fill, with the text moving to full ink.
- **Mobile:** below 1024px the sidebar becomes a drawer opened from the top bar's menu button and closed by the scrim, the X button, or choosing an item.

### Empty state
Centred, 48px vertical padding. A 20px icon sits in a round blue-wash disc, followed by a title, a one-sentence explanation (max 24rem, muted), and an optional action. The copy says what to do next, in Portuguese.

### The Agenda (signature)
The appointment book itself, in `AgendaWhen`, `AgendaItem` and `AgendaList`.
- **When column:** a fixed 76px column in tabular figures. The top line is the day: "Hoje"/"Amanhã" in brand blue at 500, otherwise "qua 12 nov" in muted ink at 0.75rem. Below it is the time ("14:30") at 0.9375rem/600, in Luanda time. When there is no date it reads "Sem data".
- **Item:** 14px vertical padding and a 16px gap. The content column has a 1px hairline on its left edge and 16px left padding. It holds the title (500, linked) over a muted line that starts with the mono code. The aside (status pill, price, actions) aligns right from `sm`. On phones it wraps under the content, indented to the content column.
- **List:** items separated by hairlines. The same column leads the requests table, the interpreter's invitations, the schedule, and the overviews' "Próximos serviços".

### Waiting list ("À tua espera")
Each line covers one kind of pending work: a 28px round count bubble (blue wash, or amber on a 10% tint when urgent), a 0.875rem/500 label over a truncated muted detail, and a chevron that nudges 2px right on hover. The whole row is a link with a 6px radius, a 50% blue-wash hover, and a focus ring. Rows with a zero count are hidden. When nothing is waiting, a single centred muted sentence says so.

### Site inner-page banner
A cool clinical-ground band under the fixed site header, with a hairline bottom. It holds a short brand-blue rule (40 × 4px, round), then the title at 2–3rem/600, tracking -0.025em, left-aligned, then an optional muted subtitle capped at 60ch. Closing call-to-action bands use the solid banner-navy field with no pattern and no glow.

## Do's and Don'ts

### Do:
- **Do** lead every list of timed things with the agenda column (day above time, 76px, tabular), and keep it as the first column of timed tables.
- **Do** keep brand blue to the active place and the primary action (the Two Places Rule). Use one primary button per page header.
- **Do** show state as a dot plus a Portuguese word on a 10% tint of the state colour.
- **Do** use tabular figures for times, kwanza amounts and counts, and Red Hat Mono for codes and references.
- **Do** keep sheets flat: white, 1px hairline, 10px corners, sheet shadow only. Hover is a tone change over 150ms.
- **Do** put "what waits on me" before "everything" on overviews, and first on phones.
- **Do** give every list its empty, loading and error states in plain Portuguese.

### Don't:
- **Don't** open a panel with a grid of stats tiles. The agenda and the waiting list are the first view.
- **Don't** use gradients, glows, lifted or translating hover, or `scale` press effects inside the panels.
- **Don't** let colour alone carry a state, or use a state colour as decoration.
- **Don't** set labels in uppercase with wide tracking. Labels are sentence case at 0.75rem/500.
- **Don't** use the site's purple secondary in the panels.
- **Don't** apply this file's rules to the site home, which keeps its own look.

### Accessibility (WCAG 2.2 AA)
- Text contrast is measured on white. Ink-navy is about 17.5:1 and muted ink about 6.7:1. On their 10% pill tints, waiting amber is about 4.6:1, confirmed green about 4.9:1 and refused red about 5.2:1. In dark mode, every state colour is at least 4.7:1 on its tint over the night sheet.
- Every interactive element shows a visible 2px focus ring in brand blue. The sidebar, the menus and the drawer all work from the keyboard. Icon-only buttons carry Portuguese `aria-label`s.
- Nothing depends on audio, because many users are deaf. Nothing depends on colour alone (the Dot-and-Word Rule).

### Dark mode
The theme toggle in the top bar switches `.app-panel.dark`. The ground becomes night-ground, sheets night-sheet, text night-ink, and hairlines night-hairline. Brand blue lightens to night-brand-blue with dark text on it (night-brand-blue-ink), and the state colours lighten so they stay readable as text. Sheets keep the same structure. The night tokens stand in for the light ones role for role.
