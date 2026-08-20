# **Guidelines & Agent Instructions for MyStudyHub**

This document serves as the absolute source of truth for AI Agents and Developers working on the **MyStudyHub** codebase (React Native / Expo + Supabase + React Query).

> **Revision note**: this version aligns the rules with code patterns already established in the repository (feature-based API layout, existing query key factory, existing privacy type, existing snake_case/camelCase mapping convention). Where a rule below references an existing file, that file is the canonical example to replicate for new modules — do not invent a parallel convention.

## **1. Project Overview & Architecture Rules**

* **Frontend**: React Native with Expo (TypeScript).
* **Backend & Database**: Supabase (PostgreSQL with RLS, Supabase Auth, Realtime).
* **Remote State Management**: TanStack React Query (`@tanstack/react-query`).
* **UI State Management**: Zustand (STRICTLY reserved for ephemeral UI state like modals, temporary filter toggles, active tab indices, theme/pawn preferences persisted locally).
* **Architecture style**: **feature-based / vertical slice**, not a flat `src/api/` folder. Each feature owns its full stack: `src/features/<feature>/api/`, `src/features/<feature>/hooks/`, `src/features/<feature>/screens/`. This is the pattern already used by `src/features/subjects/` and must be replicated exactly for every new feature (`chapters`, `flashcards`, `timelineEvents`, `grades`, `calendar`, `classes`).
* **Design Principles**: Modular architecture, type-safe API calls, security-first via Row Level Security (RLS).

## **2. Mandatory Coding Conventions**

### **A. API Layer Pattern (`src/features/<feature>/api/<feature>Api.ts`)**

* Every entity (e.g., chapters, flashcards, grades, calendar, classes) must have its dedicated API module colocated inside its own feature folder, following the reference implementation in `src/features/subjects/api/subjectsApi.ts`.
  * ❌ `src/api/chaptersApi.ts`
  * ✅ `src/features/chapters/api/chaptersApi.ts`
* Standardize response return types using explicit TypeScript interfaces from `src/types/models.ts`. Do not redefine domain types locally inside an API file.
* **NEVER** handle RLS or authorization logic client-side. The Supabase client uses RLS policies on PostgreSQL for all access control. Client-side checks (if any) are UX conveniences only, never a security boundary — see the pattern already documented in `RootNavigator.tsx` and `AuthContext.tsx`.
* Throw standardized, typed errors from API functions (generic, non-enumerable messages — see `AuthContext.signIn` for the pattern) so React Query can catch them gracefully.

### **B. snake_case ↔ camelCase Mapping (mandatory, no exceptions)**

* Postgres/Supabase rows are snake_case. Domain types in `src/types/models.ts` are camelCase.
* The mapping between the two MUST happen exclusively inside the API layer, via an explicit `mapXRow()` function per entity — see `mapSubjectRow` / `mapChapterRow` in `subjectsApi.ts` as the canonical pattern.
* UI components and hooks must never see a raw Supabase row. If a component references a snake_case field, that is a bug.

### **C. State Management Division**

* **DO NOT** store remote data (subjects, chapters, grades, flashcards, class members, timeline events) inside Zustand stores. `useStudyStore` in its current form (seed data) is a **temporary placeholder** to be progressively emptied out as each feature migrates to React Query (see Phase 3) — it is not a target architecture to extend with new entities.
* Remote data MUST be fetched, cached, and updated via **React Query custom hooks** (e.g., `useChapters`, `useCreateChapter`) following the query key factory pattern already established as `subjectsQueryKeys` in `src/features/subjects/hooks/useSubjects.ts`:

  ```ts
  export const chaptersQueryKeys = {
    all: ['chapters'] as const,
    detail: (id: string) => ['chapters', id] as const,
  };
  ```
  
  Every new feature must expose its own `<feature>QueryKeys` object with the same hierarchical shape (`[entity]`, `[entity, id]`, `[entity, id, subEntity]`) so cache invalidation stays predictable and composable across features.
* **Zustand** is reserved for: UI state (`isAddModalOpen`, `selectedFilter`, active tab), and local device preferences that are not shared/synced server data (theme, pawn skin — see `useThemeStore`, which is a correct and permanent use of Zustand).

### **D. Supabase Security & RLS**

* Every new PostgreSQL table MUST have RLS enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`.
* Tables storing private user data must enforce `auth.uid() = user_id`.
* Tables storing shared class data must enforce access via a helper check on `class_memberships`.
* Secure actions with race-condition or brute-force risk (such as joining a class via invite code) must be performed via PostgreSQL RPC functions marked `SECURITY DEFINER`, following the pattern already designed for `join_class_by_code`.
* **Dependency rule**: no client code may call an RPC or query a table that does not yet have its migration + RLS policy merged. If `classesApi.ts` (Phase 4 deliverable) exists ahead of the Phase 1 schema, it must be treated as a **reference implementation only** and must not be wired into any screen until the corresponding migration and RLS policies for `classes` / `class_memberships` are in place.

## **3. Sequential Execution Roadmap**

Agents must follow this exact roadmap when implementing features. Do not jump to downstream tasks without fulfilling upstream dependencies. A feature's API/hook layer (Phase 2/3) may be scaffolded as reference code ahead of schedule, but must not be connected to a live Supabase table until Phase 1 is complete for that table.

```
[Fase 1: Schema DB & RLS] ➔ [Fase 2: API Layer] ➔ [Fase 3: React Query Sync] ➔ [Fase 4: Classes & Invites]
                                                                                        │
                                                                                        ▼
[Fase 7: Privacy] ◄─── [Fase 6: Realtime Pawns] ◄─── [Fase 5: Server Score (0.6V + 0.4A)]
[Fase 8: Push Notifications]
[Fase 9: Offline First]
        │
        ▼
[Fase 10: Hardening & Testing] ➔ [Fase 11: Compliance & Go-To-Market]
```

## **4. Operational Phases & Action Items**

### **Phase 1: Database Schema & RLS Policies**

* **Objective**: Create PostgreSQL migration scripts for all entities and enforce Row Level Security.
* **Key Tables**: `profiles`, `subjects`, `chapters`, `flashcards`, `decks`, `grades`, `calendar_events`, `activity_results`, `classes`, `class_memberships`, `timeline_events`.
* **Rules**:
  * Always write clean, idempotent DDL scripts (`CREATE TABLE IF NOT EXISTS...`).
  * Add appropriate indexes for foreign keys (e.g., `subject_id`, `chapter_id`, `class_id`, `user_id`).
  * Write explicit RLS policies for `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
  * Column names in migrations must exactly match what the `mapXRow()` functions in the API layer expect (see Section 2.B) — schema and mapper are written together, not independently.

### **Phase 2: Complete Missing API Layers**

* **Objective**: Build client API abstractions inside each feature folder, matching `subjectsApi.ts`.
* **Target Files**:
  * `src/features/chapters/api/chaptersApi.ts`
  * `src/features/flashcards/api/flashcardsApi.ts`
  * `src/features/timelineQuiz/api/timelineEventsApi.ts`
  * `src/features/calendar/api/gradesApi.ts` + `calendarApi.ts` (grades and calendar events can share a feature folder or be split — keep whichever grouping matches the screens that consume them)
* **Rules**:
  * Export async functions returning strongly-typed promises using types from `src/types/models.ts`.
  * Handle Supabase error codes consistently; never leak raw Postgres/Supabase error messages to the UI (follow the generic-error pattern in `AuthContext`).
  * Every write operation (`insert`/`update`) must sanitize free-text fields via `src/utils/validation.ts` helpers (`sanitizeFreeText`, `TEXT_FIELD_LIMITS`) before sending to Supabase — this is already done in `subjectsApi.createSubject` / `createChapter` and must be replicated for grades notes, calendar titles, flashcard fronts/backs, etc.

### **Phase 3: Migration from Zustand Store to React Query**

* **Objective**: Replace local mock data (`useStudyStore` seed data) with React Query hooks, feature by feature.
* **Task List**:
  * For each entity, create a query key factory following the `subjectsQueryKeys` shape (see Section 2.C).
  * Implement query hooks (`useChapters(subjectId)`, `useGrades()`) colocated in `src/features/<feature>/hooks/`.
  * Implement mutation hooks (`useCreateChapter()`, `useUpdateGrade()`) with automatic cache invalidation (`queryClient.invalidateQueries`); use optimistic updates only where latency would otherwise visibly hurt UX (e.g., toggling a completed task, not creating a subject).
  * Once a feature's screens are wired to React Query hooks, remove that entity's seed data and actions from `useStudyStore` in the same PR — do not let the store and React Query hold the same entity simultaneously, as that creates two sources of truth.

### **Phase 4: Classes & Invite Code System**

* **Objective**: Implement class management and secure join flow, gated behind Phase 1 completion for `classes` / `class_memberships`.
* **Task List**:
  * Finalize `src/features/classes/api/classesApi.ts` against the real schema (a draft reference implementation using an RPC `join_class_by_code(invite_code TEXT)` marked `SECURITY DEFINER` already exists — validate it against the merged migration rather than rewriting from scratch).
  * Implement UI flow for creating a class and entering an invite code, replacing the hardcoded `SEED_CLASS` / `SEED_MEMBERSHIPS` currently in `useStudyStore`.

### **Phase 5: Server-Side Progress Calculation**

* **Objective**: Compute the student's Punteggio Progresso and derive Pawn Position securely on the database, replacing the client-side `computeProgressScore` helper (`useStudyStore.ts`), which must be treated as a **client-side preview/estimate only** once this phase lands.
* **Formula** (Design Doc Sezione 9 — authoritative definition):
  * `V` (componente Voti): moving average of manually entered grades for the period, normalized to a 0–100 scale.
  * `A` (componente Attività): average of correct-answer percentages across evaluated flashcard and timeline-quiz sessions in the same period, already on a 0–100 scale.
  * **Punteggio Progresso = 0.6 × V + 0.4 × A**
  * `A` is *not* an attendance/presence metric — it is derived purely from in-app graded activity results (`activity_results` table), matching `ActivityResultType` (`flashcard` | `quiz_cronologia`) in `src/types/models.ts`.
* **Task List**:
  * Create a PostgreSQL function/trigger on `grades` and `activity_results` inserts that recalculates the composite score and writes the resulting pawn advancement to `class_memberships.pawn_position`, following the advancement rules in Design Doc Sezione 9.3 (1–3 caselle per period, minimum advancement for sustained high scores, streak/coverage bonuses).
  * The 0.6/0.4 weights must be stored as configurable parameters (table or config row), not hardcoded in the trigger, per the design doc's note that weights may become user-adjustable in a future version.

### **Phase 6: Realtime Leaderboard & Pawns**

* **Objective**: Update pawn positions on the live board in real-time.
* **Task List**:
  * Subscribe to Supabase Realtime changes on `class_memberships` filtered by `class_id`.
  * Update local state smoothly when pawn positions shift; invalidate/patch the corresponding React Query cache entry rather than duplicating pawn state in Zustand.

### **Phase 7: Member Privacy Controls**

* **Objective**: Allow users to toggle how much of their activity is visible to classmates, per the existing client type.
* **Canonical model**: `src/types/models.ts` already defines

  ```ts
  interface ClassMembership {
    // ...
    privacy: { showSubjectAndProgress: boolean };
  }
  ```

  This boolean model is the source of truth. Do **not** introduce a parallel `privacy_mode` enum (`SHOW_ALL` / `PAWN_ONLY`) unless a genuine need for more than two states emerges — if it does, update `models.ts` first and treat that as the schema change driving the migration, not the other way around.
* **Task List**:
  * Add a `show_subject_and_progress boolean` column (default `true`) to `class_memberships`.
  * Filter exposed subject details and progress percentages in the UI/API based on each member's privacy flag. The exact numeric grade must never be exposed to other members regardless of this setting (Design Doc Sezione 6.5/8.4) — only the pawn position, and optionally subject name + completion percentage, are ever shareable.

### **Phase 8: Push Notifications & SM-2 Reminders**

* **Objective**: Integrate `expo-notifications` for deadline reminders and SM-2 flashcard reviews.
* **Task List**:
  * Request notification permissions on app start.
  * Schedule local triggers for upcoming exams/deadlines (from `calendar_events`) and scheduled SM-2 revision intervals (from `flashcards.next_review_date`, already computed client-side by the SM-2 algorithm in `useStudyStore.updateFlashcardSM2`).

### **Phase 9: Offline-First Support**

* **Objective**: Support offline viewing and sync queues for React Query.
* **Task List**:
  * Integrate `@tanstack/react-query-persist-client` using **AsyncStorage** as the storage adapter, consistent with the storage stack already in use (`AsyncStorage` for Zustand-persisted preferences, `expo-secure-store` for auth tokens). Only evaluate `react-native-mmkv` later if AsyncStorage read/write latency is measured to be a real bottleneck — do not add a new storage dependency preemptively.
  * Enforce Last-Write-Wins conflict resolution based on timestamp fields (`updated_at`) for personal entities, per Design Doc Sezione 8.3. Class-scoped entities (pawn position, memberships) remain server-authoritative and are never written optimistically from the client.

### **Phase 10: Hardening, Error Handling & Tests**

* **Objective**: Ensure stability and app resiliency.
* **Task List**:
  * Wrap top-level screens in React Error Boundaries with graceful fallback UI.
  * Add Skeleton Loaders during initial query fetches (`isLoading` states from React Query hooks — never a blank screen or silent spinner-less wait).
  * Write Jest unit tests for critical business logic: the SM-2 spaced repetition algorithm (`updateFlashcardSM2`) and the Punteggio Progresso formula (both the client preview in `computeProgressScore` and, once migrated, the server-side function's expected output via integration tests).

### **Phase 11: Compliance & Risk Mitigation**

* **Objective**: Prep for public release.
* **Task List**:
  * Implement minor consent / parental controls logic where required by GDPR, per the open risk flagged in Design Doc Sezione 11 (utenti minorenni).
  * Add reporting / moderation features for shared classes and user content, per the open risk on class moderation (Sezione 11).

## **5. Agent Instructions Checklist Before Submitting Code**

When generating or editing code for this project, always perform these checks:

1. **TypeScript strictness**: Are all props, parameters, and API responses strictly typed against `src/types/models.ts`? No implicit `any`.
2. **Feature folder placement**: Did the new API/hook file land inside `src/features/<feature>/...`, not a flat `src/api/`?
3. **Mapping layer present**: Does every new API function map snake_case rows to camelCase domain types via an explicit `mapXRow()`, with zero raw Postgres fields reaching a component?
4. **No Mock Fallbacks in Production Code**: Do not inject fallback mock data directly into component files; handle `isLoading` and `isError` explicitly via React Query.
5. **Zustand Scope Check**: Is this state remote/server data? If yes, it belongs in React Query, not Zustand — and if it's currently in `useStudyStore`, this PR is the right place to migrate it out, not to add to it.
6. **Query key factory used**: Does the new hook file export a `<feature>QueryKeys` object following the hierarchical shape already used by `subjectsQueryKeys`?
7. **Supabase path**: Are queries executing directly against Supabase without client-side manual filtering that should be done in PostgreSQL/RLS instead?
8. **Phase dependency check**: Does this code assume a table/RPC exists that hasn't been merged in a Phase 1 migration yet? If so, gate it behind a feature flag or keep it unwired.
9. **UI & Accessibility**: Are touch targets at least 44x44pt on mobile? Are icons and loading indicators present during async transitions?
