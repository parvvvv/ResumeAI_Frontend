# ResumeAI ✨ - Frontend (v2.0)

The immersive, interactive interface of ResumeAI. Built with a focus on high-fidelity aesthetics, real-time feedback, and production-grade performance.

---

## 🏗️ Architecture & UX Design

### 🎨 Kinetic Architecture
ResumeAI implements **Kinetic Architecture**-a custom CSS design system focused on depth, light, and motion.
- **Micro-interactions**: Every button and card utilizes `pulse-glow` and `hover-lift` effects for tactile feedback.
- **Glassmorphism**: 100% borderless UI that relies on `backdrop-filter: blur(12px)` and tonal elevation for hierarchy.
- **Fluid Layouts**: Purely responsive engine that adapts from ultra-wide monitors to mobile screens without layout shifts.

### ⚡ Real-time Event Orchestration
The frontend uses a custom **Event Hub** to handle backend streaming:
- **Server-Sent Events (SSE)**: Synchronized via a global notification context, allowing for non-blocking UI during heavy AI processing.
- **Optimistic UI Updates**: Dashboard cards update immediately, with rolling background syncs for data consistency.

---

## 🚀 Performance & Optimization

To ensure a smooth 60fps experience even during complex AI streaming:
- **Component Memoization**: Heavy components like the `Editor` and `RadarChart` use `React.memo` and `useMemo` to prevent unnecessary re-renders.
- **Asset Optimization**: SVGs are used for all iconography (`React-Icons`) to ensure crisp rendering at any scale.
- **Lazy Loading**: Route-based code splitting ensures that the initial bundle size remains minimal.
- **Efficient State**: Utilizes the Context API for global state (Auth/Notifications) while keeping local state encapsulated to avoid global re-renders.

---

## ♿ Accessibility & Standards

- **Semantic HTML**: Proper use of `<main>`, `<section>`, and `<nav>` landmarks.
- **Keyboard Navigation**: Fully navigable via Tab/Enter keys with custom focus rings that respect the "No-Line Rule."
- **Screen Reader Support**: ARIA labels on all icon-only buttons (like the Chatbot trigger).
- **Color Contrast**: Accessible contrast ratios maintained across the glassmorphism theme.

---

## 🛠️ Tech Stack

| Tool | Purpose |
| :--- | :--- |
| **React 18** | UI Foundation |
| **Vite** | Build Tooling |
| **React Router 6** | Navigation |
| **Axios** | API Interceptors (JWT Management) |
| **Framer Motion** | Advanced UI Animations & Transitions |

---

## 🗺️ Roadmap to 10/10 (Production Scaling)

- [ ] **State Migration**: Transition to Redux Toolkit or TanStack Query for complex cache management.
- [ ] **E2E Testing**: Implement Playwright for critical user flows (Login → Search → Tailor).
- [ ] **PWA Support**: Offline caching and installable app experience.
- [ ] **Analytics**: Integration of post-apply tracking and AI conversion metrics.

---

## ⚡ Setup & Development

```bash
npm install
npm run dev
```
Visit `http://localhost:5173`.

---
*Empowering careers with AI.*
