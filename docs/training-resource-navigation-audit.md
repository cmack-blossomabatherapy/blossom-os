# Training + Resource UX Rescue — Pass 1

Navigation audit and canonical routing for Training Management, Training
Academy, Welcome to Blossom, and the Resource Library admin upload path.

## Canonical routes

| Surface | Route | Purpose |
|---|---|---|
| Learner Training Academy | `/training` | Role-based Continue Learning + Journey hub |
| Training Management workspace | `/hr/training-center` | Admin control room |
| Welcome to Blossom (ceremonial) | `/onboarding/phase/welcome` | Polished standalone onboarding experience (OSWelcomeToBlossom) |
| Welcome to Blossom (alias) | `/training/welcome` | Redirects to canonical welcome route |
| Learner Resource Library | `/resource-library` | Read-only, role-scoped, published-only |
| Admin Resource Management | `/hr/resource-management` | Upload, classify, publish, review queues |
| Admin bulk upload deep-link | `/hr/resource-management#bulk-upload` | Auto-scrolls to bulk upload panel |

## Broken / legacy navigation found

- `Upload SOP` button language in the Training Management header and SOPs list
  was misleading — the Resource Library now supports SOPs, handbooks, policies,
  templates, videos, guides, checklists, and workflows. Renamed to
  **Upload Resource** and rerouted to `/hr/resource-management#bulk-upload`.
- Header `Upload File` button in `/hr/resource-management` re-labeled to
  **Upload Resource** and now scrolls to the bulk upload panel rather than
  acting as a dead button.
- Training Management Resource Library tab now exposes three primary CTAs
  (Upload Resource / Open Resource Management / Upload first document batch),
  all routing to the canonical admin surface.
- No remaining `href="#"` fallbacks in the Training Management, Resource
  Library, or Welcome to Blossom navigation paths.

## Welcome to Blossom

`OSWelcomeToBlossom` (registered at `/onboarding/phase/welcome`) is the
canonical ceremonial first-day experience. It includes:

- Welcome hero with personalized greeting
- Welcome video (pending-video state remains non-blocking)
- Mission / Values / Team pillars
- Get-to-know-Blossom quick links (Mission, Values, Meet the Team, How Blossom Works)
- Mentor / HR check-in note
- Start Week 1 CTA into the State Director / role journey

The State Director 5-week / 25-day journey structure is unchanged.

## Resource upload discoverability

- `/hr/training-center` → Resource Library tab shows what can be uploaded and
  links straight to the admin workspace.
- `/hr/resource-management` header Upload Resource button + the deep-link
  anchor (`#bulk-upload`) ensure every upload CTA lands at the bulk upload
  panel where files are classified into review queues.
- Learner `/resource-library` still hides anything not `Published`.

## Remaining polish recommendations

- Add inline counts (ready / privacy / vault / published) to the TMC Resource
  Library tab so admins see queue health without leaving the page.
- Replace the legacy `Upload SOP` modal in Training Management Center with a
  thin wrapper that redirects to the bulk upload panel once parity is verified.
- Audit remaining "SOP" wording in `HRSuiteHome` quick actions for the same
  Upload Resource rename.