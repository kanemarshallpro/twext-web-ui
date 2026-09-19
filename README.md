# TwextHub Web UI

> The official web frontend for TwextHub, the registry of Twext-compiled extensions ("Twexts") for use in TurboWarp

Built with React, TypeScript, and Tailwind CSS. This application is a **client-only SPA**: all data is fetched live from the TwextHub REST API v0 with zero local backend or database required.

---

### Authors

Twext is maintained by the [Twext Team](https://github.com/twext).

---

## Features

- **Flat, Purposeful UI**: Strict flat design — solid fills, crisp 1px borders, subtle hover tinting, authentic Twext purple palette (`#7b42bc`), and no skeuomorphic drop shadows.
- **Home**: Live instance-wide metrics (published count, authors, pending review queue), prominent search bar, and recent releases grid.
- **Explore / Search**: Paginated extension catalog with cursor/limit pagination, keyword search, author filters, and toggleable Grid / List views.
- **Extension Detail**: Version history table, moderation-status indicator (with amber banner when review is pending), author metadata, and TurboWarp load URL snippets with 1-click copy.
- **Session Authentication**: User registration (`POST /api/v0/auth/signup`) and login (`POST /api/v0/auth/login`) with RFC 7807 problem details surfaced as human-readable notices.
- **Dashboard / My Account**: Profile overview, terms acceptance status, display name / password management (`PATCH /api/v0/users/:namespace`), and list of user's own published & pending extensions.
- **Publishing**: All publishing happens through the official Twext CLI — `twext login`, `twext publish`, `twext yank`.
- **Sessions & Automation Tokens**: View and revoke active web sessions (`DELETE /api/v0/sessions/:id`), and generate/manage scoped automation tokens (`publish`, `yank`) for CI/CD pipelines (such as GitHub Actions).
- **Documentation**: Static developer guides on using the Twext CLI (`twext login`, `twext publish`) and importing extensions into TurboWarp.
- **Live Governance**: Live Terms of Service and Privacy Policy fetched directly from `/api/v0/terms` and `/api/v0/privacy`, with interactive acceptance tracking (`POST /api/v0/terms/accept`).
- **Configurable Registry Instance**: Point the UI at any self-hosted TwextHub registry via an optional `config.yml` or the `TWEXTHUB_API_URL` environment variable (see [API Configuration](#api-configuration)).

---

## Local Development & Setup

### Prerequisites

- Node.js 22+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/twext/twexthub-web.git
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

This compiles optimized static assets into the `dist/` directory. The Docker image
serves those assets with a small dependency-free Node server (`server.js`) whose
shape mirrors the TwextHub image: `node server.js`, path-traversal-safe static
serving with SPA fallback, and runtime config read exactly like TwextHub's
`src/config.js` — defaults < `config.yml` (filesystem) < environment variables.
You can still host plain `dist/` on any static file host (Cloudflare Pages, Vercel,
GitHub Pages, Nginx); runtime env config just won't apply there.

---

## API Configuration

By default, the client points to the official TwextHub server:

```
https://twexts.sdisk.us/api/v0
```

The base URL is enforced: only absolute `http`/`https` URLs are accepted, and any
invalid value falls back to the default above. Resolution happens before first
render, lowest precedence first:

| Precedence  | Source                                                                       |
| ----------- | ---------------------------------------------------------------------------- |
| 1 (lowest)  | Built-in default `https://twexts.sdisk.us/api/v0`                            |
| 2           | Build-time env `VITE_TWEXTHUB_API_URL` (baked in at `npm run build`)         |
| 3           | `config.yml` (optional file, read by `server.js` from the working directory) |
| 4 (highest) | Container runtime env `TWEXTHUB_API_URL` (read by `server.js`)               |

### config.yml (optional)

Put a `config.yml` next to the Dockerfile / in the working directory. `server.js`
reads it at startup (falling back to `config.yaml` if it doesn't exist, or pass an
explicit path like TwextHub: `node server.js /path/to/config.yml`):

```yaml
apiBaseUrl: https://your-registry.example.com/api/v0
```

### Environment variables

- **Docker / Compose (recommended)**: set `TWEXTHUB_API_URL` on the container. The
  bundled `server.js` reads it at runtime like TwextHub reads `TWEXTHUB_*`, so no
  rebuild is needed after changing the URL. This overrides any `config.yml`. See
  `compose.example.yml`.
- **Build-time**: set `VITE_TWEXTHUB_API_URL` to bake a base URL into the bundle
  (used when `dist/` is hosted without `server.js`).
- **Server**: `TWEXTHUB_PORT` (default `3000`) and `WEB_ROOT` (default `dist`).

---

## OpenAPI Spec Quick Reference (TwextHub v0)

All endpoints return and accept JSON. Errors follow the **RFC 7807 Problem Details** standard (`application/problem+json`).

### Public Endpoints

| Method | Path                | Description                                                |
| ------ | ------------------- | ---------------------------------------------------------- |
| `GET`  | `/stats`            | Instance metrics (`published`, `pending`, `authors`)       |
| `GET`  | `/extensions`       | Paginated list of published extensions (`cursor`, `limit`) |
| `GET`  | `/search?q={query}` | Search extensions by query, namespace, or tags             |
| `GET`  | `/@:namespace/:id`  | Extension details and release history                      |
| `GET`  | `/users`            | Paginated list of registered author profiles               |
| `GET`  | `/users/:namespace` | Public author profile and publication status               |
| `GET`  | `/terms`            | Current Terms of Service document and version              |
| `GET`  | `/privacy`          | Current Privacy Policy document and version                |

### Authentication & Sessions

| Method   | Path            | Auth Required | Description                                                      |
| -------- | --------------- | ------------- | ---------------------------------------------------------------- |
| `POST`   | `/auth/signup`  | No            | Register author account (`namespace`, `password`, `displayName`) |
| `POST`   | `/auth/login`   | No            | Authenticate user and receive Bearer session token               |
| `POST`   | `/auth/logout`  | Bearer        | Invalidate current session                                       |
| `GET`    | `/sessions`     | Bearer        | List active web sessions for current account                     |
| `DELETE` | `/sessions/:id` | Bearer        | Revoke specific session                                          |

### Governance & Account Management

| Method   | Path                | Auth Required | Description                                       |
| -------- | ------------------- | ------------- | ------------------------------------------------- |
| `POST`   | `/terms/accept`     | Bearer        | Record acceptance of Terms of Service (`version`) |
| `PATCH`  | `/users/:namespace` | Bearer        | Update display name or change account password    |
| `DELETE` | `/users/:namespace` | Bearer        | Delete user account and revoke all sessions       |

### CI Automation Tokens & Publishing

| Method   | Path                                   | Auth Required      | Description                                                     |
| -------- | -------------------------------------- | ------------------ | --------------------------------------------------------------- |
| `GET`    | `/tokens`                              | Bearer             | List automation tokens                                          |
| `POST`   | `/tokens`                              | Bearer             | Create automation token (`name`, `scopes: ["publish", "yank"]`) |
| `DELETE` | `/tokens/:id`                          | Bearer             | Delete/revoke automation token                                  |
| `POST`   | `/@:ns/:id/versions`                   | Bearer (`publish`) | Publish a new version (`manifest` + compiled bundle)            |
| `GET`    | `/@:ns/:id/versions/:version/download` | No                 | Download a version's compiled `extension.js` bundle             |

---

## Security & XSS Prevention

All user-supplied content (names, descriptions, author namespaces, and changelogs) is strictly escaped via React's default text interpolation before insertion into the DOM.
