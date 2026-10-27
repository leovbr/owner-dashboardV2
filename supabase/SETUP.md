# Supabase integration setup (owner-dashboardV2)

This branch contains a first-pass Supabase foundation. It is not production-ready until the steps below and the remaining client migration are completed.

## Project settings
- Project ref: `jvaxxicoembvdykvdcxy`
- Project URL: `https://jvaxxicoembvdykvdcxy.supabase.co`
- Frontend uses only the public publishable key in `supabase-client.js`.
- Never add `service_role` / secret keys to browser code or GitHub.

## Apply the initial schema
1. Open Supabase Dashboard -> SQL Editor.
2. Review `supabase/migrations/202610270001_initial_schema.sql`.
3. Run it in the intended new project.
4. Verify tables and RLS are enabled before connecting any production data.

This migration creates the first version of stores, memberships, profiles, products, sales, sale items, expenses, stock items/movements, recipes, and staff queue. Review the policies with test users before production use.

## Create staff accounts
The Edge Function at `supabase/functions/create-staff-account/index.ts` is intended to be deployed as `create-staff-account`.

1. Deploy the function using Supabase CLI or the dashboard's supported deployment workflow.
2. Keep JWT verification enabled.
3. It expects the signed-in caller to be an active `owner` in `store_members` for the supplied `store_id`.
4. It creates a Supabase Auth phone/password account and adds the membership. The PIN is handled by Supabase Auth; it is not written to an application table.
5. Staff PIN must be 6–8 digits, and phone must use E.164 format (for Indonesia, e.g. `+6281234567890`).

The function does not yet wire into the existing staff UI. Do not use it until the owner login and first-store bootstrap flow have been implemented and tested.

## Important current limitations
- Existing `auth.js`, `app.js`, `team-system.js`, and `staff-accounts.js` still use localStorage.
- The existing Owner signup/login has not yet been migrated to Supabase Auth.
- Employee login UI has not yet been migrated to Supabase Auth (future flow: phone + PIN through Supabase Auth, then verify name and store code against membership/store records).
- Production Cloudflare is not updated merely because a branch or PR exists.
- No migration has been run against the live Supabase project by this repository change.
- Photo upload and complete role-scoped writes are not yet wired to the UI.
