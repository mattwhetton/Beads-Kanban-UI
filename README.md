# Beads Kanban UI

A visual Kanban board interface for the [beads](https://github.com/steveyegge/beads) CLI task tracker. View and manage your beads in a clean, intuitive drag-and-drop interface.

> **Works great with [Beads Orchestration](https://github.com/AvivK5498/Claude-Code-Beads-Orchestration)** - A multi-agent orchestration framework for Claude Code that uses beads for git-native task tracking with mandatory code review gates.

## Features

- **Multi-project support** - Manage multiple beads projects from a single dashboard
- **Kanban board** - Visual columns for Open, In Progress, In Review, and Closed statuses
- **Bead details** - View descriptions, comments, and activity timeline
- **Search & filter** - Filter by status, priority, or agent assignment
- **Git integration** - See branch status for each bead
- **Real-time updates** - File watcher syncs changes automatically
- **Project tagging** - Organize projects with custom colored tags

## Prerequisites

- **Node.js** 18+ and npm
- **Rust** (for the backend server)
- **beads CLI** - Install via:
  - macOS: `brew install steveyegge/beads/bd`
  - npm: `npm install -g @beads/bd`
  - Go: `go install github.com/steveyegge/beads/cmd/bd@latest`

## Quick Start

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Build the Rust backend (first time only)
cd server && cargo build --release && cd ..
```

### 2. Run in Development Mode

```bash
# Run both frontend and backend concurrently
npm run dev:full
```

Or run them separately:

```bash
# Terminal 1: Frontend (http://localhost:3007)
npm run dev

# Terminal 2: Backend (http://localhost:3008)
npm run server:dev
```

### 3. Open the UI

Navigate to `http://localhost:3007` (dev mode) or `http://localhost:3008` (production build).

## Production Build

```bash
# Build the Next.js frontend
npm run build

# Build the Rust server (embeds the frontend)
npm run server:build

# Run the production server
./server/target/release/beads-server
```

The production server embeds the frontend static files and serves everything from a single binary on port 3008.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Beads Kanban UI                      │
├─────────────────────────────────────────────────────────┤
│  Frontend (Next.js 14)          │  Backend (Rust/Axum) │
│  ─────────────────────          │  ────────────────────│
│  • React 18                     │  • SQLite (projects) │
│  • shadcn/ui components         │  • beads CLI bridge  │
│  • Tailwind CSS                 │  • File watcher      │
│  • TypeScript                   │  • Git integration   │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │   .beads/ directory     │
              │   (issues.jsonl, etc.)  │
              └─────────────────────────┘
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/projects` | GET/POST | List or create projects |
| `/api/projects/:id` | GET/PUT/DELETE | Manage single project |
| `/api/beads?path=` | GET | Read beads from project path |
| `/api/beads/comment` | POST | Add comment to a bead |
| `/api/bd/command` | POST | Execute beads CLI command |
| `/api/git/branch-status` | GET | Get git branch status |
| `/api/fs/list` | GET | List directory contents |
| `/api/fs/exists` | GET | Check if path exists |
| `/api/watch/beads` | GET | SSE endpoint for file changes |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3008` | Backend server port |
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:3008` | Backend URL for frontend |

## Project Structure

```
beads-kanban-ui/
├── src/
│   ├── app/                 # Next.js pages
│   │   ├── page.tsx         # Projects dashboard
│   │   ├── project/         # Kanban board view
│   │   └── settings/        # Settings page
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── kanban-column.tsx
│   │   ├── bead-card.tsx
│   │   └── bead-detail.tsx
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and API client
│   └── types/               # TypeScript types
├── server/
│   └── src/
│       ├── main.rs          # Axum server entry
│       ├── db.rs            # SQLite database
│       └── routes/          # API route handlers
└── package.json
```

## Usage

1. **Add a project** - Click the + button on the dashboard and select a directory containing a `.beads/` folder

2. **View Kanban board** - Click on a project card to see all beads organized by status

3. **Filter beads** - Use the search bar or filter dropdown to find specific beads

4. **View bead details** - Click on a bead card to see full description, comments, and activity

5. **Add comments** - Use the comment input in the bead detail view (executes `bd comment`)

## Development

```bash
# Run linter
npm run lint

# Run frontend only
npm run dev

# Run backend only
npm run server:dev

# Build frontend for production
npm run build

# Build backend for production
npm run server:build
```

## License

MIT
