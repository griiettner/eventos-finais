# Technology Stack

## Frontend Framework

### **React 19**
- Latest version with improved performance
- Function components with Hooks
- Strict mode enabled for development

### **TypeScript**
- Type-safe development
- Better IDE support
- Catches errors at compile time

## Build Tool

### **Vite (Rolldown)**
- Using `rolldown-vite@7.2.5` (faster Rust-based bundler)
- Fast HMR (Hot Module Replacement)
- Optimized for React
- ES modules support

## Routing

### **React Router v6**
- Client-side routing
- Protected routes for authenticated content
- Programmatic navigation
- Route-based code splitting

## State Management

### **React Context API**
- AuthContext for user authentication state
- Simple and sufficient for app needs
- No need for Redux/Zustand

## Database

### **SQLite WASM**
- `@sqlite.org/sqlite-wasm` package
- Runs entirely in the browser
- Uses OPFS (Origin Private File System) for persistence
- Web Worker for non-blocking queries
- Tables:
  - `chapters` - Study content
  - `user_answers` - User responses to questions
  - `progress` - Reading progress tracking
  - `user_profile` - User information

## Authentication

### **Kinde Auth** (Current)
- `@kinde-oss/kinde-auth-react`
- OAuth providers: Google, Facebook, Apple
- Email authentication
- Session management

**Note**: May migrate to Supabase Auth for better OAuth UX

## UI & Styling

### **CSS-in-JS**
- Scoped styles in components
- CSS custom properties (variables)
- Glassmorphism design system

### **Framer Motion**
- Smooth page transitions
- Component animations
- Gesture support

### **Lucide React**
- Modern icon library
- Tree-shakeable
- Consistent design

## PWA Features

### **Vite PWA Plugin**
- Service worker generation
- Offline support
- App manifest
- Install prompts
- Background sync

## Development Tools

### **ESLint**
- Code quality checks
- React best practices
- TypeScript rules

### **TypeScript ESLint**
- Type-aware linting
- Enhanced error detection

## Package Manager

### **npm**
- Standard package management
- Lock file for reproducible builds

## Version Control

### **Git**
- Version history
- Branching strategy
- Currently on `main` branch

## Browser Targets

- Modern browsers (ES2020+)
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS/Android)

## Special Configurations

### WASM Support
- Custom MIME type handling for `.wasm` files
- CORS headers for SharedArrayBuffer:
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Embedder-Policy: credentialless`

### Web Worker
- SQLite operations run in worker thread
- Non-blocking UI
- Message-based communication
