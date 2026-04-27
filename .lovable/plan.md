Plan to implement the dedicated Finance Dashboard without rebuilding the app shell:

1. Create the Finance Dashboard page
- Add a new `FinanceDashboard` page using the existing Blossom design system.
- Build it desktop-first with responsive stacking for mobile/tablet.
- Use semantic Tailwind tokens only.

2. Add shared connected finance mock data
- Create at least 15 realistic finance client records across states, clinics, payors, client types, auth statuses, billing states, payment plans, revenue levels, reauth risk, and payroll impact.
- Use one shared dataset so KPIs, tables, funnels, queues, and side panel all stay connected.

3. Build the dashboard header and sticky filters
- Title: `Finance Dashboard`
- Subtitle: `Revenue, profitability, billing health, and financial risk across the pipeline.`
- Add filters for date range, state, clinic, payor, client type, financial status, and billing status.
- Add Refresh and Export actions.

4. Build interactive Finance Dashboard sections
- Clickable KPI row:
  - Expected Revenue
  - Collected Revenue
  - At-Risk Revenue
  - Payment Plans
  - Avg Client Value
  - Revenue Blocked
  - Avg Time to Revenue
  - Payroll Cost
- Financial Action Queue:
  - Urgent Now
  - Follow-Up Today
  - Revenue Blockers
- Revenue Pipeline funnel:
  - Lead → Financial → Client → Auth → Active → Revenue
- Client Profitability table.
- Payor Performance section.
- Payment Plan Tracking.
- Billing & Claims health.
- Reauth Risk timeline.
- Payroll vs Revenue margin comparison.
- Full finance worklist table.

5. Add client side panel interactions
- Clicking a client/work item opens a side panel with tabs/sections:
  - Overview
  - Benefits
  - Payment Plan
  - Revenue
  - Payroll Impact
  - Auth Connection
  - Tasks
  - Timeline

6. Update routing and dashboard navigation
- Add a dedicated route, likely `/finance-dashboard`.
- Update the Dashboards sidebar item so “Finance Dashboard” opens `/finance-dashboard` instead of `/leadership-dashboard?dashboard=finance`.
- Update role-based home redirect so finance users start on `/finance-dashboard`.
- Update page title mapping so the top bar shows `Finance Dashboard`.

7. Keep existing app shell intact
- No rebuild from scratch.
- Leave CEO/Leadership and other department dashboards in place.
- The generic `DepartmentDashboard` can remain for HR/recruiting placeholders unless separately upgraded later.

8. Validate
- Run the development build to confirm TypeScript/Vite compile cleanly.
- Verify Finance Dashboard route, sidebar active state, filters, KPI drilldowns, and side panel behavior.