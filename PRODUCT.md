# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three signed-in audiences, weighted equally (confirmed by Rafael, 2026-11-07):

- **Requesters** — private people (often deaf people going to a medical appointment, families with a wedding) and organisations (companies with members: owner, admins, members) who need an interpreter. They find one, request, agree the price, pay managed requests by transfer, confirm the service and review. Panel: `requester-web`.
- **Interpreters** — Angolan Sign Language (LGA) first, also spoken languages. They keep a profile with services and prices, set availability, answer invitations and open requests, negotiate, mark services done, receive payouts, request the Academy's verification. Panel: `interpreter-web`.
- **The Academy team** — staff at levels `super_admin`, `moderator`, `finance`, `request_operator`, each seeing and doing different things: accounts, requests and disputes, payments, verifications, content, configuration, audit. Panel: `admin-web`.

Visitors without an account see the public site (`site-web`): the directory listing, tutorials, contact.

## Product Purpose

The Portal dos Intérpretes is the Academia Grace Mind platform that connects people who need an interpreter with people who can do it. Today, finding an interpreter in Angola depends on knowing someone who knows someone; the Portal puts profiles, prices, availability, reviews, requests, price negotiation, scheduling and payment in one place. Success: a request goes from "I need an interpreter" to a confirmed, completed and reviewed service without leaving the Portal.

## Positioning

The Academy's verification badge: an interpreter who passed the Academy's training and follows its code of ethics. Verification is optional to work on the Portal; it is what distinguishes. The Academy can also arrange the interpreter itself (managed request), paid to the Portal.

## Operating Context

- Three ways to get an interpreter: direct (choose from the directory), open (publish; "first to accept" or "I choose"), managed (the team assigns; paid by bank transfer with a proof checked by hand).
- Directs and opens are paid outside the Portal; the Portal records the agreed price.
- Money is whole kwanzas (AOA), times in Africa/Luanda.
- Portuguese (Portugal/Angola spelling) for everything the user reads; code in English.

## Capabilities and Constraints

- Monorepo: four React + Vite apps (`site-web`, `requester-web`, `interpreter-web`, `admin-web`), shared `packages/ui` (shadcn/Radix + Tailwind), `packages/features`, `packages/auth`; Fastify API; Supabase (Postgres).
- Every rule lives in the database and API; screens never compute money or tax.
- Business rules, prices and flows come only from `docs/plan/decisions.md`, `docs/plan/specs/` and `docs/_source/product-explainer.md`.
- Pending from the Academy: legal texts, tax and invoice, bank details, the interpreter's share of managed requests, verification fee (PC-02 … PC-06).

## Brand Commitments

- Name: **Portal dos Intérpretes**, of the **Academia Grace Mind**.
- The existing logo stays; blue stays as the brand colour. Neutrals, surfaces, typography and the use of colour may evolve (Rafael, 2026-11-07).
- Signed-in panels must read as a premium, professional work dashboard — sober, never flashy (Rafael, 2026-11-07). The public site's inner pages follow the same calm, premium language; the home stays unless asked.

## Evidence on Hand

- No real testimonials, customers, statistics or prices are confirmed: do not fabricate them. Service prices in the catalog are placeholders (AD-032.8).

## Product Principles

1. Tell the truth about state: nothing looks done that is not done; every error is shown in Portuguese where it happened.
2. The person's next action is always obvious: what is waiting on me, and by when.
3. Trust is earned by clarity: prices, deadlines, who decided what, and what happens next are always visible.
4. Same system across the three panels; density follows the job of each panel.

## Accessibility & Inclusion

WCAG 2.2 AA (confirmed). Many users are deaf: nothing may depend on audio; visible focus, keyboard use, sufficient contrast, plain language.
