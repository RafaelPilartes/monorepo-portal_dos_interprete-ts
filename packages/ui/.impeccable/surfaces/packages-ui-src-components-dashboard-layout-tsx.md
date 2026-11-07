---
version: 1
slug: "packages-ui-src-components-dashboard-layout-tsx"
primary_target: "packages/ui/src/components/dashboard-layout.tsx"
related_targets: ["apps/admin-web","apps/requester-web","apps/interpreter-web","apps/site-web"]
---

# Surface brief — signed-in panels (admin-web, requester-web, interpreter-web) and the site's inner pages

Mode: operate (panels); read (site inner pages). Same visual world for both.

Audience and job: requesters, interpreters and the Academy team, weighted equally (PRODUCT.md). Each opens a panel to see what is waiting on them and act: answer, pay, confirm, validate. Constraints: Portuguese copy, WCAG 2.2 AA, logo and brand blue stay, no flashy effects, existing e2e labels keep working.

## Direction contract

FORM: clinic appointment book (agenda de clínica) — chosen by Rafael over the rolled direction; seed: seed:eed0a022774592dc.

THESIS: the panel is a calm appointment book — every list leads with the day and the time, in a fixed left column, the way a clinic agenda is read; it refuses the card-grid "stats tiles first" dashboard.

OWN-WORLD: light, cool clinical ground (near-white with a faint blue tint), white sheets with hairline borders, the brand blue only for the active place and primary actions; ink-navy text; state colours (green confirmed, amber waiting, red refused/disputed) as small dots and quiet pills. Institutional workhorse sans (Public Sans) with tabular figures; codes and references in Red Hat Mono.

STORY: open a panel → see today and what waits on you, in time order → open one row → act; nothing decorative between the person and the next action.

FIRST VIEWPORT: shell = light sidebar (logo, grouped navigation with a quiet active bar), slim top bar (context switcher, bell, account); work area = page title with one primary action, then the "agenda" list or table.

SIGNATURE: the agenda column — date/time set as a fixed tabular left column (day over time) in lists of requests, schedule, payments and payouts, with a hairline rule between days.

RISK: familiar; distinctiveness lives in the agenda rhythm, typography and restraint, so every atom must be precise.
