# Document Intelligence — Frontend Landing Page

A production-grade React + Tailwind landing page for the **AI-Powered Document Intelligence Platform** final-year engineering project. Includes a fully wired live demo that talks to the Spring Boot backend at `http://localhost:8080`.

## Stack

- React 18 (Vite)
- Tailwind CSS 3
- Pure inline SVG icons — **no external UI libraries**
- Inter font from Google Fonts

## Run

```bash
cd frontend
npm install
npm run dev
```

The app starts at `http://localhost:5173`. Vite is pre-configured to proxy `/api` requests to `http://localhost:8080`, so as long as the Spring Boot backend is running, the live demo section will work end-to-end.

## Structure

```
frontend/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx
    ├── index.css
    └── App.jsx          # Single file containing all section components + inline api.js
```

All section components (`HeroSection`, `HowItWorks`, `FeaturesSection`, `TechStack`, `LiveDemo`, `Architecture`, `Footer`) live inside `src/App.jsx` as requested. The `API` service at the top of the file follows the `services/api.js` pattern with `uploadDocument`, `listDocuments`, `getDocument`, and `askQuestion` methods.

## Features

- Animated gradient + canvas particle background
- Glassmorphism cards with backdrop blur
- Smooth scroll-triggered fade-in animations via `IntersectionObserver`
- Gradient text headings
- Hover micro-animations on all interactive elements
- Drag-and-drop PDF upload with progress bar
- Real-time status polling every 3 seconds (with proper `setInterval` cleanup)
- Animated status badges (UPLOADED/PROCESSING/DONE/FAILED)
- Loading skeletons, toast notifications
- Fully responsive — mobile, tablet, desktop
- SVG architecture diagram
