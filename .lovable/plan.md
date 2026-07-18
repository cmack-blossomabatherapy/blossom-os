## Fix Auth page mobile experience

Rework `src/pages/Auth.tsx` so the sign-in card fits and reads correctly on phones, with a clear, always-visible primary button on both the Password and Email code tabs.

### Problems observed
- Card uses `p-8 sm:p-10` and `rounded-3xl` on a full-height container, so on small screens the form overflows and the primary CTA scrolls out of view after tapping **Email me a sign-in code**.
- The 6-slot `InputOTP` at default width pushes horizontal overflow on ~360px phones.
- The **Verify & sign in** button is `disabled:opacity-60` on top of a teal fill — before all 6 digits are entered, white text on faded teal reads as invisible/low-contrast on mobile.
- Bottom "© Blossom" absolute bar overlaps the footer/CTA area on short viewports.
- Mobile logo block adds 8 units of top padding that isn't needed on small screens.

### Changes (frontend only, `src/pages/Auth.tsx`)

1. **Container & card**
   - Main panel: `p-4 sm:p-10`, `items-start sm:items-center`, add `py-6` so the card can scroll naturally.
   - Card: `max-w-[460px]`, `rounded-2xl sm:rounded-3xl`, `p-5 sm:p-10`, remove heavy `shadow-2xl` on mobile (`shadow-lg sm:shadow-2xl`).
   - Remove the absolute bottom © bar on mobile (or move it inside the card footer) so it never overlaps the CTA.

2. **Header spacing**
   - `mb-6 sm:mb-8` on `<header>`, `text-3xl sm:text-4xl` on the H1, `mb-6` on mobile logo.

3. **Tabs**
   - `mb-4 sm:mb-6` on `TabsList`; keep 2-col grid.

4. **Inputs & buttons**
   - Inputs: keep `h-[52px]` (good tap target) but ensure `text-base` to prevent iOS zoom on focus.
   - Primary buttons (both tabs): keep teal fill, but replace `disabled:opacity-60` with `disabled:bg-[#2d8a9e]/70 disabled:text-white` so text stays fully white/legible; add `disabled:shadow-none disabled:cursor-not-allowed`.
   - Remove `hover:-translate-y-0.5` on mobile (`sm:hover:-translate-y-0.5`) so tap doesn't feel jumpy.

5. **OTP step (the reported bug)**
   - Wrap `<InputOTP>` in a `w-full overflow-x-auto` container and set slot sizing to fit small screens: pass `containerClassName="gap-1.5 sm:gap-2"` and add responsive slot sizes via a wrapper class (`[&_[data-slot=input-otp-slot]]:h-11 [&_[data-slot=input-otp-slot]]:w-10 sm:[&_[data-slot=input-otp-slot]]:h-12 sm:[&_[data-slot=input-otp-slot]]:w-12`).
   - Explicit slot text color: ensure OTP digits use `text-[#0c2340]` (already handled by input-otp defaults, but verify against `text-foreground` semantic token so it's dark on the white card).
   - Reduce info banner to `text-xs`, `px-3 py-2` on mobile.
   - Verify button: same disabled-color fix as above so it's always visible even when incomplete.
   - Footer row (Use different email / Resend code): stack `flex-col gap-2 sm:flex-row sm:items-center sm:justify-between` on small screens so both actions are tappable full width.

6. **Footer**
   - `mt-6 sm:mt-10`, `pt-5 sm:pt-8` on the "Team accounts…" footer to reclaim vertical space.

### Out of scope
- No auth logic changes (OTP sending/verifying, redirect behavior, remember-me).
- No changes to desktop brand panel.
- No design system token migration in this pass — keep existing teal/navy palette for parity with current brand.

### Verification
- Set preview to mobile (375×812), walk through: load `/auth` → Email code tab → enter email → **Email me a sign-in code** → confirm the 6-digit OTP fits without horizontal scroll and the **Verify & sign in** button is fully visible with legible white text in both disabled and enabled states.
- Repeat at 320px width to confirm the smallest supported phone.
- Confirm password tab still renders identically on desktop.
