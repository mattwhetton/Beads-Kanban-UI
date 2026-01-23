# Beads Kanban UI

**See all your tasks at a glance. Organize, and track progress across projects - no CLI required.**

A beautiful visual Kanban board for the [Beads CLI](https://github.com/steveyegge/beads) task tracker. Beads stores tasks as git-native files (`.beads/issues.jsonl`), and this UI gives you the dashboard and board you've been missing.

> **Works great with [Beads Orchestration](https://github.com/AvivK5498/Claude-Code-Beads-Orchestration)** — A multi-agent orchestration framework for Claude Code that uses beads for git-native task tracking.

## See It in Action

**Dashboard** — All your projects in one place with status at a glance:
![Dashboard with multi-project view, status donuts, and tags](Screenshots/dashboard.png)

**Kanban Board** — Organize tasks across Open → In Progress → In Review → Closed:
![Kanban board showing epic groups and task cards with git branch info](Screenshots/kanban-board.png)

**Bead Details** — Dive into epics with full context and subtasks:
![Bead detail panel showing epic with progress bar and subtasks](Screenshots/bead-detail.png)

## What You Get

- **Multi-project dashboard** — Manage all your beads projects in one place with status donut charts
- **Kanban board** — Open → In Progress → In Review → Closed with drag-to-update workflow
- **Epic support** — Group related tasks with visual progress bars, view all subtasks, close epic when complete
- **PR workflow integration** — Create PRs from the UI, view CI check status, merge directly from Kanban board, get alerts for merge conflicts
- **Type-based visual distinction** — Bugs, features, and epics display with different accent colors for quick recognition
- **Real-time sync** — File watcher auto-updates when beads files change on disk
- **Auto-refresh** — PR status updates every 30 seconds automatically
- **Git integration** — See branch status for each task at a glance
- **Search & filter** — Quick filters for status, priority, owner, and tags
- **Project tagging** — Organize with colored tags and filter by them
- **Performance optimized** — Efficient polling skips closed beads to reduce unnecessary checks

## Quick Start

### Option 1: npm install (Recommended)

**Prerequisites:**
- Beads CLI: `brew install steveyegge/beads/bd`

**Install and run:**
```bash
npm install -g beads-kanban-ui
bead-kanban
```

That's it! The server starts automatically and opens your browser.

> On first run, the postinstall script downloads the platform binary (~15MB). This is one-time only.

### Option 2: Build from source

**Prerequisites:**
```bash
# Install beads CLI
brew install steveyegge/beads/bd

# You'll also need Node.js 18+ and Rust
```

**Install and run:**
```bash
git clone https://github.com/AvivK5498/beads-kanban-ui
cd beads-kanban-ui
npm install
npm run dev:full
```

Then navigate to **`http://localhost:3007`** and add your beads projects.

The app watches for file changes and syncs in real-time.

---

## Detailed Setup

### Development Mode

Run both frontend and backend together:
```bash
npm run dev:full
```

Or run separately:
```bash
# Terminal 1: Frontend (http://localhost:3007)
npm run dev

# Terminal 2: Backend (http://localhost:3008)
npm run server:dev
```

The Rust backend builds automatically on first run. If you need to rebuild it:
```bash
cd server && cargo build --release && cd ..
```

### Production Build

For a single binary deployment:
```bash
npm run build
npm run server:build
./server/target/release/beads-server
```

The production server embeds the frontend and serves everything from a single binary on port 3008.

---

## How It Works

### Dashboard
1. Click **+ Add Project** and select a directory with a `.beads/` folder
2. See all projects with status donuts showing task distribution
3. Click any project to view its Kanban board

### Kanban Board
1. Tasks are organized by status: Open, In Progress, In Review, Closed
2. Drag cards between columns to update status
3. Click any task to see full details, comments, and related subtasks (for epics)

### Features in Detail

**Epic Management**
- Group related tasks under a single epic
- Visual progress bar shows completion percentage (e.g., "3/5 children done")
- Click "Close Epic" button when 100% of children are complete
- View all subtasks directly within the epic card
- Design documents automatically linked to epics

**PR Workflow Integration**
- Create pull requests directly from the Kanban board
- See real-time CI check status for each PR
- Merge code directly from the UI without leaving Beads
- Get immediate alerts if merge conflicts are detected
- Status updates automatically every 30 seconds

**Type-Based Visual Coding**
- Bug, feature, and epic tasks display with distinct accent colors
- Quickly identify task types at a glance without reading labels
- Consistent color scheme across dashboard and board views

**Search & Filter**
- Quick filters for status, priority, and assigned owner
- Project tags for organization
- Filter by epic vs standalone tasks

**Real-time Sync**
- The app watches `.beads/issues.jsonl` and updates automatically
- No refresh needed—changes appear instantly

**Git Integration**
- Each task shows its git branch status
- Useful for tracking which branch a task lives on
- Pull request metadata synced from GitHub/GitLab

**Performance Optimized**
- Polling intelligently skips closed beads to reduce load
- Worktree status checking only runs for active tasks
- PR status updates are batched to minimize API calls

---

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

### Tech Stack
- **Frontend**: Next.js 14, React 18, Tailwind CSS, shadcn/ui
- **Backend**: Rust with Axum framework
- **Database**: SQLite for project metadata
- **File Sync**: Real-time watcher for `.beads/` changes

### Project Structure
```
beads-kanban-ui/
├── src/
│   ├── app/                 # Next.js pages and routes
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
│   └── types/               # TypeScript type definitions
├── server/
│   └── src/
│       ├── main.rs          # Axum server entry point
│       ├── db.rs            # SQLite database layer
│       └── routes/          # API route handlers
└── package.json
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Server health check |
| `/api/projects` | GET/POST | List or create projects |
| `/api/projects/:id` | GET/PUT/DELETE | Manage individual projects |
| `/api/beads?path=` | GET | Read beads from a project path |
| `/api/beads/comment` | POST | Add comment to a bead |
| `/api/bd/command` | POST | Execute beads CLI commands |
| `/api/git/branch-status` | GET | Get git branch status for a bead |
| `/api/fs/list` | GET | List directory contents |
| `/api/fs/exists` | GET | Check if a path exists |
| `/api/watch/beads` | GET | Server-sent events for file changes |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3008` | Backend server port |
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:3008` | Backend URL for frontend API calls |

---

## Development Commands

```bash
# Run both frontend and backend
npm run dev:full

# Run frontend only
npm run dev

# Run backend only
npm run server:dev

# Build for production
npm run build
npm run server:build

# Linting
npm run lint
```

---

## Related Projects

- **[Beads CLI](https://github.com/steveyegge/beads)** — Git-native issue tracker (the core tool this UI wraps)
- **[Beads Orchestration](https://github.com/AvivK5498/Claude-Code-Beads-Orchestration)** — Multi-agent orchestration framework for Claude Code using beads

---

## License

MIT
