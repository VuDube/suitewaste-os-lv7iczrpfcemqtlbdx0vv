# SuiteWaste OS 2.1 - Operational Intelligence Suite

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/VuDube/suitewaste-os-2-1-operational-intelligence-suite)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)

## Overview

SuiteWaste OS 2.1 is a **monolithic, serverless, offline-first Progressive Web App (PWA)** designed as a comprehensive operating system for high-volume waste buyback centers. It integrates industrial hardware (scales, printers, signature pads) directly via browser APIs (Web Serial, WebUSB, WebHID) into a unified React frontend backed by Cloudflare's edge network.

Built with a **brutalist, high-contrast UI** optimized for touchscreens and industrial environments (#050505 background, #00FF41 accents, #FF3333 warnings), it features:

- **Intelligent Weighbridge POS** with AI-assisted grading and fraud detection
- **Double-entry financial ledger** with real-time P&L and compliance reporting
- **HR management** with shift rostering and e-learning
- **Fleet logistics** with live tracking and route optimization
- **SAPS/EPR compliance** automation (South Africa-specific)
- **E-Waste Marketplace** with AI categorization

**Offline-First**: RxDB + IndexedDB for local persistence, automatic sync to Cloudflare D1/R2/KV when online. **PWA-Ready**: Installable, push notifications, precached assets via Workbox.

## Key Features

- **Manager Dashboard (God View)**: Live cash position, throughput (kg/hr), AI yield analytics, fraud alerts
- **Weighbridge POS**: Hardware integration (scales/printers), AI grading via Workers AI, auto-receipts
- **General Ledger**: Double-entry accounting, P&L/Balance Sheet generation
- **HR & Roster**: Clock-in/out, leave workflows, contract storage
- **Fleet Manager**: OBD-II tracking, route optimization
- **Compliance Hub**: SAPS Register, VAT 264, EPR reporting
- **AI Workflows**: Material grading (@cf/microsoft/resnet-50), fraud detection, predictive procurement
- **RBAC**: Role-based access (Owner/Manager/Operator/Driver/HR)
- **Hardware Agnostic**: Web Serial/USB/HID for scales, printers, signature pads

## Tech Stack

### Frontend
- **React 18 + TypeScript** (Vite)
- **Tailwind CSS** + shadcn/ui (brutalist dark theme)
- **RxDB** (IndexedDB adapter) for offline-first data sync
- **TanStack Query** for server-state
- **Framer Motion** for micro-interactions
- **Recharts** for dashboards
- **Workbox** for PWA service worker

### Backend (Cloudflare Edge)
- **Cloudflare Workers** + **Durable Objects** (Agents SDK)
- **Cloudflare D1** (SQLite database)
- **Cloudflare R2** (images/documents)
- **Cloudflare KV** (pricing/sessions)
- **Workers AI** (@cf/microsoft/resnet-50, @cf/meta/llama-3.8b)
- **Hono** for API routing

### Hardware Integration
- **Web Serial API** (scales)
- **WebUSB API** (printers)
- **WebHID/Canvas** (signature pads)
- **HTTP Fetch** (IP cameras)

## Prerequisites

- [Bun](https://bun.sh) 1.0+ (package manager)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install/) (Cloudflare deployment)
- Cloudflare account with Workers/Pages enabled
- Environment variables: `CF_AI_BASE_URL`, `CF_AI_API_KEY` (AI Gateway)

**Note**: AI features use Cloudflare Workers AI (free tier). There is a limit on requests across all user apps in a given time period.

## Quick Start

1. **Clone & Install**
   ```bash
   git clone <repo-url>
   cd suitewaste-os
   bun install
   ```

2. **Configure Environment** (edit `wrangler.jsonc`)
   ```
   "vars": {
     "CF_AI_BASE_URL": "https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway}/openai",
     "CF_AI_API_KEY": "your-api-key"
   }
   ```

3. **Development**
   ```bash
   bun dev
   ```
   Opens at `http://localhost:3000`. Hot-reload enabled.

4. **Type Generation** (Cloudflare bindings)
   ```bash
   bun run cf-typegen
   ```

## Usage

- **PWA Install**: Prompt appears on first load (`beforeinstallprompt`).
- **Offline Mode**: All core modules (POS, Dashboard) work via RxDB.
- **Hardware Setup**: Connect via Settings > Hardware (user gesture required for permissions).
- **Navigation**: Collapsible sidebar with RBAC. POS enters full-screen mode.
- **API Endpoints**: `/api/chat/:sessionId/*` for AI assistance (pre-configured).

Example POS workflow:
1. Operator selects material grade
2. Auto-weight via Web Serial
3. AI grades image (Workers AI)
4. Print receipt (WebUSB)
5. Syncs to D1 on reconnect

## Development

- **Frontend**: Edit `src/pages/HomePage.tsx` (rewrite for POS/Dashboard).
- **Routes**: Add to `src/main.tsx` (`createBrowserRouter`).
- **State**: RxDB for local DB, TanStack Query for sync.
- **Workers**: Extend `worker/userRoutes.ts`. Use existing Agents for persistence.
- **AI Tools**: Pre-integrated (web_search, get_weather, MCP servers).
- **Lint & Build**:
  ```bash
  bun lint
  bun build
  ```

**Do Not Touch**:
- `worker/index.ts`, `wrangler.toml/jsonc`, shadcn/ui components.

## Deployment

1. **Build & Deploy** (one-command):
   ```bash
   bun deploy
   ```
   Deploys Worker + Pages assets.

2. **Manual**:
   ```bash
   bun build          # Frontend
   wrangler deploy    # Worker + Assets
   ```

3. **Custom Domain/Pages**:
   ```
   wrangler pages deploy dist --project-name=<pages-project>
   ```

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/VuDube/suitewaste-os-2-1-operational-intelligence-suite)

**Production Notes**:
- Free Tier: 100k Worker requests/day, 5GB D1.
- Migrate to Paid for scale.
- D1 Schema: Auto-migrated via Wrangler.

## Contributing

1. Fork & PR to `main`.
2. Follow TypeScript + ESLint rules.
3. Test offline/hardware flows.
4. Update README for new features.

## License

MIT License. See [LICENSE](LICENSE) for details.

## Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [RxDB Replication](https://rxdb.info/replication.html)
- Issues: GitHub Issues

Built for **Mogwase Buyback Center, South Africa**. 🇿🇦