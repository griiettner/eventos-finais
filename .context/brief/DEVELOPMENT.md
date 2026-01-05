# Development Guide

## Getting Started

### Prerequisites

- **Node.js**: v18+ (v20+ recommended)
- **npm**: v9+ (comes with Node.js)
- **Git**: For version control
- **Modern Browser**: Chrome/Edge 90+, Firefox 88+, or Safari 14+

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd eventos-finais

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Kinde credentials

# Start development server
npm run dev
```

### Environment Variables

Required variables in `.env`:

```env
VITE_KINDE_DOMAIN=https://yourapp.kinde.com
VITE_KINDE_CLIENT_ID=your_client_id
VITE_KINDE_REDIRECT_URL=http://localhost:5173/dashboard
VITE_KINDE_LOGOUT_URL=http://localhost:5173/login
VITE_KINDE_APPLE_CONNECTION_ID=conn_xxx
VITE_KINDE_FACEBOOK_CONNECTION_ID=conn_xxx
VITE_KINDE_GOOGLE_CONNECTION_ID=conn_xxx
```

## Development Workflow

### Running the App

```bash
# Development server (with HMR)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Project Structure

```
eventos-finais/
├── .context/          # Project documentation
├── dist/              # Production build output
├── node_modules/      # Dependencies
├── public/            # Static assets
├── src/
│   ├── components/    # Reusable components
│   ├── contexts/      # React contexts
│   ├── data/          # Static data
│   ├── db/            # Database layer
│   ├── hooks/         # Custom hooks
│   ├── pages/         # Page components
│   ├── App.tsx        # Root component
│   ├── main.tsx       # Entry point
│   └── index.css      # Global styles
├── .env               # Environment variables (not in git)
├── .gitignore
├── package.json
├── tsconfig.json      # TypeScript config
└── vite.config.ts     # Vite config
```

## Coding Standards

### TypeScript

- Use TypeScript for all new files
- Define interfaces for all props and data structures
- Avoid `any` type - use `unknown` if type is truly unknown
- Use type inference where obvious

```typescript
// ✅ Good
interface UserProfile {
  username: string;
  email: string;
}

const user: UserProfile = { username: 'John', email: 'john@example.com' };

// ❌ Bad
const user: any = { username: 'John', email: 'john@example.com' };
```

### React Components

- Use function components with hooks
- Keep components under 200 lines
- Extract reusable logic into custom hooks
- Use meaningful component and prop names

```typescript
// ✅ Good
interface ChapterCardProps {
  title: string;
  isRead: boolean;
  onRead: () => void;
}

const ChapterCard: React.FC<ChapterCardProps> = ({ title, isRead, onRead }) => {
  // Component logic
};
```

### Styling

- Use scoped styles in `<style>` tags within components
- Use CSS custom properties for theming
- Follow BEM-like naming for classes
- Keep styles near the component they affect

```typescript
// ✅ Good
<style>{`
  .chapter-card {
    padding: 1rem;
    border-radius: 12px;
  }
  .chapter-card__title {
    font-size: 1.2rem;
  }
`}</style>
```

### Database Operations

- Always use DBService facade
- Never access Web Worker directly
- Handle errors gracefully
- Use async/await, not promises

```typescript
// ✅ Good
try {
  await DBService.exec('INSERT INTO progress (chapter_id, is_read) VALUES (?, ?)', [1, 1]);
} catch (error) {
  console.error('Failed to update progress:', error);
}

// ❌ Bad
DBService.exec('INSERT INTO progress (chapter_id, is_read) VALUES (?, ?)', [1, 1])
  .then(() => {})
  .catch(() => {});
```

## Common Tasks

### Adding a New Page

1. Create component in `src/pages/`
2. Add route in `App.tsx`
3. Add navigation if needed
4. Test routing

```typescript
// src/pages/NewPage.tsx
const NewPage: React.FC = () => {
  return <div>New Page</div>;
};

export default NewPage;

// src/App.tsx
<Route path="/new" element={<NewPage />} />
```

### Adding a Database Table

1. Update schema in `db-worker.ts`
2. Add types in TypeScript
3. Add helper methods in `db-service.ts` if needed
4. Test queries

```typescript
// In db-worker.ts
db.exec(`
  CREATE TABLE IF NOT EXISTS new_table (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
  );
`);
```

### Adding a New Feature

1. Check if similar code exists
2. Plan the implementation
3. Update relevant components
4. Test thoroughly
5. Update documentation

## Debugging

### Browser DevTools

- **Console**: Check for errors and logs
- **Network**: Monitor API calls and assets
- **Application**: 
  - Check OPFS for SQLite file
  - View service worker status
  - Check localStorage

### Database Debugging

```typescript
// In browser console
DBService.getAll('SELECT * FROM user_profile').then(console.log);
```

### Common Issues

**Issue**: "Database not initialized"
- **Solution**: Check if Web Worker is loaded, check console for errors

**Issue**: OAuth redirect not working
- **Solution**: Check callback URLs in Kinde dashboard, verify .env variables

**Issue**: PWA not updating
- **Solution**: Unregister service worker, clear cache, reload

## Testing

### Manual Testing Checklist

- [ ] Login with email
- [ ] Login with Google
- [ ] Login with Facebook  
- [ ] Login with Apple (on Mac/iOS)
- [ ] View dashboard
- [ ] View chapter details
- [ ] Mark chapter as complete
- [ ] Logout
- [ ] Test offline mode
- [ ] Test PWA installation

### Browser Testing

Test on:
- Chrome (desktop & mobile)
- Firefox
- Safari (desktop & iOS)
- Edge

## Performance

### Monitoring

- Use React DevTools Profiler
- Check Lighthouse scores
- Monitor bundle size
- Watch for memory leaks

### Optimization Tips

- Lazy load components
- Memoize expensive computations
- Debounce user input
- Use Web Worker for heavy tasks
- Optimize images

## Deployment

### Build Process

```bash
# Create production build
npm run build

# Output in dist/ directory
```

### Hosting

Static hosting recommended:
- **Vercel** (recommended)
- **Netlify**
- **GitHub Pages**
- **Cloudflare Pages**

### Environment-Specific Configs

Update `.env` for production:
- Change `localhost` URLs to production domain
- Use production Kinde credentials
- Enable analytics if configured

## Troubleshooting

### Build Errors

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Type Errors

```bash
# Check TypeScript errors
npx tsc --noEmit
```

### Dependency Issues

```bash
# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

## Git Workflow

### Commit Messages

Use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Tests
- `chore:` Maintenance

```bash
# Examples
git commit -m "feat: add chapter search"
git commit -m "fix: resolve OAuth redirect issue"
git commit -m "docs: update setup instructions"
```

### Branching Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `fix/*` - Bug fixes

## Resources

### Documentation
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Kinde Docs](https://docs.kinde.com)

### Community
- GitHub Issues for bug reports
- Discussions for questions
- Pull requests for contributions

## Need Help?

1. Check this documentation
2. Search existing issues
3. Ask in discussions
4. Create new issue with details
