# UniHive

### Campus Community Platform

A private digital platform exclusively for **SSN College of Engineering** and **Shiv Nadar University Chennai** students. Find lost items. Borrow essentials. Build campus trust.

## What It Does

**Lost & Found Hub**: Post lost or found items with photos, browse by category, claim items through private messaging.

**Peer Exchange**: Request to borrow or offer to lend items with duration, trust scores, and ratings.

**Private Messaging**: Real-time chat linked to the specific post that started the conversation. Full read receipts and unread counts.


## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (Vite), React Router v6 |
| Styling | Vanilla CSS, custom design system |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| Authentication | Microsoft OAuth (Azure AD) + Email/Password |
| Real-time | Supabase Realtime (WebSocket subscriptions) |
| Deployment | Vercel (CDN, SPA rewrites) |

## Local Development

### Prerequisites
- Node.js 18+
- A Supabase project

### Setup

1. Clone and install:
   npm install

2. Create .env.local:
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here

3. Run supabase_schema.sql in the Supabase SQL Editor.

4. Start dev server:
   npm run dev

## Access Restriction

Only @ssn.edu.in and @snuchennai.edu.in email addresses can register.
- Microsoft OAuth: Enforced at the Azure AD identity provider level
- Email/Password: Domain validated before signup in src/lib/supabase.js



## Module Status

| # | Module | Status |
|---|--------|--------|
| 1 | Auth & Setup | Complete |
| 2 | User Profiles | Complete |
| 3 | Lost & Found | Complete |
| 4 | Peer Exchange | Complete |
| 5 | Private Chat | Complete |
| 6 | Ratings & Reputation | Complete |
| 7 | Production Polish | Complete |


