# Eventos Finais - Project Overview

## What is This Project?

**Eventos Finais** (Final Events) is a Progressive Web Application (PWA) designed as an interactive Bible study platform. The app focuses on the book "Eventos Finais" which covers biblical teachings about end-times events.

## Core Purpose

- Provide offline-first access to 20 chapters of biblical study content
- Enable users to track reading progress
- Support audio playback for each chapter
- Include interactive study questions
- Sync user progress across devices

## Target Audience

Portuguese-speaking Christians interested in studying biblical prophecy and end-times events.

## Key Features

### 1. **Offline-First Architecture**
- All content accessible without internet
- Local SQLite database for data persistence
- Service worker for offline functionality

### 2. **Authentication**
- Currently using Kinde for OAuth (Google, Facebook, Apple)
- Email authentication support
- Session management with local sync

### 3. **Content Management**
- 20 chapters of study material
- Audio narration for each chapter
- Study questions with local answer storage
- Reading progress tracking

### 4. **User Experience**
- Modern glassmorphism design
- Smooth animations with Framer Motion
- Responsive mobile-first layout
- PWA installable on devices

## Technical Philosophy

- **Client-Side First**: All data lives locally in SQLite (WASM)
- **Privacy-Focused**: Minimal server dependencies
- **Performance**: Fast loading, smooth interactions
- **Accessibility**: Works on all devices, offline capable

## Project Status

Currently in active development. Authentication migration in progress from Clerk to Kinde (with potential future migration to Supabase for better OAuth UX).
