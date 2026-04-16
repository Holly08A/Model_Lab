# LLM Qualitative Comparator Implementation Plan

## 1. Delivery Goal

Build a browser-based LLM qualitative comparator that:

- supports OpenRouter and NVIDIA NIM
- is easy for non-technical users to set up
- runs one prompt across multiple models
- allows manual scoring across 1-5 metrics
- shows ranking dashboards
- saves models, settings, and results in browser storage only

This plan assumes we are building v1 with no backend and no user accounts.

## 2. Recommended Stack

## 2.1 Core Stack

- Framework: Next.js 15 App Router
- Language: TypeScript
- Styling: Tailwind CSS
- UI primitives: shadcn/ui
- Icons: lucide-react
- Client state: Zustand
- Forms: React Hook Form + Zod
- Browser persistence: localStorage + IndexedDB via Dexie
- Charts: Recharts
- Utilities: date-fns, nanoid

## 2.2 Why This Stack

- Next.js gives us a clean app shell and easy deployment later
- TypeScript helps keep provider adapters and storage models consistent
- Tailwind + shadcn/ui is fast to build and easy to keep user friendly
- Zustand keeps client state simple without heavy boilerplate
- Dexie makes IndexedDB reliable enough for saved runs and large responses
- Recharts is sufficient for lightweight ranking views in v1

## 3. App Structure

Recommended app structure:

```text
src/
  app/
    layout.tsx
    page.tsx
    workspace/page.tsx
    saved/page.tsx
  components/
    app-shell/
    setup/
    workspace/
    dashboard/
    saved-runs/
    shared/
  lib/
    constants/
    providers/
    scoring/
    storage/
    utils/
    validation/
  stores/
  types/
```

## 4. Route and Screen Plan

## 4.1 Routes

### `/`

Purpose:

- Landing + setup wizard entry
- Steps 1 and 2 combined into guided onboarding

Contains:

- intro panel
- provider API key cards
- recommended models list
- custom model form
- metric selection panel
- continue button to workspace

### `/workspace`

Purpose:

- Main comparison environment

Contains:

- header
- `LLM` tab
- `Dashboard` tab
- save action
- run history state for current unsaved session

### `/saved`

Purpose:

- Browse and reopen saved runs

Contains:

- saved runs list
- open action
- delete action

## 4.2 Screen Flow

1. User opens `/`
2. User enters API keys
3. User enables default models and optionally adds custom models
4. User selects 1-5 metrics
5. User continues to `/workspace`
6. User submits prompt
7. User reviews card details and scores models
8. User switches to dashboard tab for rankings
9. User saves the run
10. User later reopens run from `/saved`

## 5. State Management Plan

## 5.1 State Categories

### Persisted lightweight app state in localStorage

- provider API keys
- model catalog
- enabled model IDs
- chosen metrics template
- last-used setup values

### Persisted run data in IndexedDB

- saved runs
- saved run details
- model responses
- per-model notes and scores

### In-memory session state in Zustand

- current prompt
- active run status
- per-model loading/error state
- current tab
- current modal state
- unsaved review changes

## 5.2 Store Layout

Recommended Zustand stores:

1. `useSetupStore`
2. `useWorkspaceStore`
3. `useSavedRunsStore`

### `useSetupStore`

Responsibilities:

- provider API key management
- model list management
- metric selection
- wizard validation

### `useWorkspaceStore`

Responsibilities:

- current prompt
- active run results
- score updates
- modal open/close state
- save current run

### `useSavedRunsStore`

Responsibilities:

- load saved runs list
- open saved run
- delete saved run

## 6. Component Tree

## 6.1 App Shell

```text
AppShell
  TopNav
  PageContainer
```

## 6.2 Setup Screen Components

```text
SetupWizardPage
  SetupIntroCard
  ProviderKeysSection
    ProviderKeyCard
  RecommendedModelsSection
    ModelToggleCard
  CustomModelsSection
    CustomModelForm
    CustomModelList
  MetricsSection
    MetricTemplatePicker
    MetricLabelEditor
  SetupFooterActions
```

## 6.3 Workspace Components

```text
WorkspacePage
  WorkspaceHeader
  WorkspaceTabs
  LlmTab
    PromptComposer
    RunControls
    ModelCardGrid
      ModelResultCard
    ModelDetailDialog
      ResponsePanel
      UsageStatsPanel
      TimingStatsPanel
      MetricScorePanel
      ReviewerNotesField
  DashboardTab
    DashboardGrid
      RankingWidget
    RankingDetailDialog
```

## 6.4 Saved Runs Components

```text
SavedRunsPage
  SavedRunsHeader
  SavedRunList
    SavedRunListItem
  SavedRunPreviewDialog
```

## 7. Data Types

These should be defined centrally in `src/types`.

Core types:

- `ProviderType`
- `ProviderConfig`
- `ModelConfig`
- `MetricConfig`
- `RunResult`
- `ModelRunResult`
- `SavedRun`
- `ProviderError`
- `RankingMetric`

Recommended additions beyond the spec:

```ts
type RunStatus = "idle" | "running" | "completed" | "partial-error";

type ProviderError = {
  code:
    | "missing_api_key"
    | "invalid_api_key"
    | "network_error"
    | "rate_limited"
    | "timeout"
    | "unsupported_model"
    | "unknown";
  message: string;
};

type RankingMetric =
  | "total_tokens"
  | "estimated_cost"
  | "latency_to_first_token"
  | "full_response_time"
  | `score:${string}`;
```

## 8. Storage Schema

## 8.1 localStorage Keys

Recommended keys:

```ts
const STORAGE_KEYS = {
  providerKeys: "llm-comparator.provider-keys",
  models: "llm-comparator.models",
  selectedMetrics: "llm-comparator.selected-metrics",
  onboardingComplete: "llm-comparator.onboarding-complete",
  workspacePrefs: "llm-comparator.workspace-prefs",
} as const;
```

Stored payloads:

- `providerKeys`: record keyed by provider type
- `models`: array of `ModelConfig`
- `selectedMetrics`: array of `MetricConfig`
- `workspacePrefs`: UI preferences such as last open tab

## 8.2 IndexedDB Schema

Database name:

- `llm-comparator-db`

Dexie tables:

```ts
savedRuns: "id, createdAt, savedAt"
```

Suggested IndexedDB object shape:

```ts
type SavedRunRecord = {
  id: string;
  prompt: string;
  createdAt: string;
  savedAt: string;
  metrics: MetricConfig[];
  models: ModelRunResult[];
};
```

Future-safe optional tables:

- `draftRuns`
- `promptHistory`

For v1, one `savedRuns` table is enough.

## 9. Validation Plan

## 9.1 Setup Validation

Use Zod schemas for:

- provider key input
- custom model form
- metric selection constraints

Rules:

- at least 1 enabled model
- required API key for every used provider
- numeric prices only
- non-negative prices
- unique model IDs within provider
- 1-5 metrics only
- unique metric labels

## 9.2 Prompt Validation

Rules:

- prompt cannot be empty
- trim whitespace
- disable run if no active models

## 9.3 Scoring Validation

Rules:

- score values allowed: `1-10` or `null`
- one score per model per selected metric

## 10. Provider Integration Plan

## 10.1 Provider Layer Structure

```text
src/lib/providers/
  base.ts
  openrouter.ts
  nvidia-nim.ts
  normalize.ts
  errors.ts
```

## 10.2 Provider Interface

```ts
export type GenerateParams = {
  apiKey: string;
  modelId: string;
  prompt: string;
  signal?: AbortSignal;
};

export type GenerateResult = {
  responseText: string;
  usage: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  timing: {
    latencyToFirstTokenMs?: number;
    fullResponseTimeMs?: number;
  };
};

export interface ProviderAdapter {
  generate(params: GenerateParams): Promise<GenerateResult>;
}
```

## 10.3 OpenRouter Adapter Tasks

Implementation tasks:

1. Build request function for OpenRouter chat completions
2. Add auth header from local provider config
3. Normalize response text extraction
4. Normalize usage fields
5. Measure full response time
6. Add optional latency-to-first-token support later if streaming is enabled
7. Map API errors to app-level `ProviderError`

## 10.4 NVIDIA NIM Adapter Tasks

Implementation tasks:

1. Build request function for NVIDIA NIM compatible endpoint
2. Add bearer auth support
3. Normalize chat-completions style response
4. Normalize usage fields
5. Measure full response time
6. Keep adapter isolated so endpoint/request changes are easy later
7. Map API errors to app-level `ProviderError`

## 10.5 Timing Capture Strategy

### v1 baseline

- Measure `fullResponseTimeMs` with `performance.now()`
- Do not block v1 on latency-to-first-token support

### v1.1 optional

- Add streaming request support
- capture first chunk arrival time as `latencyToFirstTokenMs`

## 10.6 Cost Calculation Module

Create a shared utility:

```text
src/lib/utils/cost.ts
```

Responsibilities:

- compute input cost
- compute output cost
- compute total cost
- safely handle missing token fields

## 11. Execution Flow Plan

## 11.1 Run Prompt Flow

1. User enters prompt
2. App validates prompt and active models
3. App creates a new in-memory run object
4. App starts provider requests concurrently
5. Each model card updates as request resolves
6. App stores normalized results in workspace store
7. User opens details and assigns scores
8. User saves run to IndexedDB

## 11.2 Concurrency Strategy

Use:

- `Promise.allSettled` for multi-model execution

Reason:

- one failed provider should not block other results

Per-model lifecycle:

1. set status to `running`
2. call provider adapter
3. on success set result fields
4. on error set error state and preserve run continuity

## 11.3 Retry Strategy

Support:

- rerun full prompt across all active models
- rerun a single failed model from card or modal later if desired

For v1:

- full rerun is required
- single-model retry can be added if implementation stays simple

## 12. Dashboard Plan

## 12.1 Dashboard Widgets

Each widget contains:

- title
- short explanatory label
- top 5 ranking list
- click target for full ranking dialog

Default widget types:

1. Least total tokens
2. Least estimated cost
3. Least latency to first token if available
4. Least full response time
5. One widget per selected metric

## 12.2 Dashboard Computation Module

Create:

```text
src/lib/scoring/rankings.ts
```

Responsibilities:

- compute ranking arrays
- sort low-to-high or high-to-low depending on metric
- exclude missing values where necessary
- push unavailable entries to bottom

## 12.3 Visual Style Recommendation

For v1:

- use ranking cards first
- use simple horizontal bars second

Do not overbuild charts early. The user mainly needs clear rankings.

## 13. UX Implementation Notes

## 13.1 Setup UX

- Pre-enable 3-4 recommended models so first run feels easy
- Keep provider API key entry above model configuration
- Use inline helper text under pricing fields
- Mark custom models clearly

## 13.2 Workspace UX

- Keep prompt box sticky near top
- Show loading skeletons on cards while models run
- Use consistent fixed-height cards
- Truncate preview text to 5-8 lines
- Put most important stats directly on card

## 13.3 Scoring UX

- Use large segmented 1-10 buttons
- Show clear selected state
- Allow clear/reset score action
- Keep notes field optional

## 13.4 Save UX

- Warn if user tries to leave with unsaved scores or notes
- Show toast when saved
- Include readable run title based on timestamp and prompt preview

## 14. Accessibility Plan

Implementation requirements:

- all dialogs must trap focus
- all icon buttons need text labels or `aria-label`
- scoring controls need keyboard support
- cards must remain usable on zoomed layouts
- chart widgets need text equivalents

## 15. File Plan

Recommended initial file set:

```text
src/app/layout.tsx
src/app/page.tsx
src/app/workspace/page.tsx
src/app/saved/page.tsx

src/components/setup/setup-wizard-page.tsx
src/components/setup/provider-keys-section.tsx
src/components/setup/recommended-models-section.tsx
src/components/setup/custom-model-form.tsx
src/components/setup/metrics-section.tsx

src/components/workspace/workspace-page.tsx
src/components/workspace/prompt-composer.tsx
src/components/workspace/model-result-card.tsx
src/components/workspace/model-detail-dialog.tsx

src/components/dashboard/dashboard-tab.tsx
src/components/dashboard/ranking-widget.tsx
src/components/dashboard/ranking-detail-dialog.tsx

src/components/saved-runs/saved-runs-page.tsx

src/lib/constants/default-models.ts
src/lib/providers/base.ts
src/lib/providers/openrouter.ts
src/lib/providers/nvidia-nim.ts
src/lib/providers/errors.ts
src/lib/scoring/rankings.ts
src/lib/storage/db.ts
src/lib/storage/local.ts
src/lib/utils/cost.ts
src/lib/utils/format.ts
src/lib/validation/setup.ts

src/stores/setup-store.ts
src/stores/workspace-store.ts
src/stores/saved-runs-store.ts

src/types/index.ts
```

## 16. Build Phases

## Phase 1: Foundation

Goal:

- create project shell and core types

Tasks:

1. scaffold Next.js app with TypeScript and Tailwind
2. install shadcn/ui baseline and key dependencies
3. create route skeletons
4. define shared types
5. add default model seed config
6. add localStorage and IndexedDB wrappers

Exit criteria:

- app runs locally
- routes exist
- defaults load from client storage layer

## Phase 2: Setup Wizard

Goal:

- complete Step 1 and Step 2

Tasks:

1. build provider API key inputs
2. build recommended model list with enable/disable
3. build custom model add/edit/delete form
4. persist model state
5. build metric selector with custom labels
6. enforce validation rules
7. continue into workspace

Exit criteria:

- user can configure providers, models, and metrics
- values survive refresh

## Phase 3: Provider Adapters

Goal:

- connect to OpenRouter and NVIDIA NIM

Tasks:

1. implement provider base interface
2. implement OpenRouter adapter
3. implement NVIDIA NIM adapter
4. normalize usage and error handling
5. add cost calculation utility

Exit criteria:

- app can send prompt to both providers and get normalized responses

## Phase 4: Workspace and Comparison Cards

Goal:

- complete main comparison loop

Tasks:

1. build prompt composer
2. execute prompt across enabled models
3. create fixed-size result cards
4. show preview response, usage, cost, and timing
5. build modal for full details
6. add loading, success, and error states

Exit criteria:

- user can run prompt and compare side-by-side results

## Phase 5: Scoring

Goal:

- enable manual evaluation workflow

Tasks:

1. build 1-10 score controls per selected metric
2. save score changes in workspace state
3. support optional reviewer notes
4. include score summaries on cards

Exit criteria:

- user can score every model on chosen metrics

## Phase 6: Dashboard

Goal:

- summarize performance and score rankings

Tasks:

1. compute ranking metrics
2. render top 5 widgets
3. add per-widget full ranking modal
4. handle missing latency gracefully

Exit criteria:

- user can review rankings across operational and qualitative dimensions

## Phase 7: Saved Runs

Goal:

- persist review outcomes

Tasks:

1. save current run to IndexedDB
2. build saved runs list
3. reopen saved runs
4. delete saved runs
5. add unsaved-changes guard if time permits

Exit criteria:

- user can save, reopen, and delete browser-local runs

## Phase 8: Polish

Goal:

- improve reliability and usability

Tasks:

1. accessibility pass
2. empty-state polish
3. error-message refinement
4. loading-state polish
5. mobile/tablet layout sanity check
6. reset local data action

Exit criteria:

- app feels usable and clear for non-technical users

## 17. Testing Plan

## 17.1 Unit Tests

Prioritize:

- cost calculation
- ranking logic
- setup validation
- provider response normalization

## 17.2 Component Tests

Prioritize:

- setup wizard validation states
- model card rendering
- metric score interactions
- dashboard ranking output

## 17.3 Manual QA Flows

Required manual checks:

1. first-time onboarding with default models
2. add custom OpenRouter model
3. add custom NVIDIA NIM model
4. run prompt with 2-6 models
5. partial failure on one provider
6. score all metrics
7. save and reopen run
8. refresh browser and confirm persistence

## 18. Key Risks and Mitigations

## Risk 1: Browser CORS or provider request constraints

Mitigation:

- validate direct-browser request feasibility early
- if blocked, pivot to a tiny local proxy or edge function in v1.1

## Risk 2: Inconsistent usage metadata across providers

Mitigation:

- normalize optional fields
- show `Unavailable` cleanly
- do not let missing fields break rankings

## Risk 3: Large responses filling storage

Mitigation:

- use IndexedDB for saved runs
- keep only one current draft in memory
- optionally truncate preview separately from full response

## Risk 4: Non-technical users confused by model IDs and pricing

Mitigation:

- emphasize display names
- tuck technical fields behind expandable advanced rows where possible
- prefill useful examples

## 19. Recommended Defaults for First Build

Choose these implementation defaults unless we decide otherwise:

- desktop-first responsive layout
- no streaming in v1
- full response time only in v1
- editable saved-run reopen behavior
- ranking-card UI before richer charting

## 20. Immediate Next Build Tasks

If we start implementation right away, the first coding sprint should be:

1. scaffold Next.js app
2. add types, seed model config, and storage wrappers
3. build setup wizard UI
4. wire local persistence
5. stub provider adapters with mock results

That gives us a clickable prototype quickly before real provider integration.
