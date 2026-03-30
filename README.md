# ResumeAI - Frontend

The gorgeous, interactive UI of ResumeAI. Designed with a custom "Kinetic Architect" CSS system replacing traditional utility classes, enabling pixel-perfect glassmorphism panels, ambient glows, and minimal layouts.

## 🎨 Tech Stack

- **Framework**: [React](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/) (blazing fast HMR)
- **Routing**: [React Router](https://reactrouter.com/) (BrowserRouter)
- **State Management**: [React Context](https://react.dev/reference/react/useContext) API (Auth & Notifications)
- **Networking**: [Axios](https://axios-http.com/) with JWT interceptors
- **Icons**: [React Icons](https://react-icons.github.io/react-icons/) (Heroicons)

## ✨ UI/UX Highlights

1. **Kinetic Architecture Design System**:
    - **No-Line Rule**: Avoids hard borders. UI depth relies on tonal shifts (`var(--surface-raised)`), `backdrop-filter: blur`, and `box-shadows`.
    - **Glassmorphism Layering**: Active elements (`glass` panels) use semi-transparent dark backgrounds stacked on an animated mesh gradient root.
    - **Micro-animations**: Subtle `pulse-glow`, `ambient-glow`, and `slide-up` CSS keyframes for immediate tactile feedback.

2. **Real-time Event Toast Notifications**:
    - Uses a custom Context Provider to listen to Server-Sent Events (SSE) from the FastAPI backend. Whenever a tailored resume or PDF is generated asynchronously, a toast notification slides in dynamically.

3. **Intelligent Modals**:
    - Complete abandonment of native browser `alert()` or `confirm()` dialogs. Instead, there's a custom-built, fully animated declarative modal engine for actions like Deletions or Confirmation warnings.

## 🚀 Setup Instructions

### 1. Requirements
* Node.js v18+
* Npm, Yarn, or pnpm

### 2. Environment Variables
Create a `.env` in the `frontend` root:
```env
VITE_API_URL=http://localhost:8000/api
```

### 3. Installation
```bash
npm install
```

### 4. Running the Dev Server
Start the Vite development environment:
```bash
npm run dev
```
Navigate to `http://localhost:5173`. We strongly recommend installing React DevTools for seamless debugging.

## 📂 Project Structure

```text
src/
├── api/                # Axios instance configuration & request/response JWT interceptors
├── assets/             # Global static media 
├── components/         # Reusable React components (Modals, Navbars, Toasts, ScoreRings)
├── context/            # React Contexts (AuthContext, NotificationContext)
├── pages/              # Primary route views (Dashboard, Upload, Preview, Login)
├── App.jsx             # React-Router definitions & Context boundary definitions
└── index.css           # Global Kinetic Architect Design System tokens & layout primitives
```
