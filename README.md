# TableMint — SaaS digital menu builder

## Runtime and routes
React/TypeScript on Vinext, deployed as a Cloudflare Worker. Sites supplies ChatGPT sign-in, D1 and R2.

- `/` and `/landing`: public marketing page, interactive sample menu, $10 USD/month pricing and FAQ
- `/login` and `/signup`: account entry pages using dispatch-owned ChatGPT sign-in
- `/dashboard`: protected workspace, first-time restaurant setup, account and billing sections
- `/api/workspace`: authenticated restaurant data, save, publish and restore
- `/api/media`: authenticated optimized-image upload
- `/api/media/:id`: owner-only draft images, published fallback, DELETE deletes unused media
- `/menu/:restaurant/:menu`: published snapshot, no application sign-in requirement

## Implemented
Restaurant-owned persisted workspace, profile and branch list; multiple menus; categories and items with sortable keyboard/pointer ordering; item translations, dietary details, allergens, calories, availability, spicy level and featured flags; reusable themes; a Canva-style three-panel visual designer (Templates / Layout / Categories / Items / Text / Images / Shapes / Background / Branding / QR tabs, device preview for mobile/tablet/desktop, live right-panel properties, save-as-theme); draft saves with autosave, undo/redo, snapshot publishing and version restoration; validated image uploads to R2 with delete; QR PNG generation with custom color, download and print; page/QR visit counts; a premium landing page; a mobile-first public menu with sticky category navigation, search, dietary filter chips, bilingual English/Arabic with full RTL, and an item-detail bottom sheet. 11 named design presets populate the designer while preserving menu content.

## Outstanding phases
Live subscription checkout, payment webhooks, and server-enforced subscription access require a selected payment provider and credentials. The Billing section honestly shows that subscriptions are not yet open; it does not simulate payments. Account authentication uses ChatGPT, so TableMint does not store passwords or send password-reset emails.

Independent email/password restaurant signup; PostgreSQL/Prisma deployment; normalized per-item relational tables; branch-specific assignments and item-level popularity analytics; free-position text/image/shape canvas with snapping and alignment guides; logo-overlay and decorative QR styles; verified unique-visitor analytics; comprehensive security/load/browser tests.

## Data and security
The server derives restaurant ownership from platform-authenticated identity. Client restaurant IDs are never trusted. Prepared statements parameterize queries. Saves validate with Zod and compare-and-swap a write token to reject concurrent changes. Publishing snapshots isolate subsequent drafts. Mutations require matching Origin and use a basic database request limiter. Uploads check size, declared format and magic bytes; the UI resizes and encodes WebP. Runtime handlers never create tables.

## Local development
`npm run dev`, `npm run build`, `npm run db:generate`.
Run `node --test tests/accounts.test.cjs` for account isolation, onboarding persistence, anonymous access, origin protection, publish/draft isolation, and concurrent-save regression checks against a separate in-memory database. Local Sites sign-in uses a test account without an external password prompt; real sign-in/sign-out is owned by the hosted Sites dispatcher.
If Windows denies `os.userInfo`, a local compatibility preload is in `work/windows-userinfo.cjs`; it only supplies username metadata for the migration tool's temporary directory. Migrations in `drizzle/` are authoritative. Local D1 state is in `.wrangler/state`.

## Sample photo sources
- Burrata: Felix Ramirez / Unsplash, https://unsplash.com/photos/burrata-cheese-with-cherry-tomatoes-and-basil-Yw6fO5vewuw (Unsplash License).
- Risotto: Shameel mukkath / Pexels, https://www.pexels.com/photo/close-up-of-risotto-dish-on-table-5638527/ (Pexels License).
