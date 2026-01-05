# Project Roadmap

## Current Status

**Phase**: MVP Development
**Version**: 0.0.0 (Pre-release)
**Last Updated**: January 2026

## Completed Features ✅

### Core Infrastructure
- [x] React + TypeScript + Vite setup
- [x] SQLite WASM integration
- [x] Web Worker for database operations
- [x] PWA configuration
- [x] Offline-first architecture

### Authentication
- [x] Kinde integration
- [x] OAuth setup (Google, Facebook, Apple)
- [x] Email authentication
- [x] Protected routes
- [x] Session management
- [x] Local user profile sync

### UI/UX
- [x] Landing page
- [x] Login page with OAuth buttons
- [x] Dashboard with chapter list
- [x] Glassmorphism design system
- [x] Responsive layout
- [x] Smooth animations (Framer Motion)
- [x] Loading states
- [x] Sync status indicator

### Data Management
- [x] SQLite schema (chapters, progress, answers, user_profile)
- [x] Reading progress tracking
- [x] Offline data storage
- [x] Database initialization

## In Progress 🚧

### Authentication Issues
- [ ] Fix OAuth direct redirect (bypassing Kinde's intermediate screen)
  - **Status**: Investigating alternatives (Supabase Auth)
  - **Blocker**: Kinde's OAuth flow requires intermediate screen

### Content
- [ ] Add full content for all 20 chapters
  - **Status**: Currently 3/20 chapters have real content
  - **Next**: Content writing/import needed

## Short-Term Goals (Next 2-4 Weeks)

### 1. Authentication Resolution
- [ ] Decide between:
  - Option A: Accept Kinde's intermediate screen
  - Option B: Migrate to Supabase Auth
  - Option C: Implement custom OAuth flow
- [ ] Complete authentication flow end-to-end
- [ ] Test all OAuth providers

### 2. Content Completion
- [ ] Import/write remaining 17 chapters
- [ ] Add placeholder audio files
- [ ] Add study questions for each chapter
- [ ] Content review and proofreading

### 3. Chapter Detail Page
- [ ] Build ChapterDetail component
- [ ] Add audio player
- [ ] Add study questions UI
- [ ] Add answer submission
- [ ] Add progress tracking UI

### 4. Testing
- [ ] Manual testing of all flows
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] Offline functionality testing

## Medium-Term Goals (1-3 Months)

### 1. Enhanced Features
- [ ] Audio playback controls
  - [ ] Play/pause
  - [ ] Progress tracking
  - [ ] Playback speed
  - [ ] Auto-continue to next chapter
- [ ] Search functionality
- [ ] Bookmarks/highlights
- [ ] Notes system
- [ ] Share chapter feature

### 2. User Experience
- [ ] Onboarding tutorial
- [ ] User preferences/settings
- [ ] Theme customization
- [ ] Font size adjustment
- [ ] Dark mode optimization

### 3. Data Sync
- [ ] Backend API (optional)
- [ ] Cross-device sync
- [ ] Conflict resolution
- [ ] Backup/restore functionality

### 4. Analytics
- [ ] Reading analytics
- [ ] Completion tracking
- [ ] Time spent per chapter
- [ ] User engagement metrics

## Long-Term Goals (3-6 Months)

### 1. Community Features
- [ ] User comments/discussions
- [ ] Share insights
- [ ] Study groups
- [ ] Group reading plans

### 2. Content Expansion
- [ ] Additional study materials
- [ ] Related articles
- [ ] External resources links
- [ ] Video content integration

### 3. Advanced Features
- [ ] AI-powered Q&A assistant
- [ ] Personalized study recommendations
- [ ] Scripture cross-references
- [ ] Multi-language support (Spanish, English)

### 4. Platform Expansion
- [ ] Native mobile apps (React Native)
- [ ] Desktop app (Electron/Tauri)
- [ ] Web widgets
- [ ] API for third-party integrations

## Technical Debt & Improvements

### High Priority
- [ ] Add comprehensive error handling
- [ ] Implement proper logging
- [ ] Add performance monitoring
- [ ] Security audit
- [ ] Accessibility improvements (WCAG 2.1)

### Medium Priority
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Add E2E tests
- [ ] Set up CI/CD pipeline
- [ ] Code documentation
- [ ] Refactor large components

### Low Priority
- [ ] Code splitting optimization
- [ ] Bundle size reduction
- [ ] SEO optimization
- [ ] Internationalization framework
- [ ] Advanced PWA features (push notifications)

## Known Issues & Blockers

### Critical
- OAuth flow requires Kinde intermediate screen (UX issue)
  - **Impact**: Frustrating user experience
  - **Solution**: Considering migration to Supabase

### High
- Content incomplete (17 chapters need content)
  - **Impact**: App not fully usable
  - **Solution**: Content writing in progress

### Medium
- No backend sync (data locked to device)
  - **Impact**: No cross-device access
  - **Solution**: Backend API on roadmap

### Low
- ChapterDetail page not implemented
  - **Impact**: Can't read chapters yet
  - **Solution**: Next sprint

## Success Metrics

### Phase 1 (MVP)
- [ ] All 20 chapters with content
- [ ] 100% auth flow working
- [ ] Fully functional offline
- [ ] PWA installable
- [ ] Mobile responsive

### Phase 2 (Beta)
- [ ] 100 active users
- [ ] Average 15+ minutes per session
- [ ] 70%+ chapter completion rate
- [ ] < 1% error rate

### Phase 3 (Launch)
- [ ] 1,000+ active users
- [ ] 4.5+ star rating
- [ ] Available in app stores
- [ ] Cross-device sync working
- [ ] Community engagement active

## Release Plan

### v0.1.0 - MVP (Target: February 2026)
- Complete authentication
- All content added
- Basic reading experience
- PWA functional

### v0.5.0 - Beta (Target: March 2026)
- Enhanced features
- Backend sync
- User testing feedback
- Bug fixes

### v1.0.0 - Public Launch (Target: April 2026)
- Production-ready
- Tested and stable
- Marketing ready
- App store submission

## Dependencies & Risks

### External Dependencies
- Kinde/Supabase availability
- Audio hosting solution
- Content delivery
- Browser WASM support

### Risks
- Auth provider changes
- Browser compatibility issues
- OPFS support limitations
- Content copyright issues

## Resources Needed

### Development
- Developer time (primary resource)
- Testing devices (iOS/Android)
- Audio recording equipment
- Content writers

### Infrastructure
- Domain registration
- Hosting (static files)
- CDN for audio files
- Backend API hosting (future)

### Marketing
- Social media presence
- Community building
- Content marketing
- User acquisition strategy
