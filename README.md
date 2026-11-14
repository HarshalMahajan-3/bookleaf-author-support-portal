# BookLeaf Author Support & Communication Portal

A full-stack technical-assignment implementation for BookLeaf Publishing. The project uses **React + Vite + Tailwind CSS** for the frontend and **Node.js + Express** for the REST API. It includes an author-facing workspace and an admin-facing operations portal, seeded with the supplied 10-author / 18-book dataset.

> Assignment confidentiality: keep this repository private. Do not publish the assignment or this solution to a public repository.

## What is implemented

### Author portal
- Email/password sign-in. An author can only access the books and tickets belonging to their account.
- Overview cards for book count, copies sold, earned royalties and pending royalties.
- Book catalogue with title, ISBN, genre, publication date, status, MRP, copies sold, total royalty earned, paid royalty and pending royalty.
- Support request form with a book selector or `General / Account Level`, subject, description and attachment-name preview. Real file upload is intentionally not enabled.
- Ticket history with status filters, search, original query and support messages. Ticket data refreshes every five seconds while the relevant page is open.

### Admin portal
- Operations overview with queue health, urgent tickets, author/book counts and combined pending royalty value.
- Ticket inbox with status, category, priority, created-date and text filters. The API returns tickets ordered by priority and age.
- AI-assisted category and priority classification at ticket creation. Admins can override either field.
- AI-drafted response generated from the ticket plus the relevant book/author summary and the BookLeaf knowledge base. The draft is editable and is never sent automatically.
- Status management, assignment, public replies and internal notes. Internal notes are excluded from author API responses.
- Author directory and all-book catalogue.

### AI and graceful fallback
- Optional OpenAI Chat Completions integration. The default model is `gpt-4o-mini` and can be changed with `OPENAI_MODEL`.
- API keys are read only by the server from `OPENAI_API_KEY`; the key is never sent to the browser.
- Classification sends only the ticket subject and description, not the entire knowledge base or ticket history.
- Draft generation sends the knowledge base and a compact context object for one ticket, including only relevant book fields. It does not send the full dataset or conversation history.
- Each model call has a 15-second timeout and validates the returned category/priority or draft before accepting it.
- If the key is missing, the provider errors, rate-limits or returns unusable content, the ticket is still created and a local rules-based classification/draft is used. Admins can always edit and send a manual response.
- The rules-based fallback is designed for the provided assignment categories and policies. It is not a replacement for human review.

## Stack and architecture

```text
Browser
  React 18 + React Router + Tailwind CSS + Axios
       |
       | REST / JSON, JWT Bearer token
       v
Express API (Node.js)
  Auth middleware / role checks / Zod validation
  Ticket routes / BookLeaf AI service
       |
       +-- sample-data.json (provided author + book records)
       +-- tickets.json (local JSON persistence)
       +-- OpenAI API (optional, server-side only)
```

The API uses a small JSON-backed repository so the assignment can run without a database service or extra credentials. Ticket mutations are written to `server/data/tickets.json` using a temporary file and rename. The provided sample dataset is treated as read-only source data. For production, I would move authors, books, tickets, notes and messages to PostgreSQL, add migrations and transactions, and use database-level ownership constraints.

The frontend uses short-interval polling (5 seconds for author tickets, 7 seconds for the admin inbox) instead of a WebSocket service. This keeps the local setup simple while making admin responses appear without a manual page refresh.

## Run locally

### Requirements
- Node.js 20 or newer (Node 18.17+ should also work with the APIs used here)
- npm

### 1. Install dependencies

From the project root:

```bash
npm install
```

### 2. Configure the API

Copy the example environment file:

```bash
cp server/.env.example server/.env
```

Set a long random `JWT_SECRET`. `OPENAI_API_KEY` is optional. Without it, the rules-based AI fallback is used.

Example `server/.env`:

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-secret
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

### 3. Start frontend and backend

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API health: http://localhost:5000/api/health

Vite proxies `/api` requests to the Express server.

### 4. Build for production-style local serving

```bash
npm run build
npm start
```

After building, Express serves `client/dist` as well as the API from port 5000. Set `CLIENT_ORIGIN` to the deployed origin if the frontend is hosted separately.

## Demo credentials

The sample dataset does not include passwords, so the application provisions development-only demo passwords at server startup.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@bookleaf.com` | `admin123` |
| Author | `priya.sharma@email.com` | `author123` |
| Author | `rohit.kapoor@email.com` | `author123` |
| Author | `ananya.reddy@email.com` | `author123` |
| Author | `vikram.joshi@email.com` | `author123` |
| Author | `meera.nair@email.com` | `author123` |
| Author | `arjun.malhotra@email.com` | `author123` |
| Author | `sneha.kulkarni@email.com` | `author123` |
| Author | `farhan.sheikh@email.com` | `author123` |
| Author | `kavita.deshmukh@email.com` | `author123` |
| Author | `diya.chatterjee@email.com` | `author123` |

Use these only for the local/demo environment. Production users need individually provisioned credentials and a password reset flow.

The app starts with four clearly marked illustrative demo tickets so the admin queue and author ticket views are not empty. Removing `server/data/tickets.json` while the server is stopped restores these demo tickets on the next startup.

## API reference

All endpoints except health and login require `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Health check |
| POST | `/api/auth/login` | Public | Email/password login; returns JWT and user |
| GET | `/api/auth/me` | Authenticated | Validate the current session |
| GET | `/api/author/profile` | Author | Current author's profile summary |
| GET | `/api/books` | Authenticated | Author's books, or all books for admin |
| GET | `/api/tickets` | Authenticated | Author's own tickets or all admin tickets; supports `status`, `category`, `priority`, `q` query parameters |
| POST | `/api/tickets` | Author | Create a ticket; category and priority are classified server-side |
| GET | `/api/tickets/:id` | Owner / Admin | Ticket, messages and admin-only notes for admins |
| PATCH | `/api/tickets/:id` | Admin | Update status, category, priority or assignee |
| POST | `/api/tickets/:id/messages` | Owner / Admin | Add a public message; admins may add an internal note with `isInternal: true` |
| POST | `/api/tickets/:id/ai-draft` | Admin | Generate an editable response draft |
| GET | `/api/admin/stats` | Admin | Dashboard counts and totals |
| GET | `/api/admin/authors` | Admin | Author directory with operational summaries/contact details |

### Example requests

Login:

```http
POST /api/auth/login
Content-Type: application/json

{"email":"admin@bookleaf.com","password":"admin123"}
```

Create ticket:

```http
POST /api/tickets
Authorization: Bearer <author-token>
Content-Type: application/json

{
  "bookId": "BK001",
  "subject": "Question about pending royalty",
  "description": "Could you help me understand the pending amount shown for my book?"
}
```

Override classification:

```http
PATCH /api/tickets/BL-1001
Authorization: Bearer <admin-token>
Content-Type: application/json

{"priority":"Medium","category":"Royalty & Payments"}
```

## Important implementation details

- **Access control:** JWT middleware identifies the role. Author-facing ticket reads and writes check `authorId` ownership. Authors cannot create internal notes. Admin-only routes are guarded separately.
- **Validation:** Zod validates login, new ticket input, status/category/priority values and messages. The API returns useful 400/401/403/404 messages rather than exposing internal exceptions.
- **Security:** Helmet headers, CORS origin configuration, JSON size limit, login rate limit and environment-based JWT/AI secrets are configured. Demo passwords are deliberately documented as development-only.
- **Near-real-time updates:** The client polls ticket endpoints while ticket pages are open. Internal notes are filtered on the server, not merely hidden in the UI.
- **Royalty values:** Values are shown from the provided dataset; the app does not recalculate royalties because the source does not include printing cost, platform commission or shipping details needed to recompute net profit.

## Known limitations / next steps

1. Replace the JSON ticket store with PostgreSQL and add migrations, transactions, indexes and audit history.
2. Add real attachment storage (for example, S3-compatible object storage), file type/size validation and malware scanning. The current attachment field only records the selected file name.
3. Replace polling with Server-Sent Events or WebSockets for higher-volume ticket traffic.
4. Add password setup/reset, invite flow, refresh tokens, account lockout and production secrets management.
5. Add model evaluation fixtures and human feedback on classification accuracy; consider storing model name, prompt version, latency and token usage per AI operation.
6. Add pagination, date-range API filters, richer SLA reporting and role/permission management for multiple admin agents.
7. Add automated tests for author ownership, internal-note privacy, ticket lifecycle, input validation and AI failure paths.

## Project structure

```text
bookleaf-portal/
├── client/
│   ├── src/components/       # layout, badges, buttons, ticket cards
│   ├── src/context/          # authentication context
│   ├── src/pages/            # author + admin pages
│   ├── src/api.js            # Axios client and error handling
│   └── src/index.css         # Tailwind + shared component styles
├── server/
│   ├── data/sample-data.json # supplied BookLeaf dataset
│   ├── src/ai.js             # prompt and fallback AI logic
│   ├── src/store.js          # JSON-backed persistence and seed data
│   └── src/index.js          # Express API, auth and RBAC
├── SUBMISSION_NOTES.md       # concise approach write-up
└── README.md
```
