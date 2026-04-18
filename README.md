# 🏡 Society Connect — Panchayat-Style Community App

A full-stack MERN web application with **strict multi-tenant (multi-society) architecture**.
Each society is a completely isolated private space with its own feed, chat, and members.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 Multi-tenant isolation | Every API, post, comment and message is scoped to `societyId` |
| 🏘️ Society management | Create or join via invite code; admin controls |
| 📋 Community feed | Help requests 🆘 · Announcements 📢 · Suggestions 💡 |
| 💬 Real-time group chat | Socket.IO rooms per society — complete isolation |
| 🔒 JWT authentication | Secure tokens; bcrypt password hashing |
| ⚙️ Admin controls | Pin posts · Remove members · Refresh invite code |
| 📱 Responsive UI | Mobile-first Tailwind CSS design |

---

## 🏗️ Project Structure

```
society-connect/
├── backend/
│   ├── models/
│   │   ├── User.js          # name, email, password, role, societyId
│   │   ├── Society.js       # name, inviteCode, createdBy, members[]
│   │   ├── Post.js          # title, description, type, societyId (indexed)
│   │   ├── Comment.js       # text, postId, societyId, userId
│   │   └── Message.js       # text, societyId, chatType (group/private)
│   ├── routes/
│   │   ├── authRoutes.js    # signup, login, /me, profile update
│   │   ├── societyRoutes.js # create, join, members, refresh-code, remove
│   │   ├── postRoutes.js    # CRUD + like, pin, resolve
│   │   ├── commentRoutes.js # add, list, delete (society-scoped)
│   │   └── messageRoutes.js # group chat history
│   ├── middleware/
│   │   └── authMiddleware.js # verifyJWT, verifySocietyAccess, verifyAdmin
│   ├── socket/
│   │   └── socketHandlers.js # JWT auth, society rooms, typing indicators
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── PostCard.jsx
    │   │   ├── CreatePostModal.jsx
    │   │   ├── CommentSection.jsx
    │   │   └── ChatBox.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── CreateJoinSociety.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── PostDetail.jsx
    │   │   ├── Chat.jsx
    │   │   ├── Members.jsx
    │   │   └── Profile.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx   # global user/token state
    │   ├── utils/
    │   │   ├── api.js            # axios with JWT interceptor
    │   │   ├── socket.js         # Socket.IO singleton
    │   │   └── helpers.js        # timeAgo, getInitials, POST_TYPE_META, etc.
    │   ├── App.jsx               # React Router + route guards
    │   ├── main.jsx
    │   └── index.css             # Tailwind + custom component styles
    ├── index.html
    ├── tailwind.config.js
    ├── postcss.config.js
    └── vite.config.js
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

---

### 1. Clone & Install

```bash
# Backend
cd society-connect/backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### 2. Configure Environment

```bash
# In /backend — copy the example and fill in your values
cp .env.example .env
```

Edit `backend/.env`:

```env
MONGO_URI=mongodb://localhost:27017/society-connect
JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_URL=http://localhost:5173
```

> **MongoDB Atlas**: Replace `MONGO_URI` with your Atlas connection string.

---

### 3. Run the App

Open **two terminals**:

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open your browser at: **http://localhost:5173**

---

## 🔑 User Flow

```
Sign Up
  │
  ▼
Create Society  ──── becomes Admin ──── gets Invite Code
  OR
Join Society    ──── enter Invite Code ─── becomes Member
  │
  ▼
Dashboard (feed)
  ├── Create posts (Help / Announcement / Suggestion)
  ├── Comment & Like
  ├── Admin: Pin posts, Remove members, Refresh invite code
  └── Chat (real-time group chat)
```

---

## 🛡️ Multi-Tenant Security

Every piece of data is isolated by `societyId`:

| Layer | How isolation is enforced |
|---|---|
| **JWT Token** | `societyId` is fetched fresh from DB on every request |
| **Middleware** | `verifySocietyAccess` blocks users without a society |
| **All API queries** | `.find({ societyId: req.user.societyId })` — not from request body |
| **Socket.IO rooms** | Each society = its own room; messages never cross rooms |
| **Mongoose indexes** | Compound indexes on `{ societyId, createdAt }` for performance |

Even if a user manually crafts a request with another society's ID, the backend ignores it and always uses the ID from the verified JWT.

---

## 📡 API Reference

### Auth — `/api/auth`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Register new user |
| POST | `/login` | Login, returns JWT |
| GET | `/me` | Get current user profile |
| PUT | `/profile` | Update name / bio |

### Societies — `/api/societies`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/create` | ✅ | Create society (becomes admin) |
| POST | `/join` | ✅ | Join via invite code |
| GET | `/mine` | ✅ + society | Get own society info |
| GET | `/members` | ✅ + society | List all members |
| POST | `/refresh-code` | ✅ + admin | Regenerate invite code |
| DELETE | `/members/:userId` | ✅ + admin | Remove a member |

### Posts — `/api/posts`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | All posts for society (filter by type) |
| POST | `/` | Create post |
| GET | `/:id` | Get single post |
| PUT | `/:id` | Edit post (author only) |
| DELETE | `/:id` | Delete (author or admin) |
| PUT | `/:id/like` | Toggle like |
| PUT | `/:id/pin` | Toggle pin (admin) |
| PUT | `/:id/resolve` | Toggle resolved (help posts) |

### Comments — `/api/comments`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:postId` | Get comments for post |
| POST | `/:postId` | Add comment |
| DELETE | `/:id` | Delete comment |

### Messages — `/api/messages`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/group` | Last 60 group chat messages |
| POST | `/group` | Send a group message |

---

## ⚡ Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `sendGroupMessage` | `{ text }` | Send a group chat message |
| `typing` | — | Broadcast typing indicator |
| `stopTyping` | — | Stop typing indicator |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `newGroupMessage` | Message object | New group chat message |
| `newPost` | Post object | New post in society |
| `postDeleted` | `{ postId }` | Post was removed |
| `newComment` | `{ postId, comment }` | New comment on a post |
| `userTyping` | `{ userId, name }` | Someone is typing |
| `userStoppedTyping` | `{ userId }` | Stopped typing |
| `memberOnline` | `{ userId, name }` | Member joined the chat room |
| `memberOffline` | `{ userId, name }` | Member disconnected |

---

## 🧪 Testing the Multi-Tenant Isolation

1. Create **User A** → Create **Society Alpha** → note invite code
2. Create **User B** → Create **Society Beta** → note invite code
3. Create **User C** → Join **Society Alpha** with code
4. Post as User A in Alpha — User B in Beta **cannot see it**
5. Chat in Alpha — messages never appear in Beta's chat

---

## 🔧 Production Deployment Tips

```bash
# Build frontend
cd frontend && npm run build

# Serve static files from backend
# Add to server.js:
# app.use(express.static(path.join(__dirname, '../frontend/dist')))
# app.get('*', (_, res) => res.sendFile(path.join(__dirname, '../frontend/dist/index.html')))
```

**Environment variables for production:**
- Set `JWT_SECRET` to a 64+ character random string
- Set `CLIENT_URL` to your production domain
- Use MongoDB Atlas for the database
- Consider Redis for Socket.IO in multi-server deployments

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + React Router 6 |
| Styling | Tailwind CSS 3 (custom theme) |
| Backend | Node.js + Express 4 |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Realtime | Socket.IO 4 |
| HTTP Client | Axios |
| Toast notifications | react-hot-toast |
