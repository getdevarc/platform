# DevArc — Database Design & ER Model

> PostgreSQL (Supabase) | Phase 4 | Production-Ready Schema

DevArc uses Supabase managed PostgreSQL. This schema has been evolved to support advanced AI coaching, mock interviews, and personalized career roadmaps.

---

## Core Entities

| Layer | Tables |
|---|---|
| **Auth & Profile** | `users` |
| **Problem Bank** | `problems`, `problem_tags` |
| **Solving Workflow** | `solve_sessions`, `solve_events`, `submissions`, `solve_insights` |
| **Coaching** | `interviews`, `ai_logs` |

---

## 01 / Table Schemas

### Table: `users`
Stores accounts and career profiles.

| Column | Type | Note |
|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` |
| `name` | `VARCHAR(100)` | |
| `email` | `VARCHAR(150)` | `UNIQUE` |
| `password` | `TEXT` | bcrypt hash |
| `role` | `VARCHAR(50)` | Fresher / Professional |
| `target_domain` | `VARCHAR(50)` | Frontend / Backend / Fullstack |
| `career_answers` | `JSONB` | Onboarding questionnaire answers |
| `career_roadmap` | `TEXT` | AI generated 3-month plan |
| `resume_text` | `TEXT` | Extracted resume content |

---

### Table: `solve_sessions`
Tracks a user's attempt at a specific problem.

| Column | Type | Note |
|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` |
| `user_id` | `UUID` | `REFERENCES users(id)` |
| `problem_id` | `UUID` | `REFERENCES problems(id)` |
| `score` | `INT` | Starts at 100, drops on hint usage |
| `status` | `VARCHAR(20)` | `active / completed` |
| `created_at` | `TIMESTAMP` | |

---

### Table: `solve_events`
Logs every action (hint request, code run) during a session.

| Column | Type | Note |
|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` |
| `session_id` | `UUID` | `REFERENCES solve_sessions(id)` |
| `event_type` | `VARCHAR(50)` | `hint_used`, `code_run`, etc. |
| `metadata` | `JSONB` | Contextual data for the event |

---

### Table: `solve_insights`
Stores the deep AI analysis of a user's solving process.

| Column | Type | Note |
|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` |
| `session_id` | `UUID` | `REFERENCES solve_sessions(id)` |
| `analysis` | `JSONB` | AI-generated strengths/weaknesses/verdict |
| `points_deducted` | `INT` | Total penalty based on AI usage |

---

### Table: `interviews`
Mock interview sessions and evaluations.

| Column | Type | Note |
|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` |
| `user_id` | `UUID` | `REFERENCES users(id)` |
| `track` | `VARCHAR(50)` | DSA / System Design / Frontend |
| `question` | `TEXT` | The AI generated challenge |
| `transcript` | `JSONB` | Full chat history |
| `evaluation` | `JSONB` | Metrics and final verdict |

---

## 02 / AI Logic & Event Flow

### Solve Workflow:
1. **START**: `solve_sessions` created. `100` points assigned.
2. **SOLVE**: `solve_events` log every interaction. HINTS trigger `20` point deduction.
3. **SUBMIT**: Status checked. If `accepted`, trigger Insight Engine.
4. **INSIGHT**: AI analyzes `solve_events` + code to generate `solve_insights`.

### Interview Workflow:
1. **TRACK**: User selects career track.
2. **CHALLENGE**: AI generates specific question.
3. **MOCK**: Real-time chat + code sandbox session.
4. **REPORT**: AI synthesizes performance into a professional PDF evaluation.

---

*DevArc Engineering | Database Schema v4.0 | Production*