"use client";

import { useEffect } from "react";
import { DashboardTab } from "@/components/dashboard/dashboard-tab";
import { ModelDetailDialog } from "@/components/workspace/model-detail-dialog";
import { ModelResultCard } from "@/components/workspace/model-result-card";
import { PromptComposer } from "@/components/workspace/prompt-composer";
import { useSetupStore } from "@/stores/setup-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

function formatProvider(provider: "openrouter" | "nvidia-nim") {
  return provider === "openrouter" ? "OpenRouter" : "NVIDIA NIM";
}

export function WorkspacePage() {
  const { hydrate, hydrated, models, selectedMetrics } = useSetupStore();
  const {
    testCaseName,
    systemPrompt,
    userPrompt,
    isRunning,
    activeTab,
    results,
    selectedResultId,
    runError,
    saveMessage,
    hasUnsavedChanges,
    setTestCaseName,
    setSystemPrompt,
    setUserPrompt,
    setActiveTab,
    openResult,
    closeResult,
    scoreMetric,
    setNotes,
    startNewRun,
    runPrompt,
    saveCurrentRun,
  } = useWorkspaceStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const activeModels = models.filter((model) => model.enabled);
  const selectedResult = results.find((result) => result.modelConfigId === selectedResultId) ?? null;

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[color:var(--border)] bg-[color:var(--card)] p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Workspace</p>
            <h2 className="text-3xl font-semibold tracking-tight text-stone-900">
              Prompt run and side-by-side model review will live here.
            </h2>
            <p className="max-w-3xl text-base leading-7 text-stone-600">
              Your setup from the previous screen is already available here. In the next phase we will add
              prompt submission, response cards, scoring, and dashboard tabs on top of this saved configuration.
            </p>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm text-stone-600">
            {hasUnsavedChanges ? "Unsaved changes in current review" : "All changes saved or unchanged"}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Active Models</p>
            <h3 className="mt-2 text-xl font-semibold text-stone-900">
              {hydrated ? `${activeModels.length} model${activeModels.length === 1 ? "" : "s"} ready` : "Loading setup..."}
            </h3>
          </div>
          <div className="space-y-3">
            {hydrated && activeModels.length > 0 ? (
              activeModels.map((model) => (
                <div
                  className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4"
                  key={model.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-stone-900">{model.displayName}</p>
                      <p className="mt-1 text-sm text-stone-500">{model.modelId}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                      {formatProvider(model.provider)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-3xl border border-dashed border-stone-300 px-4 py-4 text-sm text-stone-600">
                Enable at least one model from the setup page to populate the comparison grid.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Selected Metrics</p>
            <h3 className="mt-2 text-xl font-semibold text-stone-900">
              {hydrated ? `${selectedMetrics.length} scoring dimension${selectedMetrics.length === 1 ? "" : "s"}` : "Loading setup..."}
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {hydrated && selectedMetrics.length > 0 ? (
              selectedMetrics.map((metric) => (
                <span
                  className="rounded-full border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700"
                  key={metric.id}
                >
                  {metric.label}
                </span>
              ))
            ) : (
              <p className="rounded-3xl border border-dashed border-stone-300 px-4 py-4 text-sm text-stone-600">
                Choose one to five metrics in setup before running comparisons.
              </p>
            )}
          </div>
        </article>
      </section>

      <PromptComposer
        disabled={isRunning || activeModels.length === 0}
        onSystemPromptChange={setSystemPrompt}
        onTestCaseNameChange={setTestCaseName}
        onUserPromptChange={setUserPrompt}
        onNew={startNewRun}
        onRun={() => {
          void runPrompt();
        }}
        systemPrompt={systemPrompt}
        testCaseName={testCaseName}
        userPrompt={userPrompt}
      />

      <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2 rounded-full border border-[color:var(--border)] bg-stone-50 p-1">
            <button
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === "llm"
                  ? "bg-[color:var(--accent)] text-white"
                  : "text-stone-700 hover:bg-white"
              }`}
              onClick={() => setActiveTab("llm")}
              type="button"
            >
              LLM
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === "dashboard"
                  ? "bg-[color:var(--accent)] text-white"
                  : "text-stone-700 hover:bg-white"
              }`}
              onClick={() => setActiveTab("dashboard")}
              type="button"
            >
              Dashboard
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700 transition hover:bg-stone-100"
              onClick={() => {
                void saveCurrentRun();
              }}
              type="button"
            >
              Save result
            </button>
            {runError ? (
              <p className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                {runError}
              </p>
            ) : null}
            {saveMessage ? (
              <p className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                {saveMessage}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {activeTab === "llm" ? (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {results.length > 0 ? (
            results.map((result) => (
              <ModelResultCard key={result.modelConfigId} onOpen={openResult} result={result} />
            ))
          ) : (
            <div className="md:col-span-2 xl:col-span-3 rounded-[28px] border border-dashed border-stone-300 bg-[color:var(--card)] p-8 text-sm leading-7 text-stone-600">
              Run a prompt to fill this area with response cards. Each card will show a response preview,
              token usage, estimated cost, timing, and a quick score summary.
            </div>
          )}
        </section>
      ) : (
        <DashboardTab metrics={selectedMetrics} results={results} />
      )}

      <ModelDetailDialog
        metrics={selectedMetrics}
        onClose={closeResult}
        onNotesChange={setNotes}
        onScore={scoreMetric}
        result={selectedResult}
      />
    </div>
  );
}
