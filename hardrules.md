SUPABASE / BACKEND SAFETY RULES
- Supabase is the live backend (PostgreSQL, RLS, triggers, RPC functions).
  Treat the data contract as frozen.
- Do NOT rename, remove, or reshape any field, table, column, view, RPC name,
  or RPC parameter that components read or send. If a new design needs
  different data shapes, adapt in the component (a small mapping function),
  never in the service layer or database.
- Do NOT change or add migrations, and do not suggest schema changes.
- Do NOT change how orders, shifts, voids, or riders are written to the DB.
  Only the presentation of those flows may change.
- Every screen that depends on Supabase data must have: a skeleton loading
  state, an empty state, and a friendly error state with a retry button.
- Keep the offline queue and sync behavior untouched. Only restyle the
  online/offline indicator and the "order queued" toast.
- For Phase 7 (demo readiness): use the existing src/data/mockData.js only.
  Do not rewrite the data layer. Optionally add a clearly separated
  "demo seed" toggle in brand.js that never runs against a production DB
  unless I turn it on.
- Never hardcode or log Supabase keys. Read them only from import.meta.env.
- After each phase, list every file that imports from src/lib/supabase.js or
  src/services/posService.js and confirm none of those files were modified.