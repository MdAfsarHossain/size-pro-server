# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`size-pro-server` (aka "AJ-Propl server") is a Node.js + TypeScript + Express REST API backend. Its core business is: a seller uploads product photos, the server forwards them to an external AI service (`AI_API`) which generates listing content (title, description, sizing/dimensions, background-removed images, virtual try-on images, mannequin images, model images, size diagrams, SEO tags, etc.), and the server stores/serves that generated data so sellers can review, export to CSV, or save to Google Drive / S3.

Data is stored in **MongoDB via Prisma** (not a relational DB despite what the stale README says).

## Commands

```sh
npm run dev         # start dev server (ts-node-dev, auto-restart) - src/server.ts
npm run build        # tsc compile to ./dist
npm start            # run compiled server: node ./dist/server.js
npm run prisma:gen   # regenerate Prisma client after editing prisma/schema.prisma
```

There is no real lint or test setup — `npm test` just runs `npm run dev`, and there are no test files in the repo. Don't assume a test runner exists.

After changing `prisma/schema.prisma`, always run `npm run prisma:gen` (or restart `dev`, which needs a regenerated client) before relying on new fields/models in code.

## Architecture

**Modular MVC-ish structure**, one folder per domain under `src/app/modules/<name>/`, each typically containing `*.route.ts`, `*.controller.ts`, `*.service.ts`, and sometimes `*.validation.ts` / `*.interface.ts`. Controllers are thin — they call `catchAsync`-wrapped handlers, delegate to the service, and use `sendResponse`. All business logic and Prisma calls live in the service files.

Request flow: `src/server.ts` → `src/app.ts` (Express app, CORS, body parsing, `/uploads` static, morgan logging) → `src/app/routes/index.ts` (mounts every module under `/api/v1/<module-path>`) → module route → middleware chain (`auth`/`validateRequest`/multer upload/`parseBodyData`) → controller → service → `globalErrorHandler`.

### Modules (mounted paths under `/api/v1`)
- `auth` (`/auth`) — register, OTP email verification, login (user + separate admin login), forgot/reset/change password, admin creation/promotion.
- `admin` (`/admin`) — SUPERADMIN-only: manage admins, social media links, recent activity, dashboard overview.
- `users` (`/users`) — self-service profile get/update (with S3 image upload).
- `document` (`/documents`) — the core AI-generation flow. **Two parallel paths exist**: `createDocument` (`POST /`) calls `AI_API /generate` **synchronously** and persists in one shot; `uploadProductToAI` (`POST /upload-product-to-ai`) is the newer **async** path — it calls `/generate`, stores a `ProductStatus` (PENDING) row holding `productId` + the pre-computed counter deltas, and the client then polls `getProduct` (`GET /product/:id`), which GETs `AI_API/{productId}` and, on `"completed"`, does the persistence the sync path does inline. Prefer the async path for new work. Then: list/get/update/delete → CSV export.
- `fileSave` (`/file-save`) — save generated results to Google Drive and/or S3, list a user's saved files.
- `feature` (`/feature`) — SUPERADMIN-managed reference/config data used to build the upload form (sizes, categories, vendors, fabrics, genders, colors, conditions, tags — each in English + Polish).
- `csv` (`/csv`) — standalone CSV upload/parsing utilities and a separate "product vendor" list (brand names) built from CSV uploads.
- `timeZone` (`/time-zone`) — admin-configurable **app-wide** timezone (`AppSetting.timezone`, singleton row) used to render dates consistently across the app; plus `/time-zone/list` of IANA timezones.
- `modelPosition` (`/model-position`) — singleton list of model pose/position strings, admin-managed.
- `shopify` (`/shopify`) — **fully implemented and mounted** (not stubs — that was true only of an early revision). Takes a Shopify-format product CSV and creates the products in a live Shopify store via the **Admin GraphQL API** (`productSet`, API version `2024-10`), then records every attempt in `ShopifyUploadHistory`. See "The Shopify upload pipeline" below. `aiGeneratedData.ts` is a fully commented-out sample AI response kept for reference; it is imported nowhere.

### Data model (`prisma/schema.prisma`, MongoDB)
- `User` — role (`SUPERADMIN`/`ADMIN`/`USER`), status (`PENDING`/`ACTIVE`/`INACTIVE`/`BLOCKED`/`SUSPENDED`/...), running counters (`totalCreatedProducts`, `totalGeneratedProducts`, `totalSavedTimes`), owns `documents`/`generatedImages`/`savedFiles`.
- `OTP` — unique on `(userId, otpCode)`, has `expiry`; used for both email verification and password reset (reused across flows via `OTPFn`).
- `Document` — wraps a raw `aiGenerated` JSON blob per AI generation call (the older/simpler record type).
- `GeneratedImage` — the JSON blob (`imageDetails`) actually queried by most of the app (list/get/update/delete/CSV all operate on `GeneratedImage`, not `Document`, despite the module being named "document"). Soft-delete via `isDeleted`.
- `SavedFile` — a file (CSV, drive export, etc.) a user saved, with `fileUrl` + `title`.
- `Feature` — big bag of `String[]` reference lists (bilingual EN/PL) plus a freeform `customFields` JSON, singleton-ish (only "last/first" record is fetched by `getFastFeature`).
- `ProductVendor` — singleton `brands_name: String[]`, appended to (deduped case-insensitively) as CSVs are uploaded.
- `ProductStatus` — tracks one async AI generation job: `productId` (the AI service's id), `status` (`PENDING`/`COMPLETED`), the raw AI payload in `customFields`, and the counter deltas (`product`, `generatedImages`, `totalSavedTimes`) to apply to the `User` once it completes. Written by `uploadProductToAI`, consumed by `getProduct`.
- `ShopifyUploadHistory` — one row per Shopify upload *attempt* (success **or** failure), with `handle`, `title`, `success`, `shopifyProductId`, `adminUrl`, `errorMessage`, and the full `IProductResult` in `result` (which metafields succeeded / were dropped / were skipped, and why). This is the audit trail — a failed upload is diagnosable from it alone, without re-running.
- Neither `ProductStatus` nor `ShopifyUploadHistory` declares a Prisma **relation** to `User` (bare `ObjectId` only) — so no cascade delete and no `include`. `Document`/`GeneratedImage`/`SavedFile` do.
- `TimeZone`, `AppSetting`, `ModelPosition` — small admin-config singletons/lookup tables.
- Commented-out sections in the schema (e.g. `RecentActivity`, several `Document` fields) reflect abandoned/future ideas — don't assume they exist.

### The Shopify upload pipeline (`shopify.service.ts`)

Entry: `createProductsFromCsv(file, generatedImageId)` (single) / `uploadMultipleProductsCsv(files, generatedImageIds)` (N files, paired **positionally**, processed **sequentially** — deliberately not `Promise.all`, to avoid multiplying Shopify's per-shop rate limit). Steps:

1. Parse CSV with the module's own quote/comma/newline-aware parser, then **group rows by `URL handle`** — in Shopify's format only a product's first row carries the shared fields; later rows add variants and/or images.
2. Resolve the primary location via **REST** `/shop.json` — deliberate: the GraphQL `locations` query needs a `read_locations` scope this app lacks. Everything else in the module is GraphQL.
3. Build `ProductSetInput` (product fields, options, variants, files sorted by `Image position`). Variant weight must always send `value` **and** `unit` together or Shopify rejects it.
4. Resolve the free-text product category to a **taxonomy category GID** (cached per file). Required: several `custom.*` metafield definitions are category-restricted and fail with "Owner subtype does not match" when `category` is unset.
5. Build metafields, split two ways — this is the subtlest part of the module:
   - **non-`shopify` namespaces** (`custom.*`, `mm-google-shopping.condition`): fetch the store's real `metafieldDefinitions` **types** via GraphQL (REST 404s for these) so the sent `type` matches the stored definition instead of being guessed from whether the value contains a `;`.
   - **`shopify` namespace** (Color, Fabric, target-gender, …): these are `list.metaobject_reference`. Resolution is 3 GraphQL hops — `validations` → `metaobject_definition_id` → `metaobjectDefinition.type` → `metaobjects(type).field("label")` — matching CSV values to existing metaobject GIDs case-insensitively. This store's labels are a **mix of Polish and English**; an unmatched value is reported in `skipped` (never guessed) and does **not** block its sibling values in the same field.
6. Create via `productSet`, which is **atomic** — one bad metafield kills the whole product. Shopify reports every failing metafield's array index in one pass, so `createProductViaGraphQL` strips exactly those entries and retries (max 3 attempts), recording each as a `droppedMetafield` with its reason; a non-metafield error aborts immediately. Preserve this behaviour when editing — the naive version loses an entire product over one bad field.
7. Publish to Online Store if the CSV says so. **Currently always fails**: `read_publications`/`write_publications` are not granted to the app. The code is written so it starts working with **no code change** once those scopes are added — don't "fix" it by removing it.
8. Record `ShopifyUploadHistory` and, on success, flip `GeneratedImage.isShopifyUploaded = true` (this feeds the flag in the document list). Wrapped so a persistence failure never breaks the upload response.

Note the CSV the Shopify module consumes is the **wide Shopify export format** — structurally unrelated to the vertical two-column `Property,Value` CSV that `document.service.ts` `generateCSV` emits. Those CSVs come from elsewhere (frontend / `/file-save`).

### Cross-cutting conventions
- **Errors**: throw `ApiError(statusCode, message)` (`src/app/errors/ApiError.ts`) from services; never handle errors manually in controllers — wrap controller handlers in `catchAsync` and let `globalErrorHandler` (`src/app/errors/globalErrorHandler.ts`) format the response. It has dedicated branches for Zod errors, Prisma validation/known-request/init/panic/unknown errors, plus generic JS error types.
- **Responses**: always send via `sendResponse(res, { statusCode, message, data, meta })` (`src/app/helpers/sendResponse.ts`) for a consistent `{ success, statusCode, message, meta, data }` envelope.
- **Auth**: `auth(...roles)` middleware (`src/app/middlewares/auth.ts`) verifies the JWT access token, loads the `User` from Prisma, checks `status`, and (if roles passed) enforces role membership. Call `auth()` with no args for "any authenticated user." `checkOTP` is a separate middleware using the reset-password JWT secret, used only on `/auth/reset-password`. `optionalAuth` allows anonymous access but attaches `req.user` if a valid token is present.
- **Validation**: Zod schemas per module (`*.validation.ts`) applied via `validateRequest(schema)` middleware, which validates `{ body: req.body }`.
- **File uploads**: all multer configs are centralized in `src/app/middlewares/multerFileUpload.ts` as named exports on the `fileUploader` object (e.g. `fileUploader.documentImages`, `fileUploader.driveImage`, `fileUploader.csvFile`) — add new upload shapes there rather than creating ad hoc multer instances in modules. Disk-storage uploads land in `public/uploads` and get forwarded to S3/Drive then removed (`removeFile`); a few flows (Drive save, CSV-to-S3) use `multer.memoryStorage()` instead so the buffer is available directly.
- **multipart + JSON in one request**: when a route accepts both files and a JSON payload (e.g. document creation), the JSON is sent as a single `bodyData` form field and unpacked by the `parseBodyData` middleware (runs *after* multer, *before* the controller) — don't expect `req.body` fields to be parsed until this middleware has run.
- **Timezone-aware display**: dates are stored as UTC `DateTime` in Mongo but rendered using the admin-configured `AppSetting.timezone` (default `Europe/Warsaw`, singleton row managed by the `timeZone` module). Any new list/detail endpoint that shows a created/saved date should fetch `prisma.appSetting.findFirst()` and pass the timezone into `formatDateAndTime(date, timezone)` (`src/app/utils/formatDate.ts`) rather than formatting in server-local time.
- **Mongo full-text-ish search on JSON fields**: Prisma can't filter on nested JSON fields with `contains`, so searches over `GeneratedImage.imageDetails.*` use `prisma.<model>.findRaw` / `aggregateRaw` with raw Mongo `$regex`/`$match` pipelines instead of the normal Prisma query API (see `document.service.ts` `myAllDocuments`). Follow this pattern for any new search-by-JSON-field feature.
- **Redis**: `src/config/redis.ts` creates a Redis client with an in-memory fallback if Redis is unreachable (so local dev works without Redis running). Most Redis-based response caching in `document.service.ts` is currently commented out — treat it as a known-but-disabled pattern, not active behavior.
- **Storage backends in play simultaneously**: S3-compatible storage (AWS S3 or DigitalOcean Spaces, via `S3Client`/`S3Uploader`, endpoint-sensitive URL building) and Google Drive (via `googleapis`, both service-account and OAuth2/refresh-token auth flows exist in different files — `getAuthClientForOauth` in `utils/googleAuth.ts` is the one actually used in `fileSave.service.ts`; the service-account variant in the same file is legacy). Know which one a given code path uses before "fixing" credentials.
- **Config**: all env vars are centralized in `src/config/index.ts` (loaded via `dotenv`); add new env vars there rather than reading `process.env` directly in modules. See `.env.example` for the full variable list (JWT secrets x3 — access/refresh/reset-password —, S3, email/SMTP, Google Drive x2 auth styles, Redis, `AI_API` base URL, and `SHOPIFY_STORE_URL` / `SHOPIFY_ADMIN_API_TOKEN` → `config.shopify`). Known drift: `document.service.ts` reads `process.env.AI_API` **directly** rather than via `config`, unlike every other env var — follow `config` for new code.
- Many service files contain large blocks of commented-out prior implementations (especially `document.service.ts`, `fileSave.service.ts` Google Drive auth). This is intentional history/reference kept in-file, not dead code to immediately delete — check with the user before removing large commented sections.
- A super admin account is auto-seeded on server start (`src/app/seedSuperAdmin`) from `SUPER_ADMIN_PASSWORD` env var if no `SUPERADMIN` user exists yet.
