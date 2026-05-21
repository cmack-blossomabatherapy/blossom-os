## Goal

Strip every interactive entry point that opens or sends a message/text across the app. Keep Call, Email, and Note actions everywhere. Keep activity-feed/timeline records that *display* past messages (those are history, not entry points).

## Files to edit

### Command Center & shell
- **`src/pages/os/OSCommandCenter.tsx`** — remove unused `MessageSquare` import.
- **`src/pages/os/OSShell.tsx`** — remove unused `MessageSquare` import. Floating bottom nav has no Message entry; no other change.

### Clients
- **`src/pages/os/OSClients.tsx`** — remove the `{ label: "Message", icon: MessageSquare, … }` entry from the detail-panel actions array (line 228). Drop `MessageSquare` from the import line if it becomes unused.
- **`src/pages/Clients.tsx`** — remove the "Text" quick-action button (line 325) and the "Log text" button inside the Communications tab (line 395). Keep Call/Email/Log call/Log email. Drop `MessageSquare` if unused after.

### Role workspaces (each has a hero "quick actions" row + a tiny icon button row in the contact list)
For each file below: remove the Message/Send Follow-Up/Send Text/Message Team/Message Staff/Message BCBA/Contact BCBA entry from the actions array, AND remove the `<button title="Text">…<MessageSquare/></button>` tile from the contact-list action cluster. Keep Call/Email/Note tiles. Drop `MessageSquare` from imports if unused after.

- `src/pages/os/OSLeads.tsx` — drop "Send Text" (l.79) and "Text" (l.208).
- `src/pages/os/OSIntakeCoordinator.tsx` — drop "Send Follow-Up" (l.131) and the inline Text button (l.549). Keep the `kind: "Text"` items in the activity feed (those are records of past attempts).
- `src/pages/os/OSRecruitingTeam.tsx` — drop "Send Follow-Up" (l.131) and inline Text button (l.550).
- `src/pages/os/OSSchedulingTeam.tsx` — drop "Message Staff" (l.130) and inline Text button (l.549).
- `src/pages/os/OSAuthCoordinator.tsx` — drop "Contact BCBA" (l.130) and inline Text button (l.548).
- `src/pages/os/OSBCBA.tsx` — drop "Message Team" (l.123).
- `src/pages/os/OSRBT.tsx` — drop "Message BCBA" (l.88). Keep the chat-style notifications at l.64/79 (history, not entry points).

### Lead & call detail panels
- **`src/components/leads/LeadDetailPanel.tsx`** — remove the `{ icon: MessageSquare, label: "Text" }` quick-action (l.80).
- **`src/components/calls/CallDetailPanel.tsx`** — remove the `<ActionBtn icon={MessageSquare} label="Text" />` button (l.73).

### Intake dashboard
- **`src/pages/IntakeDashboard.tsx`** — remove "Text" from the inline action array (l.257) and from the `onAction` allowlist (l.159). Keep Call/Email/Send Form/Mark Contacted/Assign Owner/Open Lead.

## Preserved deliberately
- All Call, Email, Note/Log note, Send Form, Mark Contacted actions.
- Activity feeds / timelines / notification streams that show received messages or texts (`kind: "Text"` items, "left feedback on your note", etc.) — these are records, not entry points.
- Internal training content references to "Microsoft Teams / communication standards" in `src/lib/onboarding/journey.ts` and `src/pages/onboarding/HowItWorks.tsx` (training material, not in-app messaging entry points).
- The `MessageTemplate` type/mock in `src/data/settings.ts` (schema only; no UI surfacing it is in scope).

## Verification
- Build passes (harness).
- Grep `rg -n "MessageSquare|\"Text\"|\"Message\"|Send Follow-Up|Contact BCBA|Message (Team|Staff|BCBA)" src/pages src/components` shows only timeline/history occurrences and onboarding/training references.
- Spot-check Command Center, Clients, Leads, Intake, RBT, BCBA, Auth Coordinator, Recruiting, Scheduling pages: no Message/Text buttons or cards remain.
