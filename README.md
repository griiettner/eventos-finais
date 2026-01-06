# Eventos Finais

A web application for studying biblical end-times events with interactive chapters, audio content, and reflection questions.

## Features

- 📖 **Chapter-based learning** - Structured content about biblical prophecy and end times
- 🎵 **Audio narration** - Listen to chapters with high-quality audio
- ❓ **Reflection questions** - Interactive study questions for each chapter
- 👤 **User authentication** - Secure login with Kinde Auth
- 📊 **Progress tracking** - Track your study progress across chapters
- 👨‍💼 **Admin dashboard** - Manage chapters, content, and questions

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** (Rolldown) for blazing fast builds
- **Framer Motion** for smooth animations
- **Kinde Auth** for authentication
- **Firebase SDK** for client-side database access

### Backend API
- **Node.js** with Express.js
- **Firebase Admin SDK** for server-side operations
- **Firestore** for database
- **JWT validation** with Kinde
- **Multer** for audio file uploads

### Deployment
- **Coolify** for containerized deployment
- **Docker** multi-stage builds (separate frontend/API containers)
- **Nginx** serving frontend on port 8002
- **Express API** running on port 3001

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run API server
npm run server:api:dev

# Run both frontend and API
npm run dev:full

# Build for production
npm run build
```

## Environment Variables

Required environment variables:

```env
# Kinde Authentication
VITE_KINDE_DOMAIN=your-domain.kinde.com
VITE_KINDE_CLIENT_ID=your-client-id
VITE_KINDE_REDIRECT_URL=http://localhost:5173/dashboard
VITE_KINDE_LOGOUT_URL=http://localhost:5173/login

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@email.com
FIREBASE_PRIVATE_KEY=your-private-key

# API
VITE_API_URL=http://localhost:3001
PORT=3001
```

Author @griiettner
