# DevArc — Database Design & ER Model

> PostgreSQL (Supabase) | Phase 1 | Production-Ready Schema

> Database Engine: PostgreSQL (managed via Supabase)

DevArc uses Supabase managed PostgreSQL instead of a local PostgreSQL installation.
This keeps development simple and avoids local database configuration issues.

---

## Core Entities

| Phase | Tables |
|---|---|
| **Phase 1 (core)** | `users` `problems` `submissions` `ai_logs` |
| **Phase 2 (future)** | `tags` `problem_tags` `user_progress` |

---

## 01 / ER Diagram (Conceptual)

```
                    users
                      |
                    1 : N
                      |
problems --1:N-- submissions --N:1-- (linked via user_id + problem_id)
    |                                          
  1 : N                                        
    |                                          
 ai_logs <-- also linked to users (1:N via user_id)
```

### Relationships

| Relationship | Cardinality | FK Column |
|---|---|---|
| users → submissions | One-to-Many (1:N) | `submissions.user_id` |
| problems → submissions | One-to-Many (1:N) | `submissions.problem_id` |
| users → ai_logs | One-to-Many (1:N) | `ai_logs.user_id` |
| problems → ai_logs | One-to-Many (1:N) | `ai_logs.problem_id` |

---

## 02 / Table Schemas

### Table: `users`

Stores all registered accounts. Password is never stored in plain text — bcrypt hash only. Email must be unique across the system.

| Column | Type | Constraint / Note |
|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` \| `DEFAULT gen_random_uuid()` |
| `name` | `VARCHAR(100)` | `NOT NULL` |
| `email` | `VARCHAR(150)` | `UNIQUE` \| `NOT NULL` |
| `password` | `TEXT` | `NOT NULL` (bcrypt hash) |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` \| `NOT NULL` |

```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW() NOT NULL
);
```

---

### Table: `problems`

The problem bank. Difficulty is constrained to `easy / medium / hard` via a CHECK constraint. Future columns (constraints, companies) will be added in Phase 2.

| Column | Type | Constraint / Note |
|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` \| `DEFAULT gen_random_uuid()` |
| `title` | `VARCHAR(200)` | `NOT NULL` |
| `difficulty` | `VARCHAR(10)` | `CHECK IN ('easy', 'medium', 'hard')` |
| `description` | `TEXT` | `NOT NULL` |
| `example_input` | `TEXT` | NULLABLE |
| `example_output` | `TEXT` | NULLABLE |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` \| `NOT NULL` |

```sql
CREATE TABLE problems (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          VARCHAR(200) NOT NULL,
  difficulty     VARCHAR(10) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  description    TEXT NOT NULL,
  example_input  TEXT,
  example_output TEXT,
  created_at     TIMESTAMP DEFAULT NOW() NOT NULL
);
```

---

### Table: `submissions`

One row per code submission. Status tracks the Judge0 execution result. Cascades on user/problem delete to maintain referential integrity.

| Column | Type | Constraint / Note |
|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` \| `DEFAULT gen_random_uuid()` |
| `user_id` | `UUID` | `REFERENCES users(id) ON DELETE CASCADE` |
| `problem_id` | `UUID` | `REFERENCES problems(id) ON DELETE CASCADE` |
| `code` | `TEXT` | `NOT NULL` |
| `language` | `VARCHAR(20)` | `NOT NULL` (e.g. python, javascript, cpp) |
| `status` | `VARCHAR(30)` | `CHECK IN (6 enum values)` \| `DEFAULT 'pending'` |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` \| `NOT NULL` |

```sql
CREATE TABLE submissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  problem_id  UUID REFERENCES problems(id) ON DELETE CASCADE,
  code        TEXT NOT NULL,
  language    VARCHAR(20) NOT NULL,
  status      VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
    'pending',
    'accepted',
    'wrong_answer',
    'runtime_error',
    'compilation_error',
    'time_limit_exceeded'
  )),
  created_at  TIMESTAMP DEFAULT NOW() NOT NULL
);
```

---

### Table: `ai_logs`

Audit log for every AI interaction. Used for debugging prompt quality, tracking per-user AI usage, and improving AI responses over time.

| Column | Type | Constraint / Note |
|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` \| `DEFAULT gen_random_uuid()` |
| `user_id` | `UUID` | `REFERENCES users(id) ON DELETE CASCADE` |
| `problem_id` | `UUID` | `REFERENCES problems(id) ON DELETE CASCADE` |
| `prompt` | `TEXT` | The input sent to the LLM |
| `response` | `TEXT` | The LLM response stored for auditing |
| `created_at` | `TIMESTAMP` | `DEFAULT NOW()` \| `NOT NULL` |

```sql
CREATE TABLE ai_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  problem_id  UUID REFERENCES problems(id) ON DELETE CASCADE,
  prompt      TEXT,
  response    TEXT,
  created_at  TIMESTAMP DEFAULT NOW() NOT NULL
);
```

---

## 03 / Submission Status Enum

All 6 possible values for `submissions.status`. Defined as a CHECK constraint in PostgreSQL and mirrored in `constants/submissionStatus.js`.

| Status | Description |
|---|---|
| `pending` | Default state. Submission received, awaiting Judge0 execution. |
| `accepted` | Code ran successfully. Output matched the expected result. |
| `wrong_answer` | Code ran but output did not match expected result. |
| `runtime_error` | Code crashed or threw an unhandled error during execution. |
| `compilation_error` | Code failed to compile. Judge0 returned a compile error. |
| `time_limit_exceeded` | Execution exceeded the allowed time limit for this problem. |

---

## 04 / Database Indexes

Critical for query performance as data grows. Run these after creating tables.

```sql
-- Speeds up GET /submissions/:userId — most frequent query for user dashboards
CREATE INDEX idx_submissions_user
ON submissions(user_id);

-- Speeds up fetching all submissions for a problem — analytics and leaderboards
CREATE INDEX idx_submissions_problem
ON submissions(problem_id);

-- Fast filtering by status — e.g. all 'accepted' submissions for stats
CREATE INDEX idx_submissions_status
ON submissions(status);

-- Fast lookup of all AI interactions for a user — needed for rate limiting checks
CREATE INDEX idx_ailogs_user
ON ai_logs(user_id);

-- Speeds up sorting submissions by time — recent activity feeds
CREATE INDEX idx_submissions_created
ON submissions(created_at DESC);
```

---

## 05 / Phase 2 — Future Tables

These tables are **not** part of Phase 1. Designed now so the Phase 1 schema does not need breaking changes when Phase 2 begins.

### Table: `problem_tags`

Maps problems to topic tags. Enables tag-based filtering on the problems list. Many-to-many: one problem can have multiple tags.

| Column | Type | Constraint / Note |
|---|---|---|
| `problem_id` | `UUID` | `REFERENCES problems(id) ON DELETE CASCADE` |
| `tag` | `VARCHAR(50)` | e.g. array, hashmap, two-pointer, binary-search |

```sql
-- Phase 2
CREATE TABLE problem_tags (
  problem_id  UUID REFERENCES problems(id) ON DELETE CASCADE,
  tag         VARCHAR(50) NOT NULL,
  PRIMARY KEY (problem_id, tag)
);
```

**Example tags:** `array` `hashmap` `two-pointer` `binary-search` `dynamic-programming` `graph`

---

### Table: `user_progress`

Tracks which problems a user has solved and when. Powers the user dashboard, streak tracking, and progress analytics.

| Column | Type | Constraint / Note |
|---|---|---|
| `user_id` | `UUID` | `REFERENCES users(id) ON DELETE CASCADE` |
| `problem_id` | `UUID` | `REFERENCES problems(id) ON DELETE CASCADE` |
| `status` | `VARCHAR(20)` | `solved` / `attempted` |
| `solved_at` | `TIMESTAMP` | NULLABLE — set when status becomes `solved` |

```sql
-- Phase 2
CREATE TABLE user_progress (
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  problem_id  UUID REFERENCES problems(id) ON DELETE CASCADE,
  status      VARCHAR(20) DEFAULT 'attempted',
  solved_at   TIMESTAMP,
  PRIMARY KEY (user_id, problem_id)
);
```

---

## 06 / Data Flow — User Solving a Problem

```
1. User Submits Code
   └── POST /submissions  { code, language, problem_id, user_id }

2. Submission Stored
   └── INSERT INTO submissions  (status = 'pending')

3. Judge0 Executes
   └── submissionService calls Judge0 API
   └── Judge0 runs code in isolated sandbox

4. Status Updated
   └── UPDATE submissions SET status = 'accepted' | 'wrong_answer' | ...

5. AI Explanation Requested
   └── POST /ai/explain  { problem context + user code }

6. AI Log Saved
   └── INSERT INTO ai_logs  (prompt, response)
```

---

## 07 / Phase 1 Milestones

| Tag | Title | Description |
|---|---|---|
| **M1** | Server + DB Connection | Connect Express to PostgreSQL. Set up connection pool via `pg`. Verify with a test query. |
| **M2** | Run Migrations | Create all 4 Phase 1 tables. Apply CHECK constraints and foreign keys. |
| **M3** | Apply Indexes | Add all 5 performance indexes after tables are created. |
| **M4** | Auth System | `users` table live. Register + login routes working. bcrypt hashing confirmed. |
| **M5** | Problems + Submissions | Seed problem bank. Submissions table accepting rows. Status enum enforced. |

---

## Next Commit

```
File:     docs/database.md
Message:  docs: add DevArc database schema and ER design
```

---

*DevArc Engineering | Database Design v1.0 | Phase 1*