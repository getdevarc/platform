# DevArc — Frontend Architecture

> **Stack:** Next.js · Tailwind CSS · Monaco Editor · shadcn/ui · AI Panel  
> **Phase:** 3 — Product UI

---

## Table of Contents

1. [Vision](#1-vision)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [UI Layout](#4-ui-layout)
5. [Core Pages](#5-core-pages)
6. [Coding Workspace Flow](#6-coding-workspace-flow)
7. [AI Panel](#7-ai-panel)
8. [Monaco Editor Integration](#8-monaco-editor-integration)
9. [Folder Structure](#9-folder-structure)
10. [API Layer](#10-api-layer)
11. [AI Interaction Flow](#11-ai-interaction-flow)
12. [State Management](#12-state-management)
13. [Interview Prep UI](#13-interview-prep-ui)
14. [Career Copilot UI](#14-career-copilot-ui)
15. [Development Order](#15-development-order)
16. [Future Improvements](#16-future-improvements)

---

## 1. Vision

DevArc frontend delivers a unified developer experience across four core domains:

| Domain | Description |
|---|---|
| Coding Practice | Solve problems in a real IDE environment |
| AI Mentor | Get hints, explanations, and code reviews |
| Interview Training | AI-driven mock interview sessions |
| Career Guidance | Personalized roadmap generation |

**Inspired by:** LeetCode (problem IDE) + GitHub Copilot (AI assistance) + Interview platforms (evaluation flow)

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Code Editor | Monaco Editor (`@monaco-editor/react`) |
| State Management | React Context / Zustand |
| API Layer | Axios |
| Auth | JWT (stored in memory / httpOnly cookie) |

---

## 3. System Architecture

```
DevArc Frontend (Next.js)
         │
         ├── Dashboard
         ├── Coding IDE
         └── AI Panel
              │
              ▼
    REST API ←→ DevArc Backend (Node.js)
                    │
                    ├── Judge0 (code execution)
                    ├── AI Services (Groq LLM)
                    └── PostgreSQL (Supabase)
```

---

## 4. UI Layout

Main layout structure across all problem pages:

```
┌───────────────────────────────────────────────┐
│                    Navbar                     │
├──────────┬────────────────────┬───────────────┤
│          │                    │               │
│ Sidebar  │  Coding Workspace  │   AI Panel    │
│          │                    │               │
│ Problems │  Monaco Editor     │  💡 Hint      │
│ History  │  Run / Submit      │  📖 Explain   │
│ Profile  │  Test Results      │  🔍 Review    │
│          │                    │               │
└──────────┴────────────────────┴───────────────┘
```

---

## 5. Core Pages

### 5.1 Dashboard — `/dashboard`

- User stats overview
- Recent submission history
- AI usage metrics
- Recommended problems

---

### 5.2 Problems List — `/problems`

**Filters:** Difficulty · Tags · Search

| Title | Difficulty |
|---|---|
| Two Sum | Easy |
| LRU Cache | Medium |
| Word Ladder | Hard |

---

### 5.3 Problem Page (Main IDE) — `/problems/[id]`

```
┌──────────────────────────────┬──────────────┐
│  Problem Description         │  AI Panel    │
│                              │              │
│  Example Inputs              │  💡 Hint     │
│  Constraints                 │  📖 Explain  │
│                              │  🔍 Review   │
├──────────────────────────────┤              │
│  Monaco Code Editor          │              │
│                              │              │
│  [ Run Code ]  [ Submit ]    │              │
└──────────────────────────────┴──────────────┘
```

---

## 6. Coding Workspace Flow

```
User opens problem
       │
       ▼
Write code in Monaco Editor
       │
       ▼
Run Code → Judge0 (execution)
       │
       ▼
Test Case Results displayed
       │
       ▼
Submit Code
       │
       ▼
Submission stored in DB
```

---

## 7. AI Panel

Right-side panel, available on the problem page.

```
┌──────────────────────────┐
│  🤖 AI Assistant         │
├──────────────────────────┤
│  [ 💡 Hint ]             │
│  [ 📖 Explain ]          │
│  [ 🔍 Review ]           │
├──────────────────────────┤
│  Response Area           │
│                          │
│  "Try using a hash map   │
│   to store numbers       │
│   you've seen..."        │
└──────────────────────────┘
```

**Endpoints used:**

| Button | Endpoint |
|---|---|
| Hint | `POST /ai/hint` |
| Explain | `POST /ai/explain` |
| Review | `POST /ai/review` |

> ⚠️ All AI endpoints are **rate-limited**. Show a cooldown indicator in the UI on 429 responses.

---

## 8. Monaco Editor Integration

**Package:** `@monaco-editor/react`

```tsx
import Editor from "@monaco-editor/react";

<Editor
  height="500px"
  language="javascript"
  theme="vs-dark"
  value={code}
  onChange={(val) => setCode(val ?? "")}
/>
```

**Features:**
- Syntax highlighting (JS, Python, Java, C++)
- Multiple language support
- Dark theme (`vs-dark`)
- Code formatting

---

## 9. Folder Structure

```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── dashboard/
│   ├── problems/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── interview/
│   └── career/
│
├── components/
│   ├── navbar/
│   ├── sidebar/
│   ├── editor/
│   ├── ai-panel/
│   ├── problems/
│   └── submissions/
│
├── features/
│   ├── auth/
│   ├── problems/
│   ├── submissions/
│   ├── ai/
│   ├── interview/
│   └── career/
│
├── services/
│   ├── api.ts          # Axios instance
│   └── auth.ts         # Auth helpers
│
├── hooks/
│   ├── useAuth.ts
│   └── useSubmissions.ts
│
└── store/
    ├── useUserStore.ts
    └── useEditorStore.ts
```

---

## 10. API Layer

Centralised Axios instance with auth interceptor:

```ts
// services/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

---

## 11. AI Interaction Flow

```
User clicks "Hint"
       │
       ▼
Frontend: POST /ai/hint
  { problemId, userCode }
       │
       ▼
Backend AI Service
       │
       ▼
Groq LLM (inference)
       │
       ▼
Response displayed in AI Panel
```

---

## 12. State Management

Global stores via **Zustand**:

```ts
// store/useEditorStore.ts
interface EditorStore {
  code: string;
  language: string;
  selectedProblem: Problem | null;
  aiResponse: string;
  setCode: (code: string) => void;
  setLanguage: (lang: string) => void;
}
```

```ts
// store/useUserStore.ts
interface UserStore {
  token: string | null;
  user: User | null;
  setToken: (token: string) => void;
  logout: () => void;
}
```

---

## 13. Interview Prep UI

**Route:** `/interview`

```
Start Interview
       │
       ▼
AI generates coding question
       │
       ▼
User writes solution in Monaco
       │
       ▼
Submit Answer
       │
       ▼
AI Feedback displayed
```

**API calls:**

| Action | Endpoint |
|---|---|
| Start | `POST /interview/start` |
| Submit | `POST /interview/answer` |

---

## 14. Career Copilot UI

**Route:** `/career`

**Input Form:**

| Field | Type | Example |
|---|---|---|
| Goal | Text | Become Backend Engineer |
| Experience | Select | Beginner / Intermediate / Advanced |
| Timeline | Text | 6 months |

**Result output:**
- AI-generated roadmap
- Recommended skills
- Project ideas
- Learning path

**API:** `POST /career/roadmap`

---

## 15. Development Order

Recommended build sequence:

| Step | Feature |
|---|---|
| 1 | Dashboard layout + navbar + sidebar |
| 2 | Problems list page with filters |
| 3 | Problem page layout (split view) |
| 4 | Monaco editor integration |
| 5 | Run / Submit code flow (Judge0) |
| 6 | AI panel (hint, explain, review) |
| 7 | Submissions history |
| 8 | Interview prep page |
| 9 | Career copilot page |

---

## 16. Future Improvements

| Feature | Description |
|---|---|
| Realtime code execution | Live output as you type |
| Collaborative coding | Multi-user shared editor |
| AI interview voice mode | Voice-based mock interviews |
| Analytics dashboard | Submission trends, AI usage stats |
| Offline mode | PWA support for coding without internet |

---

> **Next step:** Design the **DevArc Frontend Component System** — `ProblemLayout`, `EditorLayout`, `AIChatPanel`, `SubmissionResult` — to make the build phase smooth and consistent.