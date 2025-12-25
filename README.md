# Moshcast Web

React frontend for Moshcast - Your Music. Your Library. Everywhere.

## Tech Stack

- React 18 + Vite
- Tailwind CSS (dark Spotify-style theme)
- React Router
- Howler.js (audio playback)
- Lucide React (icons)

## Setup

```bash
npm install
npm run dev
```

## Environment

Backend API: `https://moshcast-production.up.railway.app`

No `.env` required - API URL is hardcoded for now.

## Deployment

Deployed on Vercel. Auto-deploys on push to `main`.

## Features

- [x] Auth (login/signup)
- [x] Library view (all songs)
- [x] Persistent player bar
- [x] Upload (drag & drop)
- [x] Playback controls (play/pause, next/prev, shuffle, repeat)
- [x] Volume control
- [x] Progress seeking

## Project Structure

```
src/
├── components/     # Reusable UI components
├── context/        # React context (Auth, Player)
├── hooks/          # Custom hooks
├── pages/          # Route pages
└── utils/          # API client, formatters
```
