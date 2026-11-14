# BookLeaf Author Support & Communication Portal

A full-stack implementation of BookLeaf Publishing's Author Support & Communication Portal assignment. The application includes an author workspace and an admin operations portal, seeded with the supplied dataset of 10 authors and 18 books.

> **Confidential assignment:** Keep this repository private. Do not publish the assignment or this solution in a public repository.

## Features

### Author portal

- Email/password sign-in with author-level data access.
- Dashboard showing book count, copies sold, earned royalties, and pending royalties.
- Book catalogue with ISBN, genre, publication date, status, MRP, sales, and royalty details.
- Support ticket form with a book selector or a general/account-level option.
- Ticket history with status filters, search, original query, and support replies.
- Ticket updates refresh automatically while the ticket page is open.

### Admin portal

- Operations dashboard with queue statistics, urgent tickets, author/book counts, and pending royalties.
- Ticket inbox with status, category, priority, date, and text filters.
- AI-assisted ticket category and priority classification, with manual admin overrides.
- Editable AI-drafted replies based on the ticket, relevant author/book information, and the BookLeaf Knowledge Base.
- Ticket status management, assignment, public replies, and private internal notes.
- Author directory and complete book catalogue.

### AI integration and fallback

- Optional OpenAI Chat Completions integration. The default model is `gpt-4o-mini`; configure the model through `OPENAI_MODEL`.
- The API key is read by the backend from `OPENAI_API_KEY` and is never sent to the browser.
- Classification uses the ticket subject and description instead of sending the full dataset or ticket history.
- Draft generation uses the BookLeaf Knowledge Base and compact context for the specific ticket.
- Model requests have a timeout, and returned content is checked before it is accepted.
- If no API key is configured, or the provider fails or returns unusable content, the application uses a local rules-based fallback. Tickets can still be created, and admins can edit and send manual replies.
- The fallback is designed around the assignment's categories and policies. It is not a live LLM integration or a replacement for human review.

## Technology stack

- **Frontend:** React 18, Vite, React Router, Tailwind CSS, Axios
- **Backend:** Node.js, Express
- **Validation:** Zod
- **Authentication:** JWT and role-based access control
- **AI:** Optional OpenAI API with a rules-based fallback
- **Persistence:** JSON files for the supplied author/book data and ticket data

## Architecture

```text
Browser
  React + React Router + Tailwind CSS + Axios
                 |
                 | REST / JSON + JWT bearer token
                 v
Express API (Node.js)
  Authentication middleware / role checks / Zod validation
  Ticket routes / BookLeaf AI service
                 |
                 +-- sample-data.json  (provided authors and books)
                 +-- tickets.json      (local ticket persistence)
                 +-- OpenAI API        (optional, server-side only)
```

The API uses a JSON-backed repository so the project can run locally without a separate database service. Ticket changes are stored in `server/data/tickets.json`. The supplied author and book dataset is used as source data.

The frontend uses short-interval polling for ticket updates rather than WebSockets. This keeps the local setup simple while allowing authors to see admin replies without manually refreshing the page.

> **Deployment note:** JSON-file persistence is suitable for local evaluation, but it is not durable storage on hosts with ephemeral filesystems. For a persistent production deployment, move tickets and related records to a managed database before relying on the hosted instance for long-term data.

## Requirements

- Node.js 20 or newer
- npm

## Run locally

### 1. Install dependencies

Run from the project root:

```bash
npm install
```

### 2. Configure environment variables

Copy the example environment file:

```bash
cp server/.env.example server/.env
```

Configure `server/.env` with your local values:

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-secret
ADMIN_EMAIL=admin@bookleaf.com
ADMIN_PASSWORD=replace-with-your-admin-password
AUTHOR_DEFAULT_PASSWORD=replace-with-your-shared-demo-author-password
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

- Use a long, random value for `JWT_SECRET`.
- `ADMIN_PASSWORD` sets the demo admin password.
- `AUTHOR_DEFAULT_PASSWORD` sets the shared demo password for the seeded author accounts.
- `OPENAI_API_KEY` is optional. Leave it empty to use the local rules-based fallback.
- Never commit `server/.env` or share its secrets. Keep `.env` excluded through `.gitignore`.

### 3. Start the frontend and backend

```bash
npm run dev
```

Local addresses:

- Frontend: <http://localhost:5173>
- Backend health check: <http://localhost:5000/api/health>

Vite proxies `/api` requests to the Express server during development.

### 4. Build and run the production-style server locally

```bash
npm run build
npm start
```

After the build, Express serves the frontend from `client/dist` together with the API on port `5000`.

## Demo access

The supplied dataset does not contain passwords. Demo credentials are configured through environment variables rather than stored in the dataset.

- **Admin email:** `admin@bookleaf.com`
- **Admin password:** use the value configured in `ADMIN_PASSWORD`.
- **Author access:** select an author from the author dropdown on the login page.
- **Author password:** all seeded demo authors use the shared value configured in `AUTHOR_DEFAULT_PASSWORD`.

The author dropdown selects an existing author's email; it does not create or change accounts. The demo password values used by any frontend quick-login buttons must match the corresponding values in `server/.env`. This quick-login behavior is for evaluation only. Production users should have individually provisioned credentials and a password reset flow.

The application starts with illustrative demo tickets so the admin queue and author ticket views can be tested immediately. Ticket seed behavior is implemented in the server's local JSON store.

## API reference

All endpoints except the health check and login require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | Public | Health check |
| `POST` | `/api/auth/login` | Public | Email/password login; returns a JWT and user |
| `GET` | `/api/auth/me` | Authenticated | Validate the current session |
| `GET` | `/api/author/profile` | Author | Current author's profile summary |
| `GET` | `/api/books` | Authenticated | Author's books, or all books for admin |
| `GET` | `/api/tickets` | Authenticated | Author's tickets or all admin tickets; supports status, category, priority, and text query filters |
| `POST` | `/api/tickets` | Author | Create a ticket; category and priority are classified server-side |
| `GET` | `/api/tickets/:id` | Owner / Admin | Get a ticket and its messages; admins can also see internal notes |
| `PATCH` | `/api/tickets/:id` | Admin | Update status, category, priority, or assignee |
| `POST` | `/api/tickets/:id/messages` | Owner / Admin | Add a public message; admins can add an internal note with `isInternal: true` |
| `POST` | `/api/tickets/:id/ai-draft` | Admin | Generate an editable response draft |
| `GET` | `/api/admin/stats` | Admin | Dashboard counts and totals |
| `GET` | `/api/admin/authors` | Admin | Author directory with operational summaries and contact details |

### Example requests

**Login**

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@bookleaf.com",
  "password": "<ADMIN_PASSWORD>"
}
```

**Create a ticket**

```http
POST /api/tickets
Authorization: Bearer <AUTHOR_TOKEN>
Content-Type: application/json

{
  "bookId": "BK001",
  "subject": "Question about pending royalty",
  "description": "Could you help me understand the pending amount shown for my book?"
}
```

**Override classification**

```http
PATCH /api/tickets/BL-1001
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "priority": "Medium",
  "category": "Royalty & Payments"
}
```

## Implementation details

- **Access control:** JWT middleware identifies the user and role. Author-facing ticket operations enforce author ownership. Admin-only routes are protected separately.
- **Validation:** Zod validates login, ticket creation, status/category/priority values, and messages. The API returns meaningful client errors for invalid or unauthorized requests.
- **Security:** Helmet headers, CORS configuration, JSON size limits, login rate limiting, and environment-based JWT/AI secrets are configured.
- **Ticket updates:** The client polls ticket endpoints while ticket pages are open. Internal notes are filtered by the server and are not returned to authors.
- **Royalty values:** The application displays figures from the supplied dataset. It does not recalculate royalties because the dataset does not include the printing cost, platform commission, or shipping details needed to recompute net profit.

## Known limitations and future improvements

1. Replace JSON ticket persistence with a managed database and add migrations, transactions, indexes, and audit history.
2. Add real attachment storage, file type/size validation, and malware scanning. The current attachment field only previews or records the selected file name.
3. Consider Server-Sent Events or WebSockets for higher-volume ticket traffic.
4. Add individual password setup/reset, an invite flow, refresh tokens, account lockout, and production secrets management.
5. Add model evaluation fixtures and human feedback for classification accuracy; record model name, prompt version, latency, and token usage for AI operations.
6. Add pagination, date-range filters, richer SLA reporting, and finer-grained permissions for multiple admin agents.
7. Add automated tests for author ownership, internal-note privacy, ticket lifecycle, input validation, and AI failure handling.

---

## Project structure

The main folders and files are organized as follows:

```text
bookleaf-portal/
├── client/
│   └── src/
│       ├── components/       # Layout, badges, buttons, ticket cards
│       ├── context/          # Authentication context
│       ├── pages/            # Author and admin pages
│       ├── api.js             # Axios client and error handling
│       └── index.css          # Tailwind and shared component styles
├── server/
│   ├── data/
│   │   └── sample-data.json  # Supplied BookLeaf dataset
│   └── src/
│       ├── ai.js              # Prompt and fallback AI logic
│       ├── store.js           # JSON-backed persistence and seed data
│       └── index.js           # Express API, authentication, and RBAC
├── SUBMISSION_NOTES.md        # Assignment approach write-up
└── README.md
```
