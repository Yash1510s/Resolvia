# Resolvia — UX / Routing / Navigation Audit (2026-09-07)

Scope: full application architecture audit. Findings below, followed by the
target architecture and the implementation plan.

## 1. Current structure (as found)

Single Next.js route (`app/page.tsx`, ~1,070 lines) that renders **9 "tabs"**
via a state flag (`activeTab`). No real routing, no URLs, no deep links, no
back-button support. All shared state (cases, role, balance, notifications)
lives in one component and is passed by props.

| # | "Page" (tab id) | What it actually is | Problem |
|---|---|---|---|
| 1 | `home` | Public LandingPage | OK (kept as public landing) |
| 2 | `cases` | Dashboard **and** Case Details (sub-state `isViewingCaseDetails`) + 6 sub-tabs | Two unrelated concepts in one tab; case details unreachable by URL |
| 3 | `my-cases` | Flat grid of ALL cases | No role tabs (Claimant/Respondent/Juror/Closed). Selecting a case force-switches to the `cases` tab (context loss) |
| 4 | `ai-radar` | AI panel bound to the *last selected* case | AI analysis is a property of a case, not a global page. Confusing, disconnected |
| 5 | `verifier` | VerificationPortal | Fine, needs a home + breadcrumbs |
| 6 | `legal-export` | "BSA Dossier Generator" that just opens a modal | Not a real page; the post-verdict record concept is buried in a modal |
| 7 | `analytics` | "Case Studies" — ONE hardcoded card (an *attendance* dispute) | Not the product's actual cases; "Read Full Case Study" jumps to `cases[0]` (a different case) = **broken link**; no disclosure levels; no community discussion |
| 8 | `profile` | Hardcoded "Yash Vijay Singh" | Not tied to the signed-in user (auth exists!); no real reputation |
| 9 | `notifications` | Hardcoded list; tabs are decorative | Not derived from case events; no links |

## 2. Broken / incorrect / missing connections

- **Broken link:** Case Studies → "Read Full Case Study" opens the wrong case.
- **No URL routing:** nothing is deep-linkable; `?case=` doesn't exist; refresh loses context.
- **My Cases → Case Details** requires a tab switch; the "view" model is muddled.
- **"Become a Juror" quick action** = sets role JUROR_1 + jumps into an arbitrary case's jury sub-tab. No jury dashboard, no invitations, no availability, no anonymity.
- **Juror identity exposure:** mock jurors have real names + wallets (`Juror Carol (Smart Contract Auditor)`, `0x32a1…`) shown in the panel — violates the anonymity requirement.
- **Role assumption:** the app implicitly assumes the user is the claimant (dashboard greeting, "your case" everywhere). No claimant/respondent/juror split.
- **Missing pages entirely:** Jury Dashboard, Jury Invitation, Jury Case Review,
  Anonymous Deliberation, Jury History, Reputation, Settings (incl. jury
  availability), Profile (real), Notifications (real), Resources / How It
  Works, Proof Verifier (home), Case Study detail w/ 3 disclosure levels,
  Community Discussion (post-closure, per-case), Case Record / Forensic view.
- **No case-lifecycle reflection:** status is a single badge; there is no
  stepper, no state-dependent sections, no appeal UI, no closed→case-study
  linkage, no post-closure community discussion.
- **Create Case:** wizard is a 5-step modal (good start) but lacks an explicit
  draft-saved state, a submission confirmation screen, and the full
  category→parties→claim→outcome→evidence→verify→review→stake→submit→confirm
  arc.
- **Naming inconsistencies:** "Home & Cases", "AI Advisory", "Legal Export",
  "Case Studies", "Profile & Reputation" — routes and labels don't agree.
- **No breadcrumbs, no consistent empty/loading/error states.**

## 3. Target architecture

Real App Router routes with a shared authenticated **app shell** (top nav +
sidebar + breadcrumbs) and a single **AppContext** holding all shared state.

```
/                         Public Landing (auth optional)
(app)  — authenticated shell (Navbar + Sidebar + breadcrumbs)
  /dashboard              Action hub: "what do I need to do next"
  /cases                  My Cases → tabs: As Claimant | As Respondent | As Juror | Closed
  /cases/[caseId]         Case Details (central): state-aware sections
  /cases/[caseId]/…       ?section=overview|response|evidence|ai|jury|voting|verdict|appeal|timeline|record|discussion
  /jury                   Jury Dashboard: pool state, invitations, assignments, history, availability
  /jury/[caseId]          Juror Review → Anonymous Deliberation → Commit → Reveal
  /reputation             Reputation (reliability/compliance/history, NOT majority-vote)
  /case-studies           Public closed cases
  /case-studies/[caseId]  3 disclosure levels + Community Discussion (closed only)
  /notifications          Derived from case events, linked, filterable
  /proof-verifier         Verification portal
  /profile                Tied to signed-in identity + wallet
  /settings               Account, wallet, Jury participation (availability/return date/max concurrent)
  /resources              How it works, guidelines, terminology
```

Case lifecycle (single dynamic Case Details page, sections gated by state):
Draft → Submitted → Validation → Respondent Response → Evidence → Evidence
Locked → AI Analysis → Jury Selection → Jury Invitation → Jury Review →
Commit → Reveal → Verdict → Appeal Window → Finalized → Closed.

## 4. Key decisions

- **One coherent product:** a case is a first-class object; everything (AI,
  evidence, jury, voting, verdict, appeal, record, discussion) is a section of
  its Case Details page, reachable by URL.
- **Roles:** My Cases split by the user's role. The demo "persona" switcher is
  kept (labelled) so journeys A/B/C can be exercised, but navigation no longer
  assumes claimant.
- **Jury anonymity:** jurors shown as `Juror #A7F2` (derived from wallet hash),
  never names. Deliberation is private/anonymous; community discussion is a
  separate, post-closure, per-case space. **No global chat, no active-case chat.**
- **Jury flow:** availability states (Available / Temporarily Unavailable /
  Opted Out) in Settings drive selection. Invitations reveal minimal info
  (case id, category, effort, deadline) → Accept / Decline / Expire →
  replacement selected. Declining for availability does **not** reduce reputation.
- **Case Studies:** closed cases with 3 disclosure levels (Overview / Verified
  Case Study / Legal-Forensic Record) + post-closure community discussion.
- **Post-verdict record:** a real "Case Record / Legal & Forensic Package"
  section (structured electronic record; admissibility language corrected).
- **AI:** clearly labelled "AI-Assisted Analysis — does not determine the
  verdict"; AI recommendation hidden from jurors until after independent review.
- **Auth:** MetaMask optional; Google / GitHub / Email-OTP / embedded wallet.
  Blockchain address and login identity are separate.
- **Honesty:** features not yet fully wired are built as correct
  pages/states and marked `Prototype` / `Coming soon` — never deleted.

## 5. Implementation checklist

Foundation
- [x] AppContext (cases + role + balance + jury + notifications + wizard)
- [x] Route group `(app)` + shared shell (Navbar, Sidebar, breadcrumbs)
- [x] Types extended (myRole, appeal, discussion, JuryInvitation, availability, history, notifications)
- [x] Jury helpers (anonymised pseudonym, availability, invitations, replacement)
- [x] Case-lifecycle helper (status→step, section visibility)

Pages
- [x] Landing (public) → auth-gated entry
- [x] Dashboard (action hub)
- [x] My Cases (role tabs + closed)
- [x] Case Details (state-aware, all sections, appeal, record, timeline, discussion)
- [x] Jury Dashboard (invitations, assignments, history, availability)
- [x] Juror Case Review + Deliberation + Commit/Reveal (anonymous)
- [x] Reputation
- [x] Case Studies list + detail (3 disclosure levels + community discussion)
- [x] Notifications (event-derived, linked)
- [x] Proof Verifier
- [x] Profile (tied to identity + wallet)
- [x] Settings (account, wallet, jury participation)
- [x] Resources / How it works

Components
- [x] StatusStepper (lifecycle)
- [x] JurorBadge (anonymous pseudonym)
- [x] JuryInvitation card (accept/decline/expire/replacement)
- [x] CommunityDiscussion (per-case, closed only)
- [x] CaseStudyDetail (disclosure levels)
- [x] Create Case wizard (draft, stake confirm, submission confirmation)
- [x] Anonymised CommitRevealVoting
- [x] Consistent status badges, empty/loading states, breadcrumbs

Verification
- [x] tsc clean (0 errors), all 23 routes return 200
- [x] hardhat 17/17, assigned-wallet E2E (previous run)
- [x] Journey A (claimant): case-092 — claimant role chip, AI "run analysis"
      generates the advisory AND selects the 5-juror panel, lifecycle
      progresses AI_ANALYSIS → JURY_COMMIT.
- [x] Journey B (respondent): case-071 — "File an Appeal" form in the Appeal
      section; filing records grounds + fresh-panel note.
- [x] Journey C (juror): /jury shows the PENDING invitation (case-102) with
      minimal detail → Accept → myRole JUROR + panel formed → /jury/case-102
      workspace (AI locked, independent-review checklist) → commit → reveal
      (+ "simulate other jurors" demo helper) → verdict → appeal window.
      Existing panel (case-084): juror-01 is "you", reveal completes it.
      Anonymity: all panels show wallet-derived pseudonyms, no names/wallets.
- [x] Journey D (public/research): landing → /case-studies (no sign-in
      required) → case-059/case-031 detail with the 3 disclosure levels and
      the post-closure community discussion (with an anonymous juror reply).
- [x] No global chat, no active-case chat: discussion section explicitly
      locked until CLOSED; all in-case communication is claim/response/
      evidence/system notifications only.
