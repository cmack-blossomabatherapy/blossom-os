**Answer:** partially. The referral contacts list does open a no-name contact by email, and the referrals spreadsheet cleanup appears present. However, the referrals table still does not open the source referral partner by email when the source contact has no name, and I need to verify the Add Lead backend error path before saying it is fixed.

**Plan**
1. **Add Lead failure**
   - Inspect the exact lead/company save path and recent backend errors for the failure shown in the attachment.
   - Fix only the schema or insert payload mismatch that is blocking lead creation.
   - Keep optional side effects non-blocking so the lead saves first.

2. **Referral partner open-by-email**
   - Update `/marketing/referral-crm` so any referral source contact opens the partner drawer using the contact ID even when the visible label is only an email.
   - Apply this consistently in Contacts, Referrals, Patient Pipeline, Search, Tasks, and Activity surfaces where referral contacts appear.

3. **Referral spreadsheet polish check**
   - Preserve the existing cleaner table styling already present: fixed row height, table-fixed widths, status pills, and dedicated actions.
   - Patch any remaining uneven cells/tags if found during verification.

4. **Validation**
   - Run targeted checks for Add Lead hardening and Referral CRM rendering.
   - Run TypeScript validation.

**Files likely involved**
- `src/pages/os/marketing/ReferralCRM.tsx`
- `src/contexts/LeadsContext.tsx`
- A small database migration if the Add Lead error is caused by a backend column/default mismatch.