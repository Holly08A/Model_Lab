# Local LLM Comparator

A local-first LLM comparator for side-by-side model evaluation, prompt testing, qualitative scoring, and cross-run benchmarking.

This open-source app helps you compare responses from multiple LLMs in one browser-based workspace, score them with your own evaluation criteria, and review how each model performs over time without needing to build scripts or dashboards yourself.

It is designed for product teams, AI builders, researchers, and non-technical evaluators who want a user-friendly way to run and review LLM comparisons locally.

## Why Use This

If you are testing prompts or deciding between models, you often need more than a raw response dump. You need a way to:

- run the same test against multiple LLMs
- compare outputs side by side
- separate system prompt and user prompt
- score quality consistently
- track cost, tokens, and response time
- save results locally for future review
- aggregate ratings across many runs and test cases

This project provides that workflow in a local browser app.

## What This Project Is

`Local LLM Comparator` is a browser-local evaluation app that supports:

- OpenRouter models
- NVIDIA NIM models
- manual qualitative scoring
- custom evaluation dimensions
- saved test cases and runs
- cross-run aggregated LLM ratings

Everything is designed around a local-first workflow:

- API keys stay in browser storage
- saved runs stay in IndexedDB in the same browser
- no account system is required
- no cloud sync is required

## Key Features

### Multi-Model LLM Comparison

- compare multiple LLMs in one workspace
- run the same test across all active models
- view results as fixed-size cards for easy scanning
- open full response details in a modal

### Separate System Prompt and User Prompt

- define an optional `System prompt`
- define the `User prompt` separately
- reuse saved prompts in future runs
- structure prompt testing more realistically for chat-model evaluation

### Local Prompt Testing Workflow

- add a `Test case name`
- reuse the same prompts from saved runs
- reopen full saved reviews
- create new runs from previous test cases

### Qualitative Evaluation and Scoring

- use preset scoring dimensions
- add unlimited custom scoring dimensions
- score each model from 1-10 for each dimension
- add optional reviewer notes

### Operational Comparison

- compare full response time
- compare total token usage
- compare estimated cost
- view ranking dashboards for each metric and score

### Saved Runs and Historical Review

- save comparison runs locally
- reopen old runs
- delete saved runs
- warn on unsaved review changes

### LLM Ratings Across Runs

- aggregate performance by LLM across saved runs
- filter ratings by test case
- view average overall score
- view per-metric averages
- view average full response time
- view average token usage
- view average estimated cost

## Example Use Cases

- Compare GPT, Claude, Qwen, Llama, and Mistral models for one prompt.
- Test different customer support prompts with the same evaluation rubric.
- Run multiple saved test cases and track which LLM performs best overall.
- Review model quality locally before choosing a provider or prompt strategy.
- Benchmark models across internal use cases without building a custom eval tool.

## Product Flow

1. Open `Setup`
2. Add your OpenRouter and/or NVIDIA NIM API key
3. Enable curated models or add your own
4. Choose preset metrics and/or create custom ones
5. Open `Workspace`
6. Enter:
   - `Test case name`
   - `System prompt`
   - `User prompt`
7. Run the comparison
8. Score model outputs
9. Save the run
10. Review `Saved Runs` or aggregated results in `Ratings`

## Screenshots

### Setup

![Setup screen](docs/images/setup.png)

### Workspace

![Workspace screen](docs/images/workspace.png)

### Ratings

![Ratings screen](docs/images/ratings.png)

## Current Feature Set

### Setup and Model Configuration

- OpenRouter support
- NVIDIA NIM support
- curated starter model list
- custom model entry
- browser-persisted model setup

### Prompt Evaluation

- separate system prompt and user prompt
- test case naming
- side-by-side prompt execution
- response preview cards
- full response review modal

### Scoring

- preset scoring dimensions
- unlimited custom scoring dimensions
- 1-10 scoring for every dimension
- reviewer notes

### Dashboard and Ratings

- ranking dashboards for:
  - least total tokens
  - least estimated cost
  - fastest full response time
  - each selected scoring metric
- dashboard drill-down ranking modal
- aggregated LLM ratings page
- test case filtering in ratings

### Saved Review Workflow

- save runs in browser-local storage
- reopen saved runs with previous results
- reuse saved prompts to create fresh runs
- delete saved runs

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Zustand
- Dexie / IndexedDB
- React Hook Form
- Zod

## Getting Started

### Requirements

- Node.js 20+ recommended
- npm

### Install

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
```

## Supported Providers

### OpenRouter

Use your OpenRouter API key and any supported OpenRouter model ID.

### NVIDIA NIM

Use your NVIDIA API key and any supported NVIDIA NIM model ID.

The app currently routes provider calls through its internal `/api/compare` route so the browser is not calling provider endpoints directly.

## Privacy and Local Storage

This is a local-first LLM comparator.

- API keys are stored only in local browser storage
- saved runs are stored in IndexedDB
- there is no built-in user account system
- there is no shared cloud database
- there is no cross-device sync

If you clear browser storage, your saved setup and runs will be removed.

## Repository Structure

```text
src/
  app/
    api/compare/
    ratings/
    saved/
    workspace/
  components/
    dashboard/
    ratings/
    saved-runs/
    setup/
    workspace/
  lib/
    constants/
    providers/
    scoring/
    storage/
    utils/
    validation/
  stores/
  types/
docs/
  images/
```

## Current Status

The app currently supports the full local comparison workflow:

- configure models
- compare multiple LLMs
- separate system and user prompts
- score outputs with custom dimensions
- save runs
- reopen or reuse prompts
- aggregate model ratings across test cases

Not implemented yet:

- latency to first token
- auth / multi-user mode
- cloud sync
- export to CSV or PDF
- automated model-as-judge scoring

## Who This Is For

This project is especially useful for:

- AI product teams
- prompt engineers
- internal eval workflows
- LLM benchmarking experiments
- founders choosing model providers
- researchers comparing outputs locally

## Contributing

Issues and pull requests are welcome.

Helpful contributions include:

- bug fixes
- provider support improvements
- UX improvements for evaluators
- export features
- better analytics and filtering
- accessibility improvements

If you contribute, please keep the local-first privacy model in mind unless your change intentionally expands beyond that scope.

## License

[MIT](LICENSE)
