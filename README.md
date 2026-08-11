# Manisha Readymades

A full-stack wholesale garment storefront and internal admin portal, built as a single Next.js application.

- **Public storefront** — browse and filter the catalogue, read reviews, and enquire over WhatsApp. No cart, no login.
- **Admin dashboard** — full CRUD over products, categories, brands, discounts, banners and reviews, plus an internal order-management portal and analytics.

---

## Architecture

```
Browser
   │
   ▼
Next.js (Pages Router)          ← the only deployed service
   │
   ├── pages/            UI
   ├── pages/api/        REST API (server-side only)
   ├── services/         business logic
   ├── models/           Mongoose schemas
   └── lib/              db, auth, http, cloudinary
   │
   ▼
MongoDB Atlas  +  Cloudinary
```

There is **no separate backend**. The browser never connects to MongoDB; every read and write goes through `/api/*`.

### Layering

Route handlers stay thin. Each one validates input, delegates to a service, and returns the shared envelope:

| Layer | Responsibility |
| --- | --- |
| `pages/api/*` | HTTP method routing, auth, validation, status codes |
| `services/*` | Business rules and every database query |
| `models/*` | Schemas, indexes, hooks, invariants |
| `validation/*` | Yup schemas shared by **both** the Formik form and the API route |

Because client and server validate against the same schema, a bypassed form cannot write invalid data.

---

## Tech stack

Next.js 14 (Pages Router) · TypeScript (strict) · React 18 · MongoDB Atlas · Mongoose · MUI v6 · Formik + Yup · Cloudinary · SWR · react-toastify · ESLint + Prettier

---

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure the environment

Copy `.env.example` to `.env.local` and fill in every value:

```bash
cp .env.example .env.local
```

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string. **Server-side only.** |
| `JWT_SECRET` | Signs admin bearer tokens. Use a long random string. |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Image uploads. The secret never reaches the browser. |
| `CLOUDINARY_UPLOAD_FOLDER` | Root folder for uploaded assets. |
| `NEXT_PUBLIC_SITE_URL` | Used in WhatsApp enquiry links. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Digits only, with country code, e.g. `919999999999`. |
| `NEXT_PUBLIC_CONTACT_PHONE` | Displayed in the header and footer. |
| `NEXT_PUBLIC_GOOGLE_MAPS_URL` | Optional map link. |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> Never prefix a secret with `NEXT_PUBLIC_` — that inlines it into the browser bundle.

### 3. Create the first admin

There is no public sign-up, so the first owner account is created from the command line:

```bash
npm run create-admin -- --name "Owner" --email owner@example.com --password "Secret123"
```

Re-running with the same email resets that account's password — this is also the recovery path if the password is lost.

### 4. Run

```bash
npm run dev
```

- Storefront: <http://localhost:3000>
- Admin: <http://localhost:3000/admin>

### Other commands

```bash
npm run build       # production build
npm run start       # serve the production build
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run format      # Prettier
```

---

## Data model

| Collection | Purpose | Notable rules |
| --- | --- | --- |
| `products` | Catalogue | `sku` is sequential `SKL00001`, assigned atomically and immutable |
| `categories` | Nested taxonomy | Unique name ignoring case; max one level of nesting |
| `brands` | Optional labels | Unique name ignoring case |
| `discounts` | Price reductions | Applied at read time; never written onto products |
| `banners` | Storefront promos | Visible only when active **and** within their date window |
| `reviews` | Customer feedback | Text only; held `pending` until an admin approves |
| `orders` | Internal orders | Sequential `ORD00001`; never exposed publicly |
| `admins` | Dashboard users | Roles: `owner`, `staff`; `passwordHash` is `select: false` |
| `events` | Analytics | Product views and WhatsApp clicks; TTL-expired after 180 days |
| `counters` | Sequences | Atomic `$inc` backing SKU and order numbering |

### Why SKUs cannot collide

Counting documents to derive the next number races under concurrency. A single-document `findOneAndUpdate` with `$inc` and `upsert` is atomic in MongoDB, so two simultaneous creates always receive different numbers.

### Why discounts are not stored on products

`Discount` documents are resolved when products are read (`services/pricing.service`). Turning a discount on or off, or letting it expire, takes effect immediately with no bulk update and no risk of stale prices. When several discounts match a product, the one producing the lowest price wins.

---

## API

All responses use one envelope:

```jsonc
// success
{ "success": true, "data": { }, "meta": { } }

// failure
{ "success": false, "error": { "message": "Product not found", "details": { "price": "Price is required" } } }
```

Status codes: `200` OK · `201` created · `202` accepted · `400` invalid · `401` unauthenticated · `403` forbidden · `404` missing · `405` method not allowed · `409` conflict · `500` server error.

| Method | Endpoint | Auth |
| --- | --- | --- |
| `GET` `POST` | `/api/products` | read public, write admin |
| `GET` `PUT` `DELETE` | `/api/products/:id` | read public, write admin |
| `GET` `POST` | `/api/products/:id/reviews` | public |
| `GET` `POST` | `/api/categories`, `/api/brands` | read public, write admin |
| `GET` `PUT` `DELETE` | `/api/categories/:id`, `/api/brands/:id` | write admin |
| `GET` `POST` `PUT` `DELETE` | `/api/discounts`, `/api/discounts/:id` | admin |
| `GET` `POST` `PUT` `DELETE` | `/api/banners`, `/api/banners/:id` | read public, write admin |
| `GET` | `/api/reviews` | admin |
| `PATCH` `DELETE` | `/api/reviews/:id` | admin |
| `GET` `POST` | `/api/orders` | admin |
| `GET` `PUT` `DELETE` | `/api/orders/:id` | admin (delete: owner) |
| `PATCH` | `/api/orders/:id/status` | admin |
| `GET` | `/api/orders/stats` | admin |
| `GET` | `/api/analytics/summary?days=7\|30\|90` | admin |
| `POST` | `/api/events` | public |
| `POST` | `/api/uploads` | admin |
| `POST` | `/api/auth/login` | public |
| `GET` | `/api/auth/me` | admin |
| `GET` `POST` | `/api/admins` | read admin, write owner |
| `GET` `PUT` `DELETE` | `/api/admins/:id` | owner |

### Authentication

`POST /api/auth/login` returns a JWT. The client stores it and sends it as `Authorization: Bearer <token>` on every admin request. Tokens are stateless and expire after 7 days; signing out discards the token client-side.

> **Trade-off:** a token in `localStorage` is readable by JavaScript, so an XSS bug could exfiltrate it — an `httpOnly` cookie would not have that exposure. It also means admin pages are guarded in the browser rather than in `getServerSideProps`. That guard protects the *interface* only; every endpoint verifies the token independently, so bypassing the UI reveals nothing.

### Image uploads

`POST /api/uploads` returns a short-lived Cloudinary signature. The browser uploads the file **directly** to Cloudinary, so large images never pass through the serverless function's body limit, and the API secret never leaves the server.

---

## WhatsApp enquiry flows

There is no cart or checkout — every conversion is a WhatsApp message. Neither
entry point opens WhatsApp directly, because a message with no details costs the
owner a round trip of questions before they can quote.

| Action | What happens |
| --- | --- |
| **Enquire on WhatsApp** (product card or detail page) | Opens a dialog to pick size, colour and quantity, validated against *that product's* stocked variants, then opens WhatsApp with the SKU, selection and product URL. |
| **Request quote** (home page, custom printing) | Opens a dialog collecting service, contact details, quantity, sizes, design brief and optional deadline, then opens WhatsApp with the full brief. |

`NEXT_PUBLIC_WHATSAPP_NUMBER` must include the country code. `toWhatsAppNumber`
prefixes `91` to a bare 10-digit number as a safeguard, since `wa.me` fails
silently without one.

The pop-up is opened synchronously inside the submit handler — an intervening
`await` breaks the user-gesture chain and browsers then block it. If it is
blocked anyway, the visitor gets a toast explaining why.

## Spacing contract

Four values, defined once in `theme/spacing.ts` and never hard-coded elsewhere:

| Context | Mobile | Desktop |
| --- | --- | --- |
| Outer (page gutters, section padding) | 16px | 24px |
| Inner (card padding, control gaps) | 8px | 16px |

MUI's spacing unit is 8px, so these are `OUTER_SPACING = { xs: 2, md: 3 }` and `INNER_SPACING = { xs: 1, md: 2 }`. `PageContainer`, `Section`, `FormPanel` and the theme's component defaults own this, so pages never write their own padding.

## Forms

Every form uses Formik with a Yup schema from `validation/`, rendered through the field components in `components/form/`. This gives a consistent traditional look — outlined inputs, bold labels, helper-text errors, a sticky action bar — and identical error behaviour everywhere. Toasts appear **top-left**, emitted only through `lib/toast`.

---

## Deployment (Vercel)

1. Push the repository to GitHub and import it in Vercel. The framework is detected automatically; no build configuration is needed.
2. Add every variable from `.env.example` under **Settings → Environment Variables** (Production and Preview).
3. In MongoDB Atlas, open **Network Access** and allow `0.0.0.0/0`. Vercel's serverless functions do not have static IPs.
4. Set `NEXT_PUBLIC_SITE_URL` to the deployed domain so WhatsApp enquiry links point at the live site.
5. Deploy, then run `npm run create-admin` locally against the production `MONGODB_URI` to create the first owner.

No separate backend is deployed.

### Connection caching

Serverless invocations reuse warm Node processes. `lib/mongodb.ts` caches the Mongoose connection and its in-flight promise on `globalThis`, so a burst of requests opens one pool rather than exhausting the Atlas connection limit.

---

## Security notes

- Credentials are server-side only; nothing secret is prefixed `NEXT_PUBLIC_`.
- Every route parameter is validated as an ObjectId before it reaches a query — an invalid id returns 400, not a driver error.
- Client-supplied references (category, brand, assignee) are verified to exist before a write.
- Raw MongoDB errors are never returned. Duplicate keys become 409, cast errors 400, everything else an opaque 500 with the detail logged server-side.
- Reviews are moderated before publication.
- Deleting a record also deletes its Cloudinary assets.
- Admin pages send `noindex, nofollow`.
