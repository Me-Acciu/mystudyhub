---
trigger: always_on
---

# **Guidelines & Agent Instructions for MyStudyHub**

This document is the single source of truth for AI Agents and Developers working on the **MyStudyHub** codebase (React Native / Expo \+ Supabase \+ React Query).

## **1\. Project Overview & Architecture Rules**

* **Frontend**: React Native with Expo (TypeScript).  
* **Backend & Database**: Supabase (PostgreSQL with Row Level Security, Supabase Auth, Realtime).  
* **Remote State Management**: TanStack React Query (@tanstack/react-query).  
* **UI State Management**: Zustand (strictly reserved for ephemeral UI state such as modals, temporary filter toggles, active tabs, and locally persisted theme/pawn preferences).  
* **Architecture Style**: **Feature-based / Vertical Slice** architecture. Every feature owns its complete slice:  
  * src/features/\<feature\>/api/  
  * src/features/\<feature\>/hooks/  
  * src/features/\<feature\>/screens/

*Canonical example*: src/features/subjects/. This pattern must be strictly replicated across all features (chapters, flashcards, timelineEvents, grades, calendar, classes).

* **Design Principles**: High modularity, strict type safety for API boundaries, and a security-first posture via Row Level Security (RLS).

## **2\. Mandatory Coding Conventions**

### **A. API Layer Pattern (src/features/\<feature\>/api/\<feature\>Api.ts)**

* Colocate each entity's dedicated API module within its own feature folder (e.g., src/features/chapters/api/chaptersApi.ts).  
* Use explicit domain interfaces imported from src/types/models.ts for all API return types. Never redefine domain models locally within API files.  
* **Never enforce authorization or RLS rules in client code**. The Supabase client relies entirely on PostgreSQL RLS policies for access control. Client checks serve solely as UX conveniences, not security boundaries (refer to RootNavigator.tsx and AuthContext.tsx).  
* Throw standardized, non-enumerable generic errors from API functions to allow React Query to handle errors gracefully without exposing raw database details to the UI.

### **B. snake\_case $\leftrightarrow$ camelCase Data Mapping**

* Database rows in PostgreSQL/Supabase follow snake\_case. TypeScript domain models in src/types/models.ts follow camelCase.  
* Data transformations MUST occur strictly within the API layer using dedicated mapXRow() helper functions for each entity (e.g., mapSubjectRow, mapChapterRow in subjectsApi.ts).  
* UI components and custom hooks must never consume raw snake\_case database rows.

### **C. State Management Separation**

* **Remote Data Prohibition in Zustand**: Server entities (subjects, chapters, grades, flashcards, class members, timeline events) must not be stored in Zustand stores. useStudyStore is a temporary legacy mock store being phased out.  
* **React Query Standard**: All remote data fetching, caching, and mutations must be executed through React Query hooks utilizing the query key factory pattern established in subjectsQueryKeys:

export const chaptersQueryKeys \= {  
  all: \['chapters'\] as const,  
  detail: (id: string) \=\> \['chapters', id\] as const,  
};

* **Zustand Scope**: Reserved exclusively for ephemeral UI state (isAddModalOpen, selectedFilter, active tab) and un-synced device settings (useThemeStore).

### **D. Supabase Security & RLS Policies**

* Every PostgreSQL table must explicitly enable RLS: ALTER TABLE table\_name ENABLE ROW LEVEL SECURITY;.  
* Private user tables must enforce auth.uid() \= user\_id. Shared class tables must validate access through class\_memberships.  
* Critical workflows susceptible to race conditions (e.g., joining a class via invite code) must be executed via SECURITY DEFINER PostgreSQL RPC functions (join\_class\_by\_code).  
* **Dependency Constraint**: Client code must not consume RPCs or query tables without merged migrations and active RLS policies. Unreleased API layers (e.g., Phase 4 draft code) must remain unwired until Phase 1 database dependencies are met.

## **3\. Sequential Execution Roadmap**

Agents must follow this exact sequential workflow. Upstream phases and database dependencies must be satisfied before connecting downstream components.

$$\text{Phase 1: DB Schema \& RLS} \longrightarrow \text{Phase 2: API Layer} \longrightarrow \text{Phase 3: React Query Sync} \longrightarrow \text{Phase 4: Classes \& Invites}$$
$$\downarrow$$
$$\text{Phase 7: Privacy} \longleftarrow \text{Phase 6: Realtime Pawns} \longleftarrow \text{Phase 5: Server Score } (0.6V + 0.4A)$$
$$\downarrow$$
$$\text{Phase 8: Push Notifications} \longrightarrow \text{Phase 9: Offline First} \longrightarrow \text{Phase 10: Hardening \& Testing} \longrightarrow \text{Phase 11: Compliance}$$

## **4\. Operational Phases & Action Items**

### **Phase 1: Database Schema & RLS Policies**

* **Objective**: Execute idempotent DDL migration scripts (CREATE TABLE IF NOT EXISTS...) for all entities and enforce strict RLS policies.  
* **Key Entities**: profiles, subjects, chapters, flashcards, decks, grades, calendar\_events, activity\_results, classes, class\_memberships, timeline\_events.  
* **Rules**: Create foreign key indexes (subject\_id, chapter\_id, class\_id, user\_id). Ensure migration column names match mapXRow() expectations exactly. Write explicit SELECT, INSERT, UPDATE, and DELETE RLS policies.

### **Phase 2: Complete Missing API Layers**

* **Objective**: Build feature-bound API abstractions adhering to subjectsApi.ts.  
* **Target Modules**: chaptersApi.ts, flashcardsApi.ts, timelineEventsApi.ts, gradesApi.ts, calendarApi.ts.  
* **Rules**: Return typed promises from src/types/models.ts. Sanitize user free-text inputs prior to submission via src/utils/validation.ts (sanitizeFreeText, TEXT\_FIELD\_LIMITS).

### **Phase 3: Migration from Zustand Store to React Query**

* **Objective**: Replace mock seed data in useStudyStore with React Query custom hooks.  
* **Tasks**: Define \<feature\>QueryKeys factories. Implement query (useChapters) and mutation (useCreateChapter) hooks with automatic cache invalidation (queryClient.invalidateQueries). Remove migrated seed entities from useStudyStore upon integration to preserve a single source of truth.

### **Phase 4: Classes & Invite Code System**

* **Objective**: Implement secure class creation and membership workflows using database RPCs.  
* **Tasks**: Finalize classesApi.ts against merged database schemas. Connect the join\_class\_by\_code(invite\_code TEXT) RPC. Wire the UI flow, replacing hardcoded legacy constants (SEED\_CLASS, SEED\_MEMBERSHIPS).

### **Phase 5: Server-Side Progress Calculation**

* **Objective**: Compute student progress and pawn positioning server-side via PostgreSQL triggers.  
* **Formula** (Design Doc Section 9):  
  $\text{Punteggio Progresso} = 0.6 \times V + 0.4 \times A$
  * $V$ (Grades Component): Moving average of user-entered grades normalized to a $0 \dots 100$ scale.  
  * $A$ (Activity Component): Average accuracy percentage ($0 \dots 100$) from flashcard and timeline quiz evaluations stored in activity\_results.  
* **Tasks**: Create database triggers on grades and activity\_results to update class\_memberships.pawn\_position. Store $0.6$ and $0.4$ weighting parameters as configurable configuration rows. Treat client-side calculations (computeProgressScore) purely as transient preview fallbacks.

### **Phase 6: Realtime Leaderboard & Pawns**

* **Objective**: Reflect live player movements on the game board in real time.  
* **Tasks**: Subscribe to Supabase Realtime changes on class\_memberships filtered by class\_id. Mutate or invalidate React Query cache entries directly upon receiving payload updates rather than duplicating state in Zustand.

### **Phase 7: Member Privacy Controls**

* **Objective**: Allow users to configure activity visibility settings for classmates.  
* **Model**: Represent privacy using the core domain interface:  
  interface ClassMembership {  
    privacy: { showSubjectAndProgress: boolean };  
  }

* **Tasks**: Add a show\_subject\_and\_progress boolean column (default true) to class\_memberships. Enforce that exact numeric grades are never exposed to classmates regardless of settings—only pawn positions and optional progress percentages may be shared.

### **Phase 8: Push Notifications & SM-2 Reminders**

* **Objective**: Schedule local device notifications for academic deadlines and spaced repetition reviews.  
* **Tasks**: Request notification permissions via expo-notifications. Schedule local alerts for upcoming events (calendar\_events) and flashcard review intervals (flashcards.next\_review\_date).

### **Phase 9: Offline-First Support**

* **Objective**: Enable offline read capability and mutation queueing for React Query.  
* **Tasks**: Integrate @tanstack/react-query-persist-client using AsyncStorage as the storage provider. Apply Last-Write-Wins (LWW) resolution strategies based on updated\_at timestamps for user-owned entities. Class-bound entities remain strictly server-authoritative.

### **Phase 10: Hardening, Error Handling & Testing**

* **Objective**: Ensure stability, graceful error recovery, and core test coverage.  
* **Tasks**: Enforce React Error Boundaries on root screens. Add skeleton loader UI states during initial query fetching (isLoading). Write Jest unit tests for the SM-2 algorithm (updateFlashcardSM2) and progress computation functions.

### **Phase 11: Compliance & Risk Mitigation**

* **Objective**: Prepare the application for public release.  
* **Tasks**: Implement minor consent check workflows (GDPR compliance). Add content reporting and moderation hooks for shared class environments.

## **5\. Agent Instructions Checklist Before Submitting Code**

Before submitting code edits or PRs, verify the following compliance checklist:

1. **Strict TypeScript Types**: Are all functions, props, and API returns typed using models from src/types/models.ts without implicit any usage?  
2. **Feature Folder Location**: Is the code located inside src/features/\<feature\>/ rather than a flat root folder?  
3. **Data Mapping Enforcement**: Does the API layer map snake\_case database rows to camelCase domain objects using an explicit mapXRow() function?  
4. **No UI Mock Fallbacks**: Are isLoading and isError handled explicitly through React Query without hardcoding fallback mock data inside components?  
5. **State Scope Separation**: Is server data handled exclusively by React Query rather than Zustand?  
6. **Query Key Factory Pattern**: Does the feature export a structured \<feature\>QueryKeys object matching subjectsQueryKeys?  
7. **Database Filtering**: Are queries executing directly against Supabase RLS and database indexes rather than fetching unfiltered rows for client-side filtering?  
8. **Phase Dependency Check**: Does the implementation rely only on database tables and RPCs that have already been merged in Phase 1 migrations?  
9. **UI & Touch Targets**: Are interactive touch targets sized at least $44 \times 44\text{pt}$ with loading indicators present during asynchronous state transitions?
