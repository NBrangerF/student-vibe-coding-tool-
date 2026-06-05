# Project Structure

This document records the current structure of the Student AI Build Companion research MVP.
Keep it updated whenever files, folders, or major responsibilities change.

## Overview

The app is a Vite + React + TypeScript prototype for the Goal-to-Milestone workflow described in the PRD and paper.

Runtime shape:

```text
Idea Studio
  -> open-ended idea entry
  -> Goal Understanding Card
  -> learner confirms or revises Object / Change / Result
  -> Co-Planning Studio with one lightweight question at a time
  -> progressive draft trail preview
  -> Draft System Trail Review
  -> learner chooses first bounded build step
  -> confirmed System Trail Canvas with visual system tiles
  -> selected node detail
  -> choose one bounded system node
  -> Milestone Room
  -> student-authored checks
  -> Quiet AI checklist feedback
  -> Logic Chain
  -> Preview Stage
  -> Mismatch Lens / expected-vs-observed debug
  -> System Growth Map
  -> return to System Trail Canvas
```

The current implementation can use OpenAI through a local Node proxy. If `OPENAI_API_KEY` is missing, the frontend falls back to the deterministic MVP engine so UI work can continue without credentials.

The earlier `final wandan/` reference informed the guided-questioning pattern and visible planning artifact, but it is not part of this repository.

## Current Product Architecture

The app is now an open-ended systems-first creative programming studio, not a quiz product or generic SaaS dashboard. School Quiz Game is only one fixture.

```text
Level 1: Idea Studio + Goal Understanding + Co-Planning + System Trail Canvas
  What do I want to make? What is the object, change, and result? What parts does the system need, and why did we choose them?

Level 2: Milestone Room
  What one small behavior should work next? How will I know it works?

Level 3: Preview Feedback Loop
  What did I expect? What did I observe? What should I fix or connect next?
```

The current design integration reframes the primary surfaces around one calm studio object per screen:

```text
Idea Studio          -> open idea entry and optional starters
Goal Understanding   -> internal planning lens plus learner-facing Object / Change / Result confirmation
Co-Planning Studio   -> learner answers one question at a time while a draft trail grows
Draft Trail Review   -> learner selects, renames, removes, adds, reorders, and confirms parts
System Trail Canvas  -> confirmed abstract rail with completed/current/upcoming system tiles
Selected Node Detail -> Build / Split / Ask AI actions
Milestone Room       -> one expanded scaffold step at a time
Preview Stage        -> large live preview plus checklist-based checking
Mismatch Lens        -> "I wanted" vs "I saw" and the missing check
System Growth Map    -> what changed in the system
```

Quiet AI appears as a contextual nudge card rather than a full chat panel. Advanced actions such as code, history, reset, and rollback stay behind the compact top-bar controls.

Core product rule:

```text
System Trail Canvas is not generated for the learner; it is co-constructed with the learner.
Open-ended does not mean generic; the agent first understands the goal before asking planning questions.
```

The app must not route from idea input directly to a confirmed System Trail Canvas. The learner first confirms or revises the system understanding, participates in co-planning, reviews a draft trail, and chooses the first bounded milestone.

Goal Understanding is an internal planning layer, not a user-facing project-type picker. It infers a `planningLens` and universal system grammar from the learner's own words, then asks better adaptive questions. For example, a drawing/style idea uses the creative-transform-tool lens and asks how the drawing enters the tool, what transformation happens, and how the result is previewed instead of asking generic app verbs such as "Open it", "Choose something", or "Try an action".

Default UI copy now supports Chinese and English. The app starts in Chinese for learner-facing use, exposes a top-bar language toggle, and persists the choice in local storage. Technical labels are translated into Grade 3 language such as "what you see", "what you just added", "small step", and "what happens next".

## Root Files

```text
.
├── .gitignore
├── .vercelignore
├── index.html
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── .env.example
├── structure.md
├── api
│   ├── checklist
│   │   └── review.mjs
│   ├── goal
│   │   └── interview
│   │       ├── answer.mjs
│   │       └── start.mjs
│   └── project
│       └── path.mjs
├── ai
│   ├── agent.md
│   ├── runtime
│   ├── schemas
│   ├── skills
│   └── workflow
├── server
│   ├── api-server.mjs
│   ├── dev.mjs
│   ├── load-env.mjs
│   ├── openai-service.mjs
│   ├── planning-session-service.mjs
│   └── vercel-handler.mjs
├── student_ai_build_companion_prd.md
└── icce2026_short_paper.pdf
```

- `index.html`  
  Vite HTML entrypoint. Loads `src/main.tsx`.

- `.gitignore`  
  Keeps local secrets and generated artifacts out of version control, including `.env.local`, `.env`, `node_modules/`, `dist/`, `.vercel/`, browser screenshots, and temporary folders.

- `.vercelignore`  
  Keeps local-only secrets, generated artifacts, screenshots, and large research PDFs out of Vercel deployment uploads.

- `package.json`  
  Project metadata, dependencies, and scripts.

  ```text
  pnpm dev      # start local dev server
  pnpm api      # start only the local OpenAI API proxy, loading .env.local/.env first
  pnpm dev:vite # start only the Vite frontend
  pnpm build    # type-check and build production assets
  pnpm test     # run Vitest test suite
  pnpm preview  # serve production build locally
  ```

- `pnpm-lock.yaml`  
  Dependency lockfile generated by `pnpm install`.

- `tsconfig.json`  
  TypeScript compiler settings and `@/* -> src/*` path alias. It now type-checks `src/**/*.ts(x)` and the P0 agent runtime contracts in `ai/**/*.ts`.

- `vite.config.ts`  
  Vite configuration, React plugin, and path alias setup.

- `vitest.config.ts`  
  Vitest configuration for the engine test suite.

- `.env.example`  
  Example local environment variables for OpenAI API integration.

- `.env.local`  
  Local-only OpenAI credentials file. It is intentionally ignored by `.gitignore` and should not be committed.

- `structure.md`  
  This structure document.

- `server/`  
  Local API proxy and development orchestration. Keeps the OpenAI API key out of browser code.

- `api/`  
  Vercel serverless API entrypoints for production LLM-backed planning and checklist feedback routes:

  ```text
  POST /api/checklist/review
  POST /api/goal/interview/start
  POST /api/goal/interview/answer
  POST /api/project/path
  ```

  Build, patch, debug, checkpoint, and preview routes remain deterministic browser-local MVP routes through `mock-api.ts`.

- `student_ai_build_companion_prd.md`  
  Product requirements document. Source of product scope, UX principles, MVP requirements, data model, and risk constraints.

- `icce2026_short_paper.pdf`  
  Research paper source. Defines the Goal-to-Milestone framework behind the product.

## Source Tree

```text
src
├── main.tsx
├── app
│   └── globals.css
├── components
│   ├── build-companion-workspace.tsx
│   ├── p5-preview.tsx
│   └── project-path-map.tsx
└── lib
    ├── api-client.ts
    ├── i18n.ts
    ├── i18n.test.ts
    ├── mock-api.ts
    ├── mvp-engine.ts
    ├── mvp-engine.test.ts
    ├── p5-code.ts
    └── types.ts
```

## Source Responsibilities

### `src/main.tsx`

React entrypoint. Mounts `BuildCompanionWorkspace` into `#root` and imports global styles.

### `src/app/globals.css`

Global visual system for the prototype:

- open studio top app bar and horizontal stage chips
- open-ended Idea Studio with secondary starter ideas
- Co-Planning Studio with one question at a time, free input, "I'm not sure", learning-boundary notes, and draft preview
- Draft Trail Review with editable, removable, reorderable source-labeled nodes
- first-milestone chooser that gates the confirmed canvas
- abstract System Trail Canvas with curved rails, soft dot texture, and semantic system tiles
- selected node detail panel with Build / Split / Ask AI actions
- Milestone Room with scaffolded single-step panels
- student-authored checklist editor and short Quiet AI feedback
- Logic Chain cards for user action, system change, visible output, and user understanding
- Preview Stage with the p5 iframe as the largest object during testing
- Mismatch Lens with calm I wanted / I saw / missing check comparison
- System Growth Map with newly added system connection highlighted
- responsive behavior that stacks the studio into single-column panels and horizontal chips on mobile
- Chinese layout polish through `data-language="zh"`, `lang="zh-CN"`, `text-wrap: pretty`, loose line breaking, and stable button/card sizing

The CSS is intentionally app-surface oriented rather than landing-page oriented.

### `src/components/build-companion-workspace.tsx`

Main product workspace. Owns the interactive user flow:

- local `activeStage` state for Idea, Co-plan, Draft Review, First Milestone, System Trail, Milestone Room, Preview, Mismatch Lens, and Growth
- top studio shell with brand, breadcrumb, saved state, Help, learner avatar, language toggle, reset, rollback, and responsive stage chips
- local `uiLanguage` state, persisted with `goal-to-milestone-ui-language`, defaulting to Chinese and toggling to English without changing project data
- open-ended idea input with no default School Quiz content
- optional starter ideas for Pet Adventure Game, Club Task App, Story World Website, Habitat Simulation, and School Quiz Game
- project creation through `/api/planning/start`, returning a Goal Understanding Card and a planning shell with no confirmed `Project.systemTrail`
- Goal Understanding confirmation through `/api/planning/understanding`, requiring the learner to confirm or revise Object / Change / Result before co-planning begins
- Co-Planning Studio through `/api/planning/answer`, asking adaptive lens-specific questions one at a time and showing a draft trail preview marked "Not final yet"
- candidate system part selection, rename, add, remove, and reorder before a draft is created
- Draft Trail Review through `/api/planning/draft` and `/api/planning/review`
- first bounded build step confirmation through `/api/planning/confirm`
- System Trail Canvas rendered from `SystemNode` data, not hard-coded quiz milestones
- selected node detail panel with generic visible behavior, system role, rationale, dependencies, and actions
- Quiet AI contextual nudge card near the relevant object
- Milestone Room scaffold steps: story, checks, logic, build, preview, changed
- student-authored checklist before AI revision
- short supportive checklist feedback that does not silently replace learner wording
- Logic Chain generated from the selected node
- scoped build patch for one selected system node
- p5 live preview and manual checklist check-off with Yes / Not yet / I'm not sure
- Mismatch Lens visual debugging from expected-vs-observed behavior
- System Growth Map after completion
- checkpoint creation and rollback
- local storage hydration guard so returning project state is not overwritten by the initial empty render

This component calls `postJson()` from `src/lib/api-client.ts` using endpoint-style paths such as `/api/planning/start`, `/api/planning/understanding`, `/api/planning/answer`, `/api/planning/confirm`, and `/api/build/patch`.

Before a project is confirmed, Idea Studio captures any learner idea and starts a `PlanningSession`. The Goal Understanding Card shows the inferred title, learner-facing restatement, primary object, desired change, likely result, and any boundary note. The learner confirms or revises this understanding, then answers lightweight adaptive questions, chooses candidate system parts, reviews a draft trail, and chooses the first bounded milestone. Only then does the confirmed System Trail Canvas appear. The learner selects one confirmed node, opens a Milestone Room, writes checks, sees logic, builds one small step, tests preview behavior, debugs mismatches, and returns to the System Trail after the system grows.

### `src/lib/i18n.ts`

Display-language layer for the prototype.

Responsibilities:

- defines `UiLanguage` as `zh | en`
- stores the language preference key as `goal-to-milestone-ui-language`
- maps core app copy, stage labels, starter ideas, creative-tool co-planning choices, common fallback text, status labels, and agent nudges into Chinese
- keeps English mode unchanged
- includes small pattern translations for dynamic strings such as progress counts, rollback messages, and "this step added" summaries

### `src/lib/i18n.test.ts`

Vitest coverage for the language layer:

- core studio copy translates to Chinese
- English mode preserves English text
- creative-tool planning choices translate to Chinese

### `src/components/p5-preview.tsx`

Isolated p5.js live preview surface.

Responsibilities:

- renders the current p5 sketch inside a sandboxed iframe
- loads p5 from CDN inside the iframe
- applies a Content Security Policy inside `srcDoc`
- captures console messages and runtime errors through `postMessage`
- remounts the iframe when `runKey` changes

### `src/components/project-path-map.tsx`

Legacy canvas-like visual map for the older goal-to-path stage. The current product surface renders the open-ended System Trail Canvas directly inside `build-companion-workspace.tsx`; this component remains available for future advanced map/editing modes.

Responsibilities:

- displays the evolving path map title, summary, and confidence
- renders goal, experience, interaction, feedback, milestone, boundary, and later-path nodes
- marks each node as known, draft, or open
- includes flowchart toolbar affordances, legend, map confidence, and a visible "add next step" placeholder
- gives students a visible planning artifact before code generation

### `src/lib/types.ts`

Shared domain types for the MVP:

- `Project`
- `SystemTrail`
- `SystemNode`
- `SystemEdge`
- `MilestoneSuggestion`
- `PlanningSession`
- `PlanningResponse`
- `PlanningQuestion`
- `PlanningChoice`
- `PlanningLens`
- `ConfidenceLevel`
- `SystemGrammarSlot`
- `GoalUnderstanding`
- `CandidateSystemPart`
- `DraftSystemTrail`
- `DraftSystemNode`
- `ChecklistItem`
- `BuildEvent`
- `Checkpoint`
- `LearningTrace`
- `GoalInterviewTurn`
- `ProjectPathMap`
- `ProjectPathMapNode`
- `ProjectPathMapEdge`
- `GoalInterviewReadiness`
- `GoalInterviewResponse`
- `ClarificationResponse`
- `ProjectPathResponse`
- `PlanningStartResponse`
- `PlanningUnderstandingResponse`
- `PlanningAnswerResponse`
- `DraftTrailResponse`
- `ConfirmedTrailResponse`
- `MilestonePlanResponse`
- `LogicChainStep`
- `ChecklistFeedbackItem`
- `ChecklistFeedbackResponse`
- `PatchResponse`
- `PreviewState`
- `DebugDiagnosisResponse`

Keep new product state and API payload types here unless they are purely local UI implementation details.

### `src/lib/api-client.ts`

Frontend API client.

Responsibilities:

- sends endpoint-style requests to the local `/api/*` proxy
- falls back to `mock-api.ts` if the proxy is unavailable, returns a fallback status, or credentials are missing
- keeps UI code independent of the concrete AI provider
- routes build/patch/debug/checkpoint/preview calls directly to deterministic local logic so missing backend MVP endpoints are not treated as the normal network path
- routes `/api/planning/start`, `/api/planning/understanding`, `/api/planning/answer`, `/api/planning/draft`, `/api/planning/review`, and `/api/planning/confirm` through the local server first; server-side planning tries OpenAI structured output, then falls back to deterministic rules when the model/network is unavailable
- keeps `/api/planning/session/start` and `/api/planning/session/advance` available for the P0 agent runtime envelope contract
- keeps `/api/project/path` as a compatibility path, but the learner UI no longer uses it to skip co-planning
- routes `/api/checklist/review` to deterministic checklist feedback in the browser for the current P0 prototype

### `src/lib/mvp-engine.ts`

Deterministic Goal-to-Milestone engine.

Responsibilities:

- generates open-ended System Trails from learner ideas
- supports deterministic fixtures for Drawing Style Tool, Jumping Arcade Game, Homework Helper Agent, School Quiz Game, Pet Adventure Game, Club Task App, Story World Website, Habitat Simulation, and a generic fallback
- infers `GoalUnderstanding` from open-ended English or Chinese ideas before co-planning
- recognizes creative transformation ideas such as drawing/image/style/filter/sketch/画/绘画/图片/风格/滤镜/草图/上色 and maps them to the creative-transform-tool planning lens
- creates generic `Project` planning shells with empty `systemTrail` until the learner confirms a draft
- creates `PlanningSession` state, lens-specific planning choices, candidate system parts, draft trails, reviewed trails, and confirmed trails
- keeps School Quiz Game as only one optional fixture
- creates milestone story, Logic Chain, and prediction question from the selected `SystemNode`
- reviews student-authored checklist drafts and proposes observable shared checklist items
- generates scoped p5 preview snapshots for one selected node
- diagnoses bugs from visible behavior and failed checklist items

This is the best place to preserve product rules such as:

- no path, no full project
- no confirmed System Trail without learner review
- no first milestone without a reviewed draft trail
- no selected system node, no coding
- no learner-authored checklist, no coding
- patch must be scoped to the selected node
- checklist should be drafted by the student, improved by AI, and confirmed before build
- debug starts from preview behavior
- system maps should make action, system change, visible output, and user understanding visible
- systems thinking comes before computational implementation

### `src/lib/mock-api.ts`

Deterministic fallback adapter that simulates the planned API contract.

Responsibilities:

- maps endpoint-style strings to deterministic engine functions
- simulates small network delay
- handles co-planning endpoints before the confirmed System Trail exists
- handles session-style P0 agent runtime endpoints:
  - `POST /api/planning/session/start`
  - `POST /api/planning/session/advance`
- keeps `/api/project/path` with generic System Trail generation only for compatibility
- keeps legacy `/api/goal/interview/start` and `/api/goal/interview/answer` as compatibility shims
- handles `/api/checklist/review`
- creates checkpoint objects
- restores checkpoint snapshots

Future real backend integration should replace this file or branch inside it while keeping the calling contract stable.

## Agent Runtime

### `ai/agent.md`

AI constitution for the Goal-to-Milestone companion.

Responsibilities:

- defines the agent as a systems-first creative programming guide for G3-9 learners
- states that open-ended input must not degrade into generic planning prompts
- forbids final System Trail generation at entry
- forbids planning-time code generation
- requires one planning question at a time
- requires editable and rejectable AI suggestions
- states that workflow gates are authoritative

### `ai/skills/*.md`

One prompt module per planning skill.

P0 skills:

- `goal-understanding.md`
- `adaptive-co-planning-question.md`
- `goal-intake.md`
- `clarify-finished-artifact.md`
- `clarify-first-user-action.md`
- `clarify-first-system-response.md`
- `generate-candidate-system-parts.md`
- `refine-candidate-system-part.md`
- `assemble-draft-system-trail.md`
- `review-draft-system-trail.md`
- `suggest-first-milestone.md`

Each file describes what the LLM may do in that workflow state and what schema it must return. Global identity and boundaries remain in `agent.md`.

### `ai/schemas/*.ts`

Typed contracts for the P0 agent runtime.

Responsibilities:

- defines `AgentPlanningStatus`, `AgentSkillName`, `AgentAllowedAction`, and `AgentRuntimeResponse`
- defines `GoalUnderstanding`, planning lenses, universal system grammar slots, and skill result shapes such as `GoalUnderstandingResult`, `PlanningQuestionResult`, `CandidateSystemPartsResult`, `DraftSystemTrailResult`, and `FirstMilestoneRecommendationResult`
- validates visible system parts and draft trails
- detects implementation-task language such as `function`, `conditional`, `API`, `component`, and `state logic`

### `ai/workflow/*.ts`

Authoritative planning workflow and gates.

Responsibilities:

- maps planning state to the single allowed skill
- maps planning state to allowed UI actions
- blocks skipped steps such as draft assembly before candidate part selection
- blocks System Trail confirmation before draft review
- tests that co-planning returns candidate parts before any confirmed trail

Planning workflow:

```text
IDEA_CAPTURED
→ GOAL_UNDERSTANDING_GENERATED
→ GOAL_UNDERSTANDING_CONFIRMED
→ FINISHED_ARTIFACT_CLARIFIED
→ FIRST_ACTION_CLARIFIED
→ FIRST_RESPONSE_CLARIFIED
→ CANDIDATE_PARTS_GENERATED
→ PARTS_SELECTED_OR_EDITED
→ DRAFT_TRAIL_CREATED
→ DRAFT_TRAIL_REVIEWED
→ FIRST_MILESTONE_SELECTED
→ SYSTEM_TRAIL_CONFIRMED
```

### `ai/runtime/*.ts`

Minimal executable runtime skeleton for P0 planning.

Responsibilities:

- composes compact skill prompts from agent + skill + state context
- runs goal understanding before adaptive co-planning questions
- validates skill outputs before accepting them
- retries invalid model output once, then falls back
- creates audit events for passed, failed, and fallback outputs
- exposes local deterministic `startAgentPlanningSession()` and `advanceAgentPlanningSession()` wrappers matching the planned session-style API

This runtime is not yet the only production AI path. It is the testable foundation for replacing local-only co-planning calls with a backend workflow runtime.

### `src/lib/p5-code.ts`

p5.js sketch snapshots for preview generation.

Current included snapshots:

- starter sketch
- Milestone 1: start screen
- Milestone 2: first question and answer choices
- Milestone 3: answer feedback
- Milestone 4: score tracking
- Milestone 5: multiple questions and results

`codeForMilestone()` accepts a milestone object and maps snapshots by explicit `order` plus real milestone content (`title`, `visibleOutput`, `doneChecklist`), not by brittle `id` suffixes.
`codeForSystemNode()` keeps the quiz snapshots available for quiz-like nodes, but returns a neutral generic system preview for pet, task, story, habitat, and other open-ended ideas.

### `src/lib/mvp-engine.test.ts`

Vitest tests for the core research/product constraints.

Current coverage:

- UI language layer translates core studio copy and creative-tool choices
- open-ended idea does not default to School Quiz
- drawing/style ideas infer the creative-transform-tool planning lens
- creative-tool co-planning starts with drawing/image input source choices instead of generic app verbs
- co-planning answers are blocked until Goal Understanding is confirmed
- School Quiz remains one optional fixture
- different ideas generate different System Trails
- generated trails contain 4-6 visible system capabilities
- node titles avoid implementation-task language
- checklist items preserve `source: "student"` before AI suggestions
- Quiet AI checklist feedback is short and does not replace student wording
- Logic Chain is generated from the real selected node
- generated patch remains scoped to selected system node

## Server Responsibilities

### `server/api-server.mjs`

Local HTTP API proxy for OpenAI-backed planning routes.

Current routes:

- `POST /api/goal/interview/start`
- `POST /api/goal/interview/answer`
- `POST /api/project/path`
- `POST /api/checklist/review`
- `POST /api/planning/start`
- `POST /api/planning/understanding`
- `POST /api/planning/answer`
- `POST /api/planning/draft`
- `POST /api/planning/review`
- `POST /api/planning/confirm`
- `POST /api/planning/session/start`
- `POST /api/planning/session/advance`

Planning routes are handled locally and fall back deterministically when `OPENAI_API_KEY` is missing or a model call fails. Legacy OpenAI-only routes may still return `503`; the frontend API client catches those failures and uses deterministic fallback behavior where supported.

### `server/vercel-handler.mjs`

Shared JSON handler for Vercel serverless functions. It validates `POST` / `OPTIONS`, reads JSON request bodies, checks `OPENAI_API_KEY`, and normalizes JSON errors.

### `api/goal/interview/start.mjs`

Vercel function for `POST /api/goal/interview/start`. Delegates to `startGoalInterview()` in `server/openai-service.mjs`.

### `api/goal/interview/answer.mjs`

Vercel function for `POST /api/goal/interview/answer`. Delegates to `answerGoalInterview()` in `server/openai-service.mjs`.

### `api/project/path.mjs`

Vercel function for `POST /api/project/path`. Delegates to `generateProjectPath()` in `server/openai-service.mjs`.

### `api/checklist/review.mjs`

Vercel function for `POST /api/checklist/review`. Delegates to `reviewChecklist()` in `server/openai-service.mjs`, which returns Good / Too vague / Missing feedback plus a clearer shared checklist.

### `server/openai-service.mjs`

OpenAI Responses API integration.

Responsibilities:

- calls `configured OpenAI-compatible Responses endpoint`
- uses `OPENAI_MODEL`, defaulting to `gpt-5.5`
- requests structured JSON with a JSON schema
- asks for English student-facing UI text
- prompts the model to create an open-ended System Trail with 4-6 visible system capabilities
- rejects implementation-task node titles such as "write conditional" or "create function"
- keeps School Quiz Game as a fixture rather than the product default
- preserves the rule that no code is generated at entry
- prompts the model to review Grade 3 checklist drafts without grading or taking over
- normalizes model text lengths and repeated characters before returning UI-facing data
- uses `OPENAI_TIMEOUT_MS`, defaulting to a short local timeout, so blocked OpenAI network access does not freeze the learner flow

### `server/planning-session-service.mjs`

Server-side planning service for the co-planning flow and session-style planning contract.

Responsibilities:

- supports `POST /api/planning/start`
- supports `POST /api/planning/understanding`
- supports `POST /api/planning/answer`
- supports `POST /api/planning/draft`
- supports `POST /api/planning/review`
- supports `POST /api/planning/confirm`
- supports `POST /api/planning/session/start`
- supports `POST /api/planning/session/advance`
- tries OpenAI structured outputs for goal understanding, adaptive planning questions, candidate parts, and draft trail assembly
- falls back to deterministic co-planning rules when the OpenAI request times out or fails
- returns session data that preserves learner review before confirmed System Trail creation

### `server/load-env.mjs`

Tiny local `.env.local` / `.env` loader so the proxy can read `OPENAI_API_KEY` without adding another dependency.

Local secrets stay in `.env.local`, which is ignored by Git. Current local runtime expects `OPENAI_API_KEY`, `OPENAI_MODEL`, and optionally `OPENAI_TIMEOUT_MS`.

### `server/dev.mjs`

Loads local environment variables, then starts both the local API proxy and Vite dev server for `pnpm dev`.

## API Contract

The current frontend calls endpoint-style route names through `src/lib/api-client.ts`.
Goal interview and project path routes are backed by the local OpenAI proxy when credentials are available; all routes can fall back to deterministic local behavior during prototype work.

```text
POST /api/goal/interview/start
POST /api/goal/interview/answer
POST /api/planning/start
POST /api/planning/understanding
POST /api/planning/answer
POST /api/planning/draft
POST /api/planning/review
POST /api/planning/confirm
POST /api/planning/session/start
POST /api/planning/session/advance
POST /api/idea/clarify
POST /api/project/path
POST /api/checklist/review
POST /api/milestone/plan
POST /api/build/patch
POST /api/preview/run
POST /api/debug/diagnose
POST /api/checkpoint/create
POST /api/checkpoint/rollback
```

When more real backend routes are added, preserve the request/response shapes in `src/lib/types.ts` and `ai/schemas/*.ts` unless a migration is documented.

## OpenAI Configuration

Create `.env.local` from `.env.example` when an API key is available:

```text
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://api.openai.com
OPENAI_MODEL=gpt-5.5
OPENAI_TIMEOUT_MS=30000
API_PORT=8787
# Optional when OpenAI must be reached through a local proxy:
NODE_USE_ENV_PROXY=1
HTTPS_PROXY=http://127.0.0.1:7892
HTTP_PROXY=http://127.0.0.1:7892
```

Never expose `OPENAI_API_KEY` through `VITE_*` variables or browser-side code.
Proxy variables must be present before the API Node process starts, so `pnpm dev` loads `.env.local` before spawning the proxy.

## Generated / Ignored Runtime Artifacts

These are not product source files:

```text
node_modules/
dist/
tmp/
output/
.playwright-cli/
.vercel/
```

- `node_modules/` is installed dependency output.
- `dist/` is generated by `pnpm build`.
- `tmp/` is used for local review artifacts such as Playwright screenshots.
- `output/` and `.playwright-cli/` hold browser review artifacts.
- `.vercel/` is local Vercel project metadata.

Do not edit either by hand.

Recent visual verification screenshots in `output/`:

```text
grade3-idea-studio.png
grade3-flowchart-start.png
grade3-milestone-desktop.png
grade3-milestone-mobile.png
```

These are review artifacts only and should stay ignored.

## Maintenance Rules

- Update this document when adding, moving, renaming, or deleting source files.
- Keep file descriptions behavior-focused, not implementation trivia.
- If the API contract changes, update both `src/lib/types.ts` and the "API Contract" section here.
- If the app moves back from Vite to Next.js, update the root files and runtime overview.
