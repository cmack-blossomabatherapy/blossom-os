# Mapping Integration Discovery Plan

Before choosing Mapbox vs Mapsly for the different Blossom OS teams, we need to answer four discovery questions. Each answer will drive the recommendation and integration scope.

## Goal

Recommend a single mapping approach for Business Development, BCBA/RBT mileage tracking, and Recruiting — deciding whether to use Mapsly for everything, Mapbox for everything, or a hybrid.

## Discovery Questions

1. **Mapsly access**
   - Do you already have a Mapsly account/license, or are you evaluating it for this project?
   - _Why this matters_: Determines whether Mapsly is a real option now or requires procurement/sales time.

2. **Recruiting map needs**
   - What does recruiting need from the map that Mapsly might not cover? (e.g., custom map tiles, geofencing, bulk route optimization, drive-time searches, candidate proximity filtering)
   - _Why this matters_: Recruiting requirements are the most likely reason to keep Mapbox. We need to know if Mapsly can cover them before consolidating.

3. **Mileage tracking**
   - For BCBA/RBT mileage tracking, what is required?
     - **Automated trip capture** — Track actual driven routes and mileage automatically.
     - **Distance calculation** — Calculate miles between client and staff locations for payroll/reimbursement.
     - **Both** — Need both route tracking and distance calculation.
   - _Why this matters_: Mapsly is strong at trip/route tracking; Mapbox is better suited for pure distance/geometry calculations. This answer affects the integration design.

4. **Business Development use case**
   - For Business Development, what is the primary map use case?
     - **Territory visualization** — See territories, regions, and state boundaries.
     - **Lead/prospect mapping** — Plot potential clients and referral sources on a map.
     - **Route planning** — Plan efficient visit routes for BD reps.
     - **All of the above** — Need territory, lead mapping, and routing.
   - _Why this matters_: BD is the most CRM-like use case, which is Mapsly's core strength. Confirming the actual workflow tells us whether Mapsly is a natural fit.

## How the answers will be used

- If Mapsly is already available and BD/recruiting needs are standard CRM mapping + territory/route work, recommend **Mapsly for everything**.
- If recruiting needs custom Mapbox features (custom tiles, heavy geofencing, advanced proximity search), recommend **Mapbox for recruiting, Mapsly for BD and mileage**.
- If only distance calculation is needed for BCBA/RBT mileage, a lightweight backend calculation may be simpler than either map integration.

Once you answer these four questions, I will produce a concrete recommendation and implementation plan.