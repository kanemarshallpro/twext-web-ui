# TwextHub Web UI

The official web frontend for [TwextHub](https://twexts.sdisk.us/api/v0), the registry of Twext-compiled extensions for [TurboWarp](https://turbowarp.org).

Built with React, TypeScript, and Tailwind CSS. This application is a **client-only SPA**: all data is fetched live from the TwextHub REST API v0 with zero local backend or database required.

---

## Features

- **Flat, Purposeful UI**: Strict flat design — solid fills, crisp 1px borders, subtle hover tinting, authentic Twext purple palette (`#7b42bc`), and no skeuomorphic drop shadows.
- **Home**: Live instance-wide metrics (published count, authors, pending review queue), prominent search bar, and recent releases grid.
- **Explore / Search**: Paginated extension catalog with cursor/limit pagination, keyword search, author filters, and toggleable Grid / List views.
- **Extension Detail**: Full README documentation (rendered Markdown), version history table, moderation-status indicator (with amber banner when review is pending), author metadata, and TurboWarp load URL snippets with 1-click copy.
- **Session Authentication**: User registration (`POST /api/v0/auth/signup`) and login (`POST /api/v0/auth/login`) with RFC 7807 problem details surfaced as human-readable notices.
- **Dashboard / My Account**: Profile overview, terms acceptance status, display name / password management (`PATCH /api/v0/users/:namespace`), and list of user's own published & pending extensions.
- **Publish**: Web upload and paste form for pre-compiled Twext output (`manifest.json` + `extension.js`), with live JSON manifest validation and sample data presets.
- **Sessions & Automation Tokens**: View and revoke active web sessions (`DELETE /api/v0/sessions/:id`), and generate/manage scoped automation tokens (`publish`, `yank`) for CI/CD pipelines (such as GitHub Actions).
- **Documentation**: Static developer guides on using the Twext CLI (`twext login`, `twext publish`, `twext add`) and importing extensions into TurboWarp.
- **Live Governance**: Live Terms of Service and Privacy Policy fetched directly from `/api/v0/terms` and `/api/v0/privacy`, with interactive acceptance tracking (`POST /api/v0/terms/accept`).
- **Configurable Registry Instance**: Point the UI to any self-hosted TwextHub registry URL via the in-app server settings dialog or `twexthub_api_base_url` local storage.

---

## Local Development & Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/turbowarp/twexthub-web.git
cd twexthub-web

# Install dependencies
npm install

# Start local development server
npm run dev
```

The application will be available at `http://localhost:3000`.

### Production Build

```bash
npm run build
```

This compiles optimized static assets into the `dist/` directory. You can host `dist/` on any static file host (Cloudflare Pages, Vercel, Netlify, GitHub Pages, or an Nginx/Caddy container).

---

## API Configuration

By default, the client points to the official TwextHub server:
```
https://twexts.sdisk.us/api/v0
```

### Changing the API Base URL

1. **In the Web UI**: Click the server badge in the top navigation bar (e.g. `twexts.sdisk.us`) to open the **API Instance Configuration** modal. Enter your custom server URL and click **Save Changes**.
2. **Via LocalStorage**: Run in your browser console:
   ```js
   localStorage.setItem('twexthub_api_base_url', 'https://your-registry.example.com/api/v0');
   location.reload();
   ```

---

## OpenAPI Spec Quick Reference (TwextHub v0)

All endpoints return and accept JSON. Errors follow the **RFC 7807 Problem Details** standard (`application/problem+json`).

### Public Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/stats` | Instance metrics (`published`, `pending`, `authors`) |
| `GET` | `/extensions` | Paginated list of published extensions (`cursor`, `limit`) |
| `GET` | `/search?q={query}` | Search extensions by query, namespace, or tags |
| `GET` | `/extensions/:namespace/:id` | Extension details, readme, and release history |
| `GET` | `/users` | Paginated list of registered author profiles |
| `GET` | `/users/:namespace` | Public author profile and publication status |
| `GET` | `/terms` | Current Terms of Service document and version |
| `GET` | `/privacy` | Current Privacy Policy document and version |

### Authentication & Sessions

| Method | Path | Auth Required | Description |
|---|---|---|---|
| `POST` | `/auth/signup` | No | Register author account (`namespace`, `password`, `displayName`) |
| `POST` | `/auth/login` | No | Authenticate user and receive Bearer session token |
| `POST` | `/auth/logout` | Bearer | Invalidate current session |
| `GET` | `/sessions` | Bearer | List active web sessions for current account |
| `DELETE` | `/sessions/:id` | Bearer | Revoke specific session |

### Governance & Account Management

| Method | Path | Auth Required | Description |
|---|---|---|---|
| `POST` | `/terms/accept` | Bearer | Record acceptance of Terms of Service (`version`) |
| `PATCH` | `/users/:namespace` | Bearer | Update display name or change account password |
| `DELETE` | `/users/:namespace` | Bearer | Delete user account and revoke all sessions |

### CI Automation Tokens & Publishing

| Method | Path | Auth Required | Description |
|---|---|---|---|
| `GET` | `/tokens` | Bearer | List automation tokens |
| `POST` | `/tokens` | Bearer | Create automation token (`name`, `scopes: ["publish", "yank"]`) |
| `DELETE` | `/tokens/:id` | Bearer | Delete/revoke automation token |
| `POST` | `/publish` | Bearer (`publish`) | Submit extension manifest and compiled bundle |

---

## Security & XSS Prevention

All user-supplied content (names, descriptions, author namespaces, changelogs, and README markdown) is strictly escaped via React's default text interpolation and sanitized Markdown rendering before insertion into the DOM.
