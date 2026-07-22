## Fix: Collapsed sidebar shows no icons on `/home`

### Root cause
`OSShell.tsx` renders a collapsed rail (`w-[78px]`) but the rail contents are barely visible / effectively missing:

1. When items are `disabled` (Coming Soon), the collapsed inert tile uses `text-foreground/45` on the light glass panel — icons blend into the background and read as empty whitespace.
2. `Company Home` + `Blossom AI` (or BCBA `Caseload Copilot`) render with their normal collapsed style, but they use `bg-card/80` on `os-glass-panel` — nearly invisible against the same near-white surface.
3. The `<nav>` scroller has no explicit min-width, so icons that do render appear cramped and are hard to spot at the current dpr.

Result: the collapsed sidebar looks like an empty white strip between the logo and the expand chevron, exactly matching the screenshot.

### Changes (frontend only, `src/pages/os/OSShell.tsx`)

1. **Collapsed rail item style** — rebuild the collapsed variant so every item is unmistakably a visible icon button:
   - Solid pill: `h-10 w-10 rounded-xl border border-border/70 bg-background shadow-sm`
   - Active: `bg-primary text-primary-foreground border-transparent`
   - Hover: `hover:bg-primary/10 hover:text-primary`
   - Icon: bump to `h-[18px] w-[18px]` with `strokeWidth={2.25}` so it reads clearly at small sizes.
2. **Disabled (Coming Soon) collapsed tile** — swap `text-foreground/45` for `text-muted-foreground` and keep the same solid pill background so the icon is still legible; keep the tooltip.
3. **Home / Blossom AI / Copilot pinned entries** — same pill treatment, always rendered at the top of the collapsed rail so users always see at least the Home + AI icons.
4. **Rail width** — increase collapsed width from `w-[78px]` to `w-[72px]` centered padding (`px-2`) so pills sit cleanly with breathing room; keep expanded width `w-[252px]`.
5. **Collapse toggle button** — give it the same pill style (`h-10 w-10 rounded-xl border`) so the bottom `>` control matches the rail and is obviously an icon button.
6. **Divider** — keep the short horizontal divider between the pinned pair and the section items so the rail has a visible rhythm.

### Verification
- Playwright: sign in, load `/home`, collapse sidebar, take element screenshot of the `<aside>` and confirm ≥ 4 visible icon pills between the logo and the toggle.
- Repeat with an expanded state to confirm nothing changed there.
- Confirm no regressions to mobile shell (mobile drawer path untouched).

No business logic, routing, permissions, or data changes. Purely visual repair of the collapsed rail.