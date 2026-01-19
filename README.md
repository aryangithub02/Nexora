# NEXORA

> **A human-first social media platform for short-form video discovery with privacy-aware networking.**

Nexora reimagines social connection by blending the addictive nature of short-form video with meaningful, privacy-centric social controls. It is designed to be a "digital living room" where creation and connection happen on your terms, prioritizing signal over noise and agency over algorithms.

## 📱 Demo & Screenshots

> **Live Demo**: [Coming Soon]

| Feed | User Profile |
|:---:|:---:|
| <div style="width: 300px; height: 150px; background: #222; display: flex; align-items: center; justify-content: center; color: #888;">Add Feed Screenshot</div> | <div style="width: 300px; height: 150px; background: #222; display: flex; align-items: center; justify-content: center; color: #888;">Add Profile Screenshot</div> |

| Notification Center | Privacy Settings |
|:---:|:---:|
| <div style="width: 300px; height: 150px; background: #222; display: flex; align-items: center; justify-content: center; color: #888;">Add Notifications Screenshot</div> | <div style="width: 300px; height: 150px; background: #222; display: flex; align-items: center; justify-content: center; color: #888;">Add Settings Screenshot</div> |

## 📑 Table of Contents

- [Product Philosophy / Vision](#product-philosophy--vision)
- [Features Overview](#features-overview)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Database Schema Summary](#database-schema-summary)
- [Authentication & Authorization](#authentication--authorization)
- [Privacy & Security Model](#privacy--security-model)
- [Notification System](#notification-system)
- [Performance Considerations](#performance-considerations)
- [Environment Variables](#environment-variables)
- [Local Development Setup](#local-development-setup)
- [Deployment Guide](#deployment-guide)
- [Known Limitations](#known-limitations--trade-offs)
- [Roadmap](#roadmap--future-improvements)

## 👁️ Product Philosophy / Vision

Nexora was built to solve the "empty calories" problem of modern social media. While other platforms optimize purely for retention, Nexora optimizes for **context**.

*   **Human-First Design**: The UI is designed to breathe. Dark mode is default, motion is purposeful, and controls are placed within thumb's reach without cluttering the content.
*   **Privacy-Aware Networking**: Social graphs shouldn't always be public. Nexora treats privacy as a first-class feature, not a setting buried 10 menus deep.
*   **Signal Over Noise**: Notifications are batched and protected. The "Live Radar" feature shows you who is actually online and relevant, rather than spamming you with phantom engagement.

## 🚀 Features Overview

### Core Features

*   **🔐 Authentication**: Secure email/password login and registration with NextAuth.js.
*   **📹 Reels Feed**: Infinite-scroll short-form video feed with seamless auto-play and audio normalization.
*   **❤️ Interaction Suite**: Like, comment, share, and bookmark videos.
*   **👥 Follow System**: Follow users to see their content in your "Following" feed.

### Advanced Features

*   **🛡️ Follow Approvals**: Option to require approval for new followers (Private Account mode).
*   **👁️ Privacy Controls**: Granular control over who can comment (Everyone, Followers, No One) and mention you.
*   **🔔 Real-time Notifications**: Smart alerts for interactions, grouped to prevent spam.
*   **🧠 Memory Bookmarks**: Bookmarks track "revisit count", sorting saved videos by how often you return to them (Memory vs. Recent).
*   **🎨 Dynamic Appearance**: Glassmorphism UI with fluid animations.
*   **⏸️ Session Security**: Robust session logging and ability to revoke active sessions from settings.

## 🛠️ Tech Stack

### Frontend
*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
*   **State Management**: React Context API
*   **Authentication**: [NextAuth.js](https://next-auth.js.org/)

### Backend
*   **API**: Next.js Server Actions & API Routes
*   **Database**: [MongoDB](https://www.mongodb.com/) (Atlas)
*   **ORM**: [Mongoose](https://mongoosejs.com/)
*   **Session**: JWT-based stateless sessions

### Media & Real-time
*   **Video Delivery**: ImageKit (CDN & Transformation)
*   **Uploads**: UploadThing / ImageKit direct upload
*   **Real-time**: Socket.IO (Custom Express server integrated with Next.js)

### Deployment
*   **Platform**: [Vercel](https://vercel.com)
*   **Infrastructure**: Serverless Functions

## 🏗️ Architecture Overview

The system is designed as a **serverless-first monorepo**.

1.  **Client Application**: React components fetch data via internal API proxies. The `Feed` component uses a virtualization strategy to handle infinite scrolling efficiently.
2.  **API Layer**: Next.js Route Handlers (`app/api/*`) act as the backend interface. They handle validation, authorization check, and DB interaction.
3.  **Authentication**: NextAuth handles the session flow. On login, a JWT is issued. Critical actions verify `tokenVersion` against the database to allow immediate invalidation of compromised accounts.
4.  **Media Flow**:
    *   **Upload**: Client requests a signed URL -> Uploads directly to CDN (ImageKit) -> CDN returns URL -> Client saves metadata to MongoDB.
    *   **Playback**: Videos are streamed directly from the global CDN nodes to the user's browser.
5.  **Notifications**: A separate Socket.IO service runs alongside the Next.js server to push "toasts" for live events (likes, follows), while the database stores persistent notification history.

## 💾 Database Schema Summary

The database uses a normalized document structure for flexibility.

*   **Users**: Identity, auth credentials, and global settings.
*   **Profiles**: Public-facing data (username, avatar, bio).
*   **Videos**: Metadata for reels including CDN URLs, aspect ratio, and audio stats.
*   **Follows**: Adjacency table for the social graph (`followerId` -> `followingId`).
*   **Likes/Comments/Shares**: Interaction records linking Users to Videos.
*   **Notifications**: Activity log for users (`type`, `actor`, `recipient`, `read`).
*   **Bookmarks**: Stores saved videos with metadata for "Memory" sorting (frequency of access).

_(See `DATABASE_STRUCTURE.md` for full field-level details)_

## 🔐 Authentication & Authorization

*   **Strategy**: We use `NextAuth.js` with the `CredentialsProvider`.
*   **Session Management**: JSON Web Tokens (JWT) are stored in HTTP-only cookies.
*   **Token Versioning**: The `User` model contains a `tokenVersion` integer. This is embedded in the JWT. If a user resets their password or logs out of all devices, `tokenVersion` is incremented in the DB, instantly invalidating all old tokens.
*   **2FA (Two-Factor Authentication)**: Configurable OTP-based second factor using `otplib` for enhanced account security.

## 🛡️ Privacy & Security Model

Nexora goes beyond standard "Private Profile" toggles:

1.  **Follow Approval Workflow**: In private mode, follow actions create a "Request". Examples must be explicitly approved via the Notification center before access is granted.
2.  **Granular Permissions**:
    *   **Comment Permission**: Can be restricted to "Followers Only" or "Nobody".
    *   **Mention Permission**: Controls who can tag you in other content.
3.  **Soft Deletion**: Account deletion uses a `deletedAt` flag (Soft Delete) for a 30-day grace period before permanent erasure (GDPR compliance).

## 🔔 Notification System

The notification engine is hybrid:

*   **Persistent**: All events are stored in MongoDB in the `notifications` collection.
*   **Real-time**: Socket.IO pushes ephemeral toasts when the user is online.
*   **Batching**: "User X and 4 others liked your reel" logic prevents notification fatigue.
*   **Polling Fallback**: If the socket connection drops, the client intelligently polls for unread counts on navigation.

## ⚡ Performance Considerations

*   **Thumbnail-First Rendering**: The Feed loads a lightweight blurhash/thumbnail poster before attempting to buffer video.
*   **View Port Observation**: Videos efficiently pause when scrolled out of view to save bandwidth and battery.
*   **LCP Optimization**: Critical UI paths (sidebar, navigation) are statically rendered where possible.
*   **Optimistic UI**: Like and Follow actions update the UI immediately while the API request processes in the background.

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=mongodb+srv://...

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_super_secret_key

# ImageKit (Media Delivery)
IMAGEKIT_PUBLIC_KEY=...
IMAGEKIT_PRIVATE_KEY=...
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

# UploadThing (Backup Uploads)
UPLOADTHING_SECRET=...
UPLOADTHING_APP_ID=...
```

## 💻 Local Development Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/nexora.git
    cd socialmediaapp
    ```
2.  **Install dependencies** (Node.js 18+ required):
    ```bash
    npm install
    ```
3.  **Setup Environment**:
    Copy `.env.example` to `.env` and fill in your credentials.
4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## ☁️ Deployment Guide

**Vercel** is the recommended deployment platform.

1.  Push code to GitHub.
2.  Import project into Vercel.
3.  Add all environment variables in the Vercel Dashboard.
4.  **Important**: Ensure `NEXTAUTH_URL` is set to your production domain (e.g., `https://nexora.app`).
5.  Deploy.

*Note: For the custom Socket.IO server to work on Vercel, you may need to separate the socket service or use a managed WebSocket provider like Pusher, as Vercel Serverless Functions have execution time limits.*

## ⚠️ Known Limitations / Trade-offs

*   **Socket.IO on Serverless**: The current custom server setup (`server.ts`) works best on a VPS (DigitalOcean/Heroku) or a persistent container (Railway/Render). On Vercel, real-time features may require a dedicated WebSocket service.
*   **Video Transcoding**: Currently relies on client-side uploads. Large files (>100MB) might be slow without a server-side transcoding queue.

## 🗺️ Roadmap / Future Improvements

*   [ ] **Direct Messaging**: Private encrypted chat between followers.
*   [ ] **Algorithm**: Move from chronological feed to an interest-graph based recommendation engine.
*   [ ] **Live Streaming**: Support for RTMP ingestion for live broadcasts.
*   [ ] **Monetization**: "Super Likes" and Creator Tipping.

## 📂 Folder Structure

```
.
├── app/                  # Next.js App Router (Pages & API)
│   ├── api/              # Backend API Routes
│   ├── components/       # React UI Components
│   └── context/          # Global State (Auth, Notifications)
├── lib/                  # Utility functions (DB, Auth helper)
├── models/               # Mongoose Database Models
├── public/               # Static assets
└── types/                # TypeScript definitions
```

## 📝 License

This project is licensed under the **MIT License**.
