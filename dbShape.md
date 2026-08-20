# Database Schema Overview

This appears to be the backend for a **habit-tracking / gamification app** — users complete habits and to-dos to earn XP and coins. There are 4 tables: `habits`, `habit_logs`, `profiles`, and `todos`. All tables use Supabase-style Row Level Security so each user can only see and edit their own data.

---

## 1. `habits`
Defines the habits a user wants to track (e.g. "Drink water", "Read 20 pages").

| Column | Type | Required? | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | ✅ | auto-generated | Primary key |
| `user_id` | uuid | ✅ | — | Owner of the habit |
| `title` | varchar | ✅ | — | Habit name |
| `description` | varchar | optional | — | |
| `habit_type` | enum | ✅ | `checkmark` | e.g. simple yes/no vs. a counter |
| `direction` | enum | ✅ | `at_least` | Goal direction (at least / at most, etc.) |
| `period` | enum | ✅ | `daily` | How often the goal resets (daily/weekly) |
| `target_value` | numeric | ✅ | `1` | The goal amount |
| `target_days` | smallint | optional | — | Used for weekly goals (1–7 days) |
| `unit` | varchar | optional | — | e.g. "glasses", "pages" |
| `is_archived` | boolean | ✅ | `false` | Soft-delete/hide flag |
| `xp_reward` | integer | ✅ | `1` | XP earned on completion |
| `coin_reward` | integer | ✅ | `1` | Coins earned on completion |
| `difficulty` | text | optional | — | trivial / easy / medium / hard / very hard |
| `time` | text | optional | — | quick / short / medium / long / very long |
| `created_at` | timestamptz | ✅ | now |  |
| `updated_at` | timestamptz | ✅ | now |  |

**Business rules enforced by the database:**
- If `habit_type = 'checkmark'`, the habit must have `direction = 'at_least'` and `target_value = 1` (a simple yes/no habit can't have a custom target).
- `target_value` must be greater than 0.
- If `period = 'daily'`, `target_days` must be empty; if `period = 'weekly'`, `target_days` must be between 1 and 7.
- `difficulty` and `time` are restricted to the fixed lists above.
- `(id, habit_type)` together must be unique — this lets `habit_logs` safely reference both.

**Access:** Users can only manage (view/edit/delete) their own habits.

---

## 2. `habit_logs`
Each row is one day's recorded progress toward a habit.

| Column | Type | Required? | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | ✅ | auto-generated | Primary key |
| `habit_id` | uuid | ✅ | — | Links to `habits` |
| `habit_type` | enum | ✅ | — | Copied from the habit, used for validation |
| `user_id` | uuid | ✅ | — | Owner |
| `log_date` | date | ✅ | — | The day being logged |
| `value` | numeric | ✅ | `0` | Amount logged that day |
| `created_at` | timestamptz | ✅ | now | |
| `updated_at` | timestamptz | ✅ | now | |

**Business rules enforced by the database:**
- Only one log per habit per day (`habit_id` + `log_date` must be unique).
- `value` can never be negative.
- If the habit is a `checkmark` type, `value` can't exceed 1 (it's just done/not done).
- If the parent habit is deleted, all of its logs are automatically deleted too.

**Access:** Users can only manage their own logs.

---

## 3. `profiles`
Tracks each user's game-style stats.

| Column | Type | Required? | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | ✅ | — | Primary key, same as the user's auth ID |
| `xp_total` | integer | ✅ | `0` | Total experience earned |
| `coins` | integer | ✅ | `0` | Total coins earned |

**Access:** Users can only manage their own profile.

---

## 4. `todos`
One-off tasks (separate from recurring habits).

| Column | Type | Required? | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | ✅ | auto-generated | Primary key |
| `user_id` | uuid | ✅ | — | Owner |
| `title` | text | ✅ | — | |
| `description` | text | optional | — | |
| `status` | text | ✅ | `pending` | |
| `xp_reward` | integer | ✅ | `10` | XP earned on completion |
| `coin_reward` | integer | ✅ | `1` | Coins earned on completion |
| `difficulty` | text | optional | — | trivial / easy / medium / hard / very hard |
| `time` | text | optional | — | quick / short / medium / long / very long |
| `created_at` | timestamptz | ✅ | now | |
| `completed_at` | timestamptz | optional | — | Set when the todo is finished |

**Business rules enforced by the database:**
- `difficulty` and `time` are restricted to the fixed lists above (same as `habits`).

**Access:** Users can only manage their own todos.

---

## How the tables relate

```
auth.users (Supabase built-in)
   │
   ├── profiles       (1-to-1: XP & coin totals)
   ├── habits         (1-to-many: a user's recurring habits)
   │      │
   │      └── habit_logs   (1-to-many: daily check-ins per habit)
   │
   └── todos          (1-to-many: one-off tasks)
```

**Security model:** Every table uses Row Level Security with the same pattern — a user can only see and modify rows where `user_id` (or `id` for `profiles`) matches their own authenticated user ID. There are no triggers defined on any of these tables.