Add a "Copy share link" action to the Blossom Referral CRM page so users can share the current view with all active filters, search, sort, and pagination preserved.

Why this works: the Referral CRM already persists module selection, filters, search, sort, and pagination in the URL query string (e.g. `?m=referrals&rs=Active&rpg=2`). Copying the current URL is therefore enough to recreate the exact same view.

Plan:
1. **Page-level action** in `src/pages/os/marketing/ReferralCRM.tsx`.
   - Add a small button in the `MktgPage` `actions` slot, next to the page title.
   - Label: "Copy share link" with a link/clipboard icon.
2. **Copy behavior**.
   - Use `navigator.clipboard.writeText(window.location.href)`.
   - Show a toast confirmation: "Share link copied to clipboard".
   - If the write fails, show a toast error and fall back to a visible text affordance (select the URL) so the user can still copy it.
3. **Scope**.
   - Implement only on the Referral CRM page for now, since that is the surface with the most URL-persisted state and where collaboration is most needed.
   - The same button can later be rolled out to other Marketing pages once they have full URL persistence.

No backend or database changes are required.