# Second Brain — Full-Stack Knowledge Management Hub

A modern personal knowledge management application to save, organize, filter, and share your digital brain (Tweets, YouTube videos, Documents, Links, and Notes).

---

## 🛠️ Technology Stack

### Backend
- **Node.js & Express.js** with **TypeScript**
- **MongoDB** & **Mongoose** for data modeling
- **JWT (JSON Web Tokens)** for stateless authentication
- **bcryptjs** for secure password hashing
- **Zod (v4)** for request validation
- **dotenv** & **cors**

### Frontend
- **React (v19)** with **Vite** & **TypeScript**
- **Tailwind CSS (v4)** for modern styling with clean purple accents
- **Lucide React** & custom SVG brand icons
- **React Router (v7)** with protected route guards
- **Axios** with auth interceptors

---

## 🚀 Quick Start Guide

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Verify your `.env` configuration file (`backend/.env`):
   ```env
   PORT=3000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.ijwblpe.mongodb.net/brainly
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   ```
3. Build & start the backend:
   ```bash
   npm run build
   npm start
   # Or for development with live reload:
   npm run dev
   ```
   *The backend will be live at `http://localhost:3000`.*

---

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend dashboard will be live at `http://localhost:5173`.*

---

## 📚 API Endpoints

### Authentication
- `POST /api/v1/signup` — Register a new account (`username`, `password`, optional `email`)
- `POST /api/v1/signin` — Authenticate and receive a JWT token
- `GET /api/v1/me` — Retrieve current authenticated user profile

### Content Management (Protected)
- `POST /api/v1/content` — Create a new note/item
  - Fields: `title`, `type` (`tweet` | `youtube` | `document` | `link` | `text`), `link` (optional), `description` (optional), `tags` (array of tag names)
- `GET /api/v1/content` — Fetch content list with filtering and search:
  - `?type=youtube|tweet|document|link|text`
  - `?tag=productivity`
  - `?search=keyword`
  - `?page=1&limit=50`
- `GET /api/v1/content/:id` — Retrieve a single owned item
- `PATCH /api/v1/content/:id` — Update a content item
- `DELETE /api/v1/content/:id` — Delete a content item

### Tags
- `GET /api/v1/tags` — List all distinct tags for the authenticated user
- `POST /api/v1/tags` — Create a new tag
- `DELETE /api/v1/tags/:id` — Delete a tag

### Brain Sharing
- `POST /api/v1/brain/share` — Enable brain sharing or get existing active share token (`hash`)
- `DELETE /api/v1/brain/share` — Revoke public brain sharing link immediately
- `GET /api/v1/brain/:shareLink` — Public read-only endpoint retrieving the shared items and owner username
