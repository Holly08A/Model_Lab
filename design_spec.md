# LLM Qualitative Comparator Design Spec

## 1. Product Summary

Build a browser-based LLM comparison tool for users with minimal coding knowledge. The app helps users:

1. Configure a small set of LLMs to compare
2. Choose qualitative evaluation metrics
3. Run the same prompt across multiple LLMs
4. Review responses side by side and score them
5. Save comparison results in browser-only storage

The product should feel guided, simple, and safe for non-technical users. Advanced flexibility is allowed, but the default experience should work with minimal setup.

## 2. Goals

- Make side-by-side LLM comparison easy for non-technical users
- Support both NVIDIA NIM APIs and OpenRouter API
- Allow quick setup with recommended default models
- Support manual qualitative scoring with 1-5 metrics
- Provide lightweight dashboards for cost, speed, and score comparison
- Persist configuration and saved runs in browser storage only

## 3. Non-Goals

- No server-side user accounts
- No cloud database
- No team collaboration or shared workspaces
- No automated judge model in v1
- No CSV/PDF export in v1 unless added later
- No cross-browser sync

## 4. Primary Users

- Product managers
- Founders
- Researchers
- Non-technical business users
- Developers who want a quick manual comparison UI without building scripts

## 5. Core Product Principles

- Simple first-run experience
- Friendly labels instead of API-heavy jargon
- Strong defaults with room to customize
- Clear cost/speed/quality tradeoffs
- Browser-only privacy for saved settings and results

## 6. Supported Providers

### 6.1 NVIDIA NIM

User provides:

- API key
- Model ID
- Display name
- Input price per 1K tokens
- Output price per 1K tokens

Assumption for v1:

- We will call NVIDIA NIM using an OpenAI-compatible chat completion pattern when supported by the selected endpoint.
- If some NIM models require provider-specific request differences, we will isolate those differences in a provider adapter layer.

### 6.2 OpenRouter

User provides:

- API key
- Model ID
- Display name
- Input price per 1K tokens
- Output price per 1K tokens

Assumption for v1:

- We will call OpenRouter via its chat completions API.
- Pricing is manually maintained by the user for consistency and transparency, even if provider pricing metadata may sometimes be available.

## 7. End-to-End User Flow

## 7.1 Step 1: Configure LLMs

The first screen is a guided setup page for models.

Required UX:

- Show a short default recommended list with 4-8 prefilled models total
- Each recommended model includes:
  - Provider
  - Model ID
  - Display name
  - Input price per 1K tokens
  - Output price per 1K tokens
- User enters API key per provider
- User can enable or disable models from the recommended list
- User can add custom models
- Custom models are saved in browser storage

Recommended default model list for v1:

1. OpenRouter - `openai/gpt-4o-mini`
2. OpenRouter - `anthropic/claude-3.5-haiku`
3. OpenRouter - `google/gemini-2.0-flash-exp`
4. OpenRouter - `meta-llama/llama-3.1-70b-instruct`
5. NVIDIA NIM - `meta/llama-3.1-70b-instruct`
6. NVIDIA NIM - `mistralai/mixtral-8x7b-instruct-v0.1`

Note:

- Exact default model IDs and prices should be stored in a local seed config so they are easy to update.
- Because provider catalogs change, these should be treated as editable defaults, not hardcoded truth.

Validation:

- At least 1 active model required
- API key required for each provider used in active models
- Prices must be numeric and non-negative
- Model ID and display name required

Storage behavior:

- Save provider API keys in browser storage
- Save user-added models in browser storage
- Save enabled/disabled state in browser storage

Privacy note:

- API keys remain only in the user's browser
- No backend persistence in v1

## 7.2 Step 2: Choose Metrics

The second screen lets users choose 1-5 scoring metrics.

Preset metric templates:

1. Accuracy
2. Instruction-following
3. Tone/style fit
4. Completeness
5. Hallucination risk

Required UX:

- User selects 1-5 metrics from preset templates
- User may rename the display label of a chosen metric
- Each metric is scored from 1-10
- Show short helper text under each preset

Recommended helper text:

- Accuracy: How correct and factually sound the answer appears
- Instruction-following: How well the response follows the prompt and constraints
- Tone/style fit: How well the response matches the desired voice or format
- Completeness: How fully the response covers the request
- Hallucination risk: How likely the answer contains unsupported or invented claims

Validation:

- Minimum 1 metric
- Maximum 5 metrics
- Metric labels must be unique within a run

## 7.3 Step 3: Test and Compare

After setup, user lands on a full-page comparison workspace with two tabs:

1. `LLM` tab
2. `Dashboard` tab

### LLM Tab Requirements

Layout:

- Prompt input area at the top
- Submit button
- Optional advanced controls tucked away behind a collapsible panel
- Model cards displayed below in a responsive grid

Prompt input:

- Large multi-line text box
- Clear placeholder with example prompt
- Disable submit while request is running
- Show progress state for each model

On submit:

- Send the same prompt to all active models
- Run requests concurrently where practical
- Each model card updates independently as results return

Per-model card overview:

- Fixed-size card
- Display name
- Provider badge
- Preview of response text, trimmed
- Token usage summary
- Estimated cost
- Response time
- Metric scoring summary
- Status state: idle, running, success, error

Per-model card detail modal:

- Full response text
- Full token usage
- Estimated cost breakdown
- Time to first token if available
- Full response time
- Scoring controls for each selected metric
- Optional notes field for reviewer comments

Scoring interaction:

- Each metric displayed as a 1-10 button scale
- User can tap/click a value to assign a score
- Scores autosave to browser memory for the current run

Card behavior:

- Fixed card dimensions in grid view
- Long text is truncated in preview
- Clicking a card opens a popup/modal with full details

### Dashboard Tab Requirements

Dashboard tab lives on the same screen and summarizes current run results.

Top 5 preview dashboards required:

1. Total tokens spent - least
2. Estimated cost - least
3. Latency to first token - least, optional if available
4. Full response time - least
5. One ranking dashboard per selected metric

Example:

- If user selected 4 metrics, dashboard tab shows 4 score-based ranking widgets plus the operational dashboards above

Dashboard behavior:

- Each dashboard shows top 5 ranked models
- Each item includes model name and key value
- Clicking a dashboard opens a detailed full ranking view for all compared LLMs

Ranking rules:

- Lower is better for tokens, cost, latency, and full response time
- Higher is better for metric scores
- Unscored models are ranked below scored models for metric dashboards
- Missing latency-to-first-token is shown as unavailable and excluded from that ranking

## 7.4 Step 4: Save Results

After review, user can save the comparison run to browser memory.

Saved result contents:

- Timestamp
- Prompt
- Selected models
- Model outputs
- Usage data
- Estimated cost
- Timing data
- Metric definitions
- Metric scores
- Reviewer notes

Save behavior:

- Saved only in this browser
- No sign-in required
- User can revisit saved runs later

Recommended UX:

- `Save Result` button in the workspace header
- Confirmation toast after save
- `Saved Runs` list accessible from home or workspace

## 8. Functional Requirements

## 8.1 Provider Configuration

- Support multiple models across both providers in the same run
- Support one API key per provider
- Allow enable/disable model without deleting it
- Allow edit/delete for custom models
- Preserve default recommended models across sessions
- Preserve custom models across sessions

## 8.2 Prompt Execution

- Use the same prompt for all active models
- Submit requests concurrently
- Handle per-model success/failure independently
- Show partial completion if some models fail
- Allow rerun of prompt without losing chosen metrics

## 8.3 Usage and Cost Tracking

For each response, capture where available:

- Input tokens
- Output tokens
- Total tokens
- Time to first token
- Full response time

Estimated cost formula:

- `input_cost = (input_tokens / 1000) * input_price_per_1k`
- `output_cost = (output_tokens / 1000) * output_price_per_1k`
- `total_cost = input_cost + output_cost`

If provider does not return some usage fields:

- Show `Unavailable`
- Keep ranking logic resilient to missing values

## 8.4 Manual Scoring

- Score each model on each selected metric from 1-10
- Allow clearing a score
- Autosave score changes in current run state
- Include scoring in saved results

## 8.5 Saved Runs

- List prior saved runs
- Open saved run in read-only or editable review mode
- Allow delete saved run
- Save only to browser storage

## 9. Non-Functional Requirements

- Friendly for non-technical users
- Responsive on laptop and tablet
- Good mobile fallback is helpful, but desktop-first is acceptable for v1
- Fast perceived performance
- Clear error states
- No backend required for initial release

## 10. Proposed Information Architecture

Primary screens:

1. Welcome / Setup
2. Step 1: Models
3. Step 2: Metrics
4. Comparison Workspace
5. Saved Runs

Alternative simplified IA:

- Single onboarding wizard for Step 1 and Step 2
- Main workspace for Step 3 and Step 4
- Saved Runs accessible via sidebar or top nav

Recommended approach:

- Use a 2-step onboarding wizard before entering the workspace
- Keep `LLM` and `Dashboard` as tabs inside the workspace

## 11. UX Recommendations

### 11.1 Tone

- Plain English labels
- Minimal jargon
- Explanatory helper text
- Visible defaults

### 11.2 Setup Simplicity

- Pre-populate recommended models
- Group models by provider
- Use a guided form with inline examples
- Add `Test API Key` later if needed, but not required for first build

### 11.3 Comparison Clarity

- Keep model cards visually consistent
- Separate system stats from human scoring
- Make response preview easy to skim
- Make metric buttons large and touch-friendly

### 11.4 Dashboard Clarity

- Use simple ranked cards or compact bar charts
- Favor clarity over dense analytics
- Every dashboard should answer one question only

## 12. Data Model

## 12.1 ProviderConfig

```ts
type ProviderType = "openrouter" | "nvidia-nim";

type ProviderConfig = {
  provider: ProviderType;
  apiKey: string;
};
```

## 12.2 ModelConfig

```ts
type ModelConfig = {
  id: string;
  provider: ProviderType;
  modelId: string;
  displayName: string;
  inputPricePer1k: number;
  outputPricePer1k: number;
  enabled: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};
```

## 12.3 MetricConfig

```ts
type MetricConfig = {
  id: string;
  key:
    | "accuracy"
    | "instruction_following"
    | "tone_style_fit"
    | "completeness"
    | "hallucination_risk"
    | "custom";
  label: string;
  description?: string;
};
```

## 12.4 RunResult

```ts
type RunResult = {
  id: string;
  prompt: string;
  createdAt: string;
  models: ModelRunResult[];
  metrics: MetricConfig[];
};

type ModelRunResult = {
  modelConfigId: string;
  provider: ProviderType;
  modelId: string;
  displayName: string;
  status: "idle" | "running" | "success" | "error";
  responseText?: string;
  responsePreview?: string;
  errorMessage?: string;
  usage: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  timing: {
    latencyToFirstTokenMs?: number;
    fullResponseTimeMs?: number;
  };
  estimatedCost: {
    inputCost?: number;
    outputCost?: number;
    totalCost?: number;
  };
  scores: Record<string, number | null>;
  notes?: string;
};
```

## 12.5 SavedRun

```ts
type SavedRun = RunResult & {
  savedAt: string;
};
```

## 13. Storage Strategy

Recommended browser storage:

- `localStorage` for lightweight preferences
- `IndexedDB` for saved runs and larger response payloads

Recommendation:

- Use `localStorage` for:
  - Provider API keys
  - Active metrics template
  - Model list settings
- Use `IndexedDB` for:
  - Saved comparison runs
  - Large response bodies
  - Per-run review state

Reason:

- Full model responses may exceed practical `localStorage` limits over time

## 14. Technical Architecture Recommendation

Recommended stack for v1:

- Frontend: Next.js or React SPA
- UI: component library plus custom dashboard cards
- State: React state plus persisted client storage
- Storage: localStorage + IndexedDB
- Charts: lightweight chart library or custom ranking cards

Recommended application layers:

1. UI layer
2. Client state layer
3. Provider adapter layer
4. Persistence layer

Provider adapter responsibilities:

- Normalize request payloads
- Normalize responses into a common result shape
- Capture timing
- Capture usage fields where available
- Return consistent error objects

## 15. Provider Adapter Design

Common interface:

```ts
type GenerateParams = {
  apiKey: string;
  modelId: string;
  prompt: string;
};

type GenerateResult = {
  responseText: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  timing?: {
    latencyToFirstTokenMs?: number;
    fullResponseTimeMs?: number;
  };
};

interface ProviderAdapter {
  generate(params: GenerateParams): Promise<GenerateResult>;
}
```

Adapters:

- `OpenRouterAdapter`
- `NvidiaNimAdapter`

## 16. Error Handling

Required error cases:

- Missing API key
- Invalid API key
- Network failure
- Rate limit
- Unsupported model ID
- Provider timeout
- Partial run failure

UX behavior:

- Errors should appear at model-card level where possible
- One failed model must not block the whole run
- User can retry failed models

## 17. Accessibility Requirements

- Keyboard navigable setup and scoring UI
- Focus trapping in modal
- Sufficient button contrast
- Clear hover and selected states for 1-10 score buttons
- Screen-reader labels for dashboards and cards

## 18. Security and Privacy

- API keys stored only in browser
- No backend persistence in v1
- Clearly communicate browser-local storage behavior
- Provide easy delete/reset all local data action

## 19. Suggested v1 Screens in Detail

## 19.1 Setup Screen

Sections:

- Intro text
- Provider API key cards
- Recommended models list
- Add custom model form
- Continue button

## 19.2 Metrics Screen

Sections:

- Preset metric checklist
- Custom label inputs
- Continue button

## 19.3 Workspace Screen

Header:

- Page title
- Active model count
- Selected metric count
- Save Result button

Tabs:

- `LLM`
- `Dashboard`

LLM tab body:

- Prompt composer
- Run button
- Model cards grid

Dashboard tab body:

- Ranking widgets
- Drill-down modal or detail page

## 19.4 Saved Runs Screen

Sections:

- Search or filter later if needed
- List of saved runs
- Open
- Delete

## 20. Open Decisions for Build Phase

These do not block the spec, but should be finalized during implementation:

1. Exact default model list and initial price seed
2. Whether latency-to-first-token is measurable for both providers in v1
3. Whether saved runs reopen as editable or read-only by default
4. Whether prompt history is stored separately from saved runs
5. Whether we support streaming output in v1 or just final response rendering

## 21. Recommended v1 Build Scope

Include:

- Model setup wizard
- Provider API key storage
- Default + custom models
- Metric selection
- Multi-model prompt run
- Side-by-side response cards
- Manual scoring
- Dashboard rankings
- Save and reopen runs from browser storage

Defer:

- Export
- Sharing
- Automated evals
- Prompt templates library
- Multi-user mode
- Versioned benchmark sets

## 22. Acceptance Criteria

### Setup

- User can launch app and see 4-8 recommended models prefilled
- User can enter API key for OpenRouter and/or NVIDIA NIM
- User can add a custom model and find it again after refresh

### Metrics

- User can choose between 1 and 5 metrics
- User can rename selected metric labels

### Comparison

- User can input a prompt and run it across all active models
- Each model shows response preview, token usage, estimated cost, and response time
- Clicking a card opens full response and scoring details
- User can score each metric from 1-10

### Dashboard

- User can switch to dashboard tab
- User can see top-5 rankings for least tokens, least estimated cost, least full response time, optional least latency to first token, and each selected metric
- User can open each dashboard to see full rankings

### Persistence

- User can save a run
- Saved run remains available after refresh in the same browser
- User can delete saved runs

## 23. Suggested Build Order

1. App shell and storage foundation
2. Model configuration step
3. Metric selection step
4. Provider adapters
5. Workspace cards and prompt execution
6. Manual scoring modal
7. Dashboard tab
8. Saved runs

## 24. Assumptions Used In This Spec

- Browser-only persistence is acceptable for v1
- API keys may be stored locally in the browser for convenience
- Pricing is user-editable and not auto-synced from providers
- Manual review is the main evaluation method
- The app is optimized for desktop first

## 25. Recommended Next Deliverable

After approval of this spec, the next artifact should be:

- `implementation_plan.md`

That file should define:

- frontend stack choice
- route/screen structure
- component tree
- storage schema
- provider integration tasks
- phased build checklist
