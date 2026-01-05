# Application Architecture

## High-Level Overview

```
┌─────────────────────────────────────────┐
│         User Interface (React)          │
│  - Pages (Login, Dashboard, Chapters)   │
│  - Components (SyncManager, etc.)       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│        Application Layer                 │
│  - Contexts (AuthContext)               │
│  - Hooks (useAuth)                      │
│  - Routing (React Router)               │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌──────▼────────┐
│  Auth (Kinde)  │  │  Data Layer   │
│  - OAuth       │  │  - DBService  │
│  - Sessions    │  │  - SQLite     │
└────────────────┘  └───────┬───────┘
                            │
                    ┌───────▼────────┐
                    │  Web Worker    │
                    │  - DB Ops      │
                    │  - Non-blocking│
                    └────────────────┘
```

## Directory Structure

```
src/
├── components/          # Reusable UI components
│   └── SyncManager.tsx  # Online/offline sync status
├── contexts/           # React Context providers
│   ├── AuthContext.tsx # Auth state management
│   └── AuthContextCore.ts # Auth types
├── data/              # Static data
│   └── chapters.ts    # Study content
├── db/                # Database layer
│   ├── db-service.ts  # DB facade/API
│   └── db-worker.ts   # SQLite Web Worker
├── hooks/             # Custom React hooks
│   └── useAuth.ts     # Auth hook
├── pages/             # Route pages
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   ├── Dashboard.tsx
│   └── ChapterDetail.tsx
├── App.tsx            # Root component
├── main.tsx          # App entry point
└── index.css         # Global styles
```

## Data Flow

### 1. Authentication Flow

```
User → LoginPage
  ↓
Kinde OAuth
  ↓
Callback → AuthContext
  ↓
Update Local DB (user_profile)
  ↓
Redirect to Dashboard
```

### 2. Reading Progress Flow

```
User reads chapter
  ↓
Mark as complete (UI)
  ↓
DBService.exec()
  ↓
Web Worker (db-worker.ts)
  ↓
SQLite (progress table)
  ↓
SyncManager detects change
  ↓
Marks for sync (synced = 0)
```

### 3. Offline Sync Flow

```
User goes offline
  ↓
Answers stored locally
  ↓
User comes back online
  ↓
SyncManager triggers
  ↓
Batch upload to server (future)
  ↓
Mark as synced (synced = 1)
```

## Key Design Patterns

### 1. **Provider Pattern**
- `KindeProvider` wraps entire app
- `AuthProvider` manages auth state
- Context consumed via hooks

### 2. **Protected Routes**
- `ProtectedRoute` component
- Checks auth state
- Redirects to login if unauthorized

### 3. **Facade Pattern**
- `DBService` abstracts SQLite complexity
- Simple API: `exec()`, `get()`, `getAll()`
- Hides Web Worker communication

### 4. **Web Worker Pattern**
- Heavy DB operations off main thread
- Message-based communication
- Promise-based API

### 5. **Compound Components**
- Pages composed of smaller components
- Separation of concerns
- Reusable building blocks

## State Management Strategy

### Local State
- Component-level state with `useState`
- Form inputs, UI toggles, loading states

### Global State
- Authentication: AuthContext
- No Redux needed (app is simple enough)

### Persistent State
- SQLite for all user data
- IndexedDB via OPFS for SQLite file
- No localStorage (except device detection)

## Performance Optimizations

### 1. **Code Splitting**
- Route-based lazy loading (potential)
- Component-level splitting

### 2. **Database Optimization**
- Web Worker for non-blocking
- Indexed queries
- Batch operations

### 3. **Asset Optimization**
- Vite's built-in tree-shaking
- Module bundling
- WASM lazy loading

### 4. **Caching Strategy**
- Service worker caches assets
- SQLite caches data locally
- Stale-while-revalidate pattern

## Security Considerations

### 1. **Authentication**
- OAuth via Kinde (secure redirect flow)
- No passwords stored locally
- Session tokens in memory

### 2. **Data Storage**
- SQLite file in OPFS (origin-private)
- No sensitive data in localStorage
- Clear data on logout

### 3. **CORS & Headers**
- Proper CORS configuration
- SharedArrayBuffer isolation
- Content Security Policy (future)

## Error Handling

### 1. **Database Errors**
- Try-catch in DBService
- Graceful degradation
- Console logging for debugging

### 2. **Auth Errors**
- Redirect to login on failure
- Clear error messages
- Retry mechanisms

### 3. **Network Errors**
- Offline detection
- Queue sync operations
- User feedback via SyncManager

## Future Architectural Changes

1. **Backend API** (Optional)
   - Sync endpoint for cross-device data
   - Analytics tracking
   - Content updates

2. **State Management**
   - May add Zustand if complexity grows
   - Better sync state management

3. **Testing Infrastructure**
   - Unit tests for business logic
   - Integration tests for DB operations
   - E2E tests for critical flows
