
## What's actually there today

- **RBT / BCBA runtime modules** already sync per-user progress to Supabase via `academy_runtime_progress` (`src/lib/academy/runtimeStore.ts`). This part works.
- **Everything else** — department journeys, intake/scheduling/HR/etc. modules driven by `src/lib/training/academyData.ts` — persists progress **only in `localStorage`** (`PROGRESS_STORAGE_KEY`). It's per-browser, not per-user, and vanishes on sign-out / new device. That's the gap you're feeling.
- `academy_progress` in the DB is enrollment + UUID-module shaped, so it doesn't fit the string IDs (`"intake-foundations"`, etc.) that academyData modules use.

## What I'll build

1. **New table `user_training_progress`** — per-user × per-training-id row:
   - `user_id`, `training_id` (text), `status` (`not_started` | `in_progress` | `completed`), `progress_percent`, `started_at`, `completed_at`, timestamps.
   - Unique on `(user_id, training_id)`. RLS: each user reads/writes only their own rows.

2. **Cloud-first store** in `src/lib/training/academyData.ts`:
   - Replace the localStorage-only progress path with an async Supabase read/write, keeping localStorage as an offline cache and a one-time migration of any existing local progress into the cloud on first load.
   - Expose sync-friendly helpers: `useTrainingProgress(id)`, `useAllTrainingProgress()`, and keep `markTrainingComplete(id)` async so callers `await` it.

3. **Mark complete** action:
   - Wire the existing "Mark complete" button in `TrainingModuleRuntime` (academyData branch) and the department journey module cards to call the new async setter and show a toast on failure.

4. **"What's next" surface**:
   - Add a small `NextUpCard` on `TrainingHub` / `MyLearning` that lists the next 3 required-or-in-progress modules for the current user (in progress first, then required not-started), pulling from the same cloud store. Clicking navigates to the module.

5. **Validation**:
   - Vitest: new `src/test/userTrainingProgress.test.ts` that asserts (a) `academyData` setters call Supabase, (b) `NextUpCard` picks in-progress before not-started required, (c) the local→cloud migration runs once.
   - Manual: mark a module complete, refresh, sign out/in — progress persists and "What's next" updates.

## Out of scope

- Not touching RBT/BCBA runtime (`academy_runtime_progress`) — already cloud-synced.
- Not restructuring `academy_progress` / enrollments.
- No changes to menus, roles, or the academy content itself.

## Technical notes

- Table:
  ```sql
  CREATE TABLE public.user_training_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    training_id text NOT NULL,
    status text NOT NULL DEFAULT 'not_started',
    progress_percent int NOT NULL DEFAULT 0,
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, training_id)
  );
  ```
  Grants to `authenticated` + `service_role`, RLS `user_id = auth.uid()` for all ops, `updated_at` trigger.
- Cache key bumped to `blossom.training.progress.v2` to force clean migration.
- Anonymous users keep working via the existing localStorage fallback (no auth = no cloud write).
