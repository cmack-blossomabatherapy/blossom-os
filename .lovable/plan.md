I found the BCBA pages and routes already exist, and the sidebar has a BCBA-specific section, but the current display can still show the older Academy-style menu depending on role detection / selected OS role.

Plan:

1. Update the BCBA menu definition in `src/components/layout/AppSidebar.tsx` to exactly match:

```text
HOME
- Dashboard
- BCBA Workspace
- Training Academy

CLIENTS & CLINICAL
- Clients
- Authorizations
- Supervision
- Parent Training
- Scheduling

RESOURCES
- Resource Library

AI
- Ask Blossom AI
```

2. Make BCBA role detection win over the generic Academy/admin sidebar when the selected OS role is BCBA or the user has the `bcba` role, so the attached menu cannot appear for BCBA users.

3. Keep all links pointed at the BCBA pages already created:
- `/bcba`
- `/bcba/workspace`
- `/academy` or the existing BCBA training route if the app currently expects it
- `/bcba/clients`
- `/bcba/authorizations`
- `/bcba/supervision`
- `/bcba/parent-training`
- `/bcba/scheduling`
- `/bcba/resources`
- `/ai/assistant`

4. Make these sections open by default for the BCBA sidebar so the menu immediately shows the full structure instead of collapsed legacy groups.