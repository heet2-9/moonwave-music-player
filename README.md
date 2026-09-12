# MOONWAVE Music Player

A dark cinematic, glassmorphic music player built with Next.js, Tailwind CSS, Zustand, and HTML5 Audio Engine.

---

## 📻 Together Room (Real-time Dual Listening)

The **Together Room** feature allows two listeners (e.g. Heet & Aaru) to join a private room (`/together`) and listen to the same song with clock-synchronized real-time playback.

### Key Architecture Details
- **100% Local Audio**: Audio files are **NEVER** uploaded to any backend. Each client device plays local/public MP3 files independently.
- **Metadata Only Transmitted**: Only `songId`, `position`, `isPlaying`, `playbackStartedAt`, `queueIndex`, and reaction events are synchronized.
- **Zero Double Audio Engine**: Integrates directly with the single existing `AudioEngine` (`src/lib/audioEngine.ts`) and `usePlayerStore`.

---

## 🛠️ Supabase Realtime Setup Guide

### 1. Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create a free project.
2. Under **Project Settings** → **API**, locate your:
   - **Project URL** (`https://xxxx.supabase.co`)
   - **Publishable / Anon key**

### 2. Enable Realtime
In your Supabase Dashboard:
1. Go to **Project Settings** → **Realtime**.
2. Ensure **Broadcast** and **Presence** are enabled (enabled by default for channels).

### 3. Set Environment Variables
Create `.env.local` in the root of your project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key-here
```

### 4. Vercel Deployment
When deploying to Vercel:
1. Go to your Vercel Project Settings → **Environment Variables**.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

---

## 🧪 Local Testing & Fallback Mode

- **Development Fallback**: If Supabase environment variables are missing, Together Room uses a `BroadcastChannel` fallback.
- **Note on Fallback**: `BroadcastChannel` is intended for **same-browser / same-device testing across two tabs**. For real multi-device synchronization over the internet between two different phones or computers, Supabase Realtime credentials must be set.
