# MenuCraft — first implementation

## Runtime and routes
React/TypeScript on Vinext, deployed as a Cloudflare Worker. Sites supplies ChatGPT sign-in, D1 and R2. This is a phased implementation, not the complete commercial specification.

- `/`: protected dashboard and workspace sections
- `/api/workspace`: authenticated restaurant data, save, publish and restore
- `/api/media`: authenticated optimized-image upload
- `/api/media/:id`: owner-only draft images; published images available to menu readers
- `/menu/:restaurant/:menu`: published snapshot, no application sign-in requirement

Site-level private access still restricts all visitors until the owner changes the deployment audience.

## Implemented
Restaurant-owned persisted workspace, profile and branch list; multiple menus; categories and items with sortable keyboard/pointer ordering; item translations, dietary details and availability; reusable appearance presets and saved themes; responsive shared renderer with search, dietary filtering and Arabic direction; draft saves, undo/redo, snapshot publishing and version restoration; validated image uploads to R2; QR PNG generation, color and download; basic page/QR visit counts.

## Outstanding phases
Independent email/password restaurant signup; PostgreSQL/Prisma deployment; normalized per-item relational tables; branch-specific assignments and analytics; free-position text/image/shape canvas with snapping and alignment guides; complete per-element styling and header/footer design; logo-overlay and decorative QR styles; deletion of unused media; item popularity analytics; comprehensive security/load/browser tests and dependency audit remediation. Current templates are appearance presets, not individually art-directed layouts. Analytics are raw requests, not unique people or verified physical scans.

## Data and security
The server derives restaurant ownership from platform-authenticated identity. Client restaurant IDs are never trusted. Prepared statements parameterize queries. Saves validate with Zod and compare-and-swap a write token to reject concurrent changes. Publishing snapshots isolate subsequent drafts. Mutations require matching Origin and use a basic database request limiter. Uploads check size, declared format and magic bytes; the UI resizes and encodes WebP. Runtime handlers never create tables.

## Local development
`npm run dev`, `npm run build`, `npm run db:generate`.
If Windows denies `os.userInfo`, a local compatibility preload is in `work/windows-userinfo.cjs`; it only supplies username metadata for the migration tool's temporary directory. Migrations in `drizzle/` are authoritative. Local D1 state is in `.wrangler/state`.

## Validation
TypeScript and production build passed before the final packaging pass. Local HTTP checks exercised saving, publishing, public rendering, stale revision rejection, anonymous workspace rejection and cross-origin write rejection. Browser interaction testing was not requested. The optional read-only WebMCP tool is feature-detected; no supported validation context was available.

## Sample photo sources
- Burrata: Felix Ramirez / Unsplash, https://unsplash.com/photos/burrata-cheese-with-cherry-tomatoes-and-basil-Yw6fO5vewuw (Unsplash License).
- Risotto: Shameel mukkath / Pexels, https://www.pexels.com/photo/close-up-of-risotto-dish-on-table-5638527/ (Pexels License).
