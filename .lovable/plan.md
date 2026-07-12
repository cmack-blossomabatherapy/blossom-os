Plan to fix the HR/user/new-hire confusion without redesigning unrelated areas:

1. Make User Management the source of truth for people setup
- Treat `/user-management` as the canonical place to add any employee/user.
- Add support for `/user-management?add=1` so any “Add new hire / Add employee” button opens the same setup dialog directly.
- After creation, route to the employee profile so HR can finish access, role, login, device/NFC, training, and onboarding details in one place.

2. Fix the broken Add New Hire button behavior
- Change the New Hires page header button that currently sends users to Orientation Queue.
- Update HR Dashboard and HR Workspace “Add new hire” buttons to use the same `/user-management?add=1` flow.
- Keep “Orientation” buttons only for scheduling orientation, not employee/user creation.

3. Connect new employees to onboarding cleanly
- Update the add-employee flow so creating an employee also creates/ensures the matching onboarding record when appropriate.
- Keep the existing login provisioning attempt, but make the copy clearer: this creates the employee record and prepares system access; HR can complete access from the employee profile.
- Leave Viventium as a future source by keeping Viventium status fields as readiness signals, not a fake live import.

4. Simplify page responsibilities
- User Management: all employees/users, profiles, software access, roles, devices, badges.
- New Hires: progress/status view for pending-start employees and late-stage candidates.
- Orientation Queue: scheduling/attendance/follow-up only.
- Employee Support/Compliance/Training: downstream HR work only.

5. Make Orientation Queue available to Scheduling
- Add Orientation Queue to Scheduling role navigation as “Orientation Scheduling”.
- Add `/hr/orientation-queue` to Scheduling live-path allowlists.
- Keep HR access, because HR still owns onboarding, but make the page language more scheduling-focused.

6. Clean confusing navigation links
- Remove or retarget any “Add new hire” link that points to `/hr/new-hires` or `/hr/orientation-queue` when the intended action is actually user setup.
- Keep links to `/hr/new-hires` only when the label is “New hire pipeline”, “Review new hires”, or similar.
- On Orientation Queue, replace HR-only quick links with a smaller set focused on New Hire Pipeline, Scheduling Workspace, and Messages.

7. Add regression coverage
- Test that no visible “Add new hire” button routes to Orientation Queue.
- Test that User Management supports query-driven add dialog behavior.
- Test that Scheduling roles can see/access Orientation Queue.
- Test that employee creation code creates/ensures onboarding and keeps login setup tied to User Management.

8. Validation
- Run the focused HR/scheduling/user-management tests after implementation.
- Do not change unrelated modules, report logic, phone access, training journeys, or broad role menus beyond the scheduling/orientation alignment above.