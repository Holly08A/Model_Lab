"use client";

import { useEffect, useMemo, useRef } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { formatCurrency, formatDuration, formatNumber } from "@/lib/utils/format";
import { useBatchRunsStore } from "@/stores/batch-runs-store";
import { useSetupStore } from "@/stores/setup-store";

function averageOverallScore(values: Array<number | undefined>) {
  const filtered = values.filter((value): value is number => value !== undefined);
  if (filtered.length === 0) {
    return "Not scored";
  }

  return `${(filtered.reduce((sum, value) => sum + value, 0) / filtered.length).toFixed(1)} / 10`;
}

export function BatchPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { hydrate: hydrateSetup, hydrated: setupHydrated } = useSetupStore();
  const {
    importedSuite,
    currentRun,
    savedRuns,
    loadingSavedRuns,
    isRunning,
    importError,
    runError,
    statusMessage,
    importSuite,
    toggleCase,
    runImportedSuite,
    saveCurrentRun,
    loadSavedRuns,
    openSavedRun,
    removeSavedRun,
    reset,
  } = useBatchRunsStore();

  useEffect(() => {
    hydrateSetup();
  }, [hydrateSetup]);

  useEffect(() => {
    void loadSavedRuns();
  }, [loadSavedRuns]);

  const enabledCases = importedSuite?.cases.filter((testCase) => testCase.enabled) ?? [];
  const metrics = currentRun?.metrics ?? [];
  const runSummary = currentRun?.summary;

  const caseSummaries = useMemo(() => {
    if (!currentRun) {
      return [];
    }

    return currentRun.suiteCases
      .filter((testCase) => testCase.enabled)
      .map((testCase) => {
        const results = currentRun.results.filter((result) => result.caseId === testCase.id);
        return {
          testCase,
          results,
          averageScore: averageOverallScore(results.map((result) => result.judge.overallScore)),
        };
      });
  }, [currentRun]);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[color:var(--border)] bg-[color:var(--card)] p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Batch Run</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">
              Upload prompt suites, run them across your active LLMs, and auto-rate the results.
            </h2>
            <p className="mt-4 max-w-4xl text-base leading-7 text-stone-600">
              This workflow keeps the existing single-prompt workspace intact while giving you a browser-local batch
              harness for repeated benchmark cases, judge-model scoring, and deterministic checks.
            </p>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-stone-500">
              Imports only need `name` and `user_prompt`. `system_prompt`, `use_knowledge_base`,
              `reference_answer`, `tags`, `checks_json`, and `rubric` are optional case-level helpers.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700 transition hover:bg-stone-100"
              href="/templates/batch-template.csv"
            >
              Download CSV template
            </Link>
            <Link
              className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700 transition hover:bg-stone-100"
              href="/templates/batch-template.json"
            >
              Download JSON template
            </Link>
            <button
              className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700 transition hover:bg-stone-100"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              Import CSV or JSON
            </button>
            <button
              className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700 transition hover:bg-stone-100"
              onClick={reset}
              type="button"
            >
              Clear draft
            </button>
          </div>
        </div>
        <input
          accept=".csv,.json"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }

            const input = event.currentTarget;
            const text = await file.text();
            await importSuite(file.name, text);
            input.value = "";
          }}
          ref={fileInputRef}
          type="file"
        />
      </section>

      {statusMessage ? (
        <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-sm">
          {statusMessage}
        </div>
      ) : null}

      {importError ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
          {importError}
        </div>
      ) : null}

      {runError ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
          {runError}
        </div>
      ) : null}

      {importedSuite ? (
        <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Imported Suite</p>
              <h3 className="mt-2 text-2xl font-semibold text-stone-900">{importedSuite.name}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {importedSuite.cases.length} total case{importedSuite.cases.length === 1 ? "" : "s"} from{" "}
                {importedSuite.sourceFormat.toUpperCase()}.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700 transition hover:bg-stone-100 disabled:opacity-60"
                disabled={isRunning}
                onClick={() => {
                  void saveCurrentRun();
                }}
                type="button"
              >
                Save batch run
              </button>
              <button
                className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isRunning || enabledCases.length === 0 || !setupHydrated}
                onClick={() => {
                  void runImportedSuite();
                }}
                type="button"
              >
                {!setupHydrated ? "Loading setup..." : isRunning ? "Running..." : "Run and auto-score"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Enabled cases</p>
              <p className="mt-2 text-lg font-semibold text-stone-900">{enabledCases.length}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Candidate models</p>
              <p className="mt-2 text-lg font-semibold text-stone-900">{currentRun?.candidateModels.length ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Completed evals</p>
              <p className="mt-2 text-lg font-semibold text-stone-900">{runSummary?.completedEvaluations ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Errored evals</p>
              <p className="mt-2 text-lg font-semibold text-stone-900">{runSummary?.errorEvaluations ?? 0}</p>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm leading-6 text-stone-700">
            Cases now control knowledge-file usage individually through the optional `use_knowledge_base` field in
            CSV or `useKnowledgeBase` in JSON. Any case marked `true` will reuse the uploaded Setup knowledge file; other
            cases run without that extra context.
          </div>

          <div className="mt-6 space-y-3">
            {importedSuite.cases.map((testCase) => (
              <article
                className={`rounded-3xl border p-4 transition ${
                  testCase.enabled ? "border-[color:var(--accent)] bg-stone-50" : "border-stone-200 bg-white"
                }`}
                key={testCase.id}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="text-base font-semibold text-stone-900">{testCase.name}</h4>
                      <span className="rounded-full bg-white px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                        {testCase.enabled ? "enabled" : "disabled"}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                        {testCase.useKnowledgeSource ? "uses catalog" : "no catalog"}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-stone-600">{testCase.userPrompt}</p>
                    {testCase.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {testCase.tags.map((tag) => (
                          <span
                            className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-600"
                            key={tag}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <button
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      testCase.enabled
                        ? "bg-[color:var(--accent)] text-white"
                        : "border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                    }`}
                    onClick={() => toggleCase(testCase.id)}
                    type="button"
                  >
                    {testCase.enabled ? "Enabled" : "Enable"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {currentRun ? (
        <section className="space-y-4">
          {caseSummaries.map(({ testCase, results, averageScore }) => (
            <article
              className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm"
              key={testCase.id}
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Case review</p>
                  <h3 className="mt-2 text-2xl font-semibold text-stone-900">{testCase.name}</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{testCase.userPrompt}</p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-700">
                  Average judge score: <span className="font-semibold text-stone-900">{averageScore}</span>
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                {results.map((result) => (
                  <section
                    className="rounded-[24px] border border-stone-200 bg-stone-50 p-5"
                    key={`${result.caseId}-${result.modelConfigId}`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-lg font-semibold text-stone-900">{result.displayName}</h4>
                          <span className="rounded-full bg-white px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                            {result.provider}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-stone-500">{result.modelId}</p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] ${
                          result.status === "success"
                            ? "bg-emerald-100 text-emerald-800"
                            : result.status === "error"
                              ? "bg-rose-100 text-rose-700"
                              : result.status === "running"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-white text-stone-500"
                        }`}
                      >
                        {result.status}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Overall score</p>
                        <p className="mt-2 text-lg font-semibold text-stone-900">
                          {result.judge.overallScore !== undefined ? `${result.judge.overallScore} / 10` : "Pending"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Judge confidence</p>
                        <p className="mt-2 text-lg font-semibold text-stone-900">
                          {result.judge.confidence !== undefined ? `${Math.round(result.judge.confidence * 100)}%` : "Pending"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Tokens</p>
                        <p className="mt-2 text-sm font-semibold text-stone-900">{formatNumber(result.usage.totalTokens)}</p>
                      </div>
                      <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Cost</p>
                        <p className="mt-2 text-sm font-semibold text-stone-900">{formatCurrency(result.estimatedCost.totalCost)}</p>
                      </div>
                      <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Full time</p>
                        <p className="mt-2 text-sm font-semibold text-stone-900">{formatDuration(result.timing.fullResponseTimeMs)}</p>
                      </div>
                    </div>

                    {metrics.length > 0 ? (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {metrics.map((metric) => (
                          <div
                            className="rounded-2xl border border-stone-200 bg-white px-4 py-3"
                            key={metric.id}
                          >
                            <p className="text-xs uppercase tracking-[0.2em] text-stone-400">{metric.label}</p>
                            <p className="mt-2 text-sm font-semibold text-stone-900">
                              {result.judge.metricScores[metric.id] !== null && result.judge.metricScores[metric.id] !== undefined
                                ? `${result.judge.metricScores[metric.id]} / 10`
                                : "Pending"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-4 space-y-3">
                      <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Judge rationale</p>
                        <p className="mt-2 text-sm leading-6 text-stone-700">
                          {result.judge.shortRationale || result.judgeError || result.generationError || "Pending"}
                        </p>
                        {result.judge.flags.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {result.judge.flags.map((flag) => (
                              <span
                                className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-800"
                                key={flag}
                              >
                                {flag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Deterministic checks</p>
                        {result.deterministicChecks.length > 0 ? (
                          <div className="mt-3 space-y-2">
                            {result.deterministicChecks.map((check) => (
                              <div className="flex items-center justify-between gap-3 text-sm text-stone-700" key={check.label}>
                                <span>{check.label}</span>
                                <span className={check.passed ? "text-emerald-700" : "text-rose-700"}>
                                  {check.passed ? "Pass" : "Fail"}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-stone-500">No deterministic checks configured for this case.</p>
                        )}
                      </div>

                      <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Response preview</p>
                        <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                          {result.responseText || result.generationError || "Pending"}
                        </div>
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            </article>
          ))}
        </section>
      ) : null}

      <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Saved Batch Runs</p>
            <h3 className="mt-2 text-xl font-semibold text-stone-900">Reopen previous benchmark runs</h3>
          </div>
        </div>

        {loadingSavedRuns ? (
          <p className="mt-4 text-sm text-stone-600">Loading saved batch runs...</p>
        ) : savedRuns.length === 0 ? (
          <p className="mt-4 text-sm text-stone-600">No saved batch runs yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {savedRuns.map((run) => (
              <article
                className="rounded-3xl border border-stone-200 bg-stone-50 p-4"
                key={run.id}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
                      {format(new Date(run.savedAt ?? run.createdAt), "MMM d, yyyy h:mm a")}
                    </p>
                    <h4 className="mt-2 text-lg font-semibold text-stone-900">{run.title}</h4>
                    <p className="mt-2 text-sm text-stone-600">
                      {run.suiteCases.filter((testCase) => testCase.enabled).length} enabled case
                      {run.suiteCases.filter((testCase) => testCase.enabled).length === 1 ? "" : "s"} across{" "}
                      {run.candidateModels.length} model{run.candidateModels.length === 1 ? "" : "s"}
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                      {run.suiteCases.filter((testCase) => testCase.enabled && testCase.useKnowledgeSource).length} case
                      {run.suiteCases.filter((testCase) => testCase.enabled && testCase.useKnowledgeSource).length === 1 ? "" : "s"} use setup catalog context
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                      onClick={() => openSavedRun(run)}
                      type="button"
                    >
                      Open
                    </button>
                    <button
                      className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700 transition hover:bg-white"
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(run, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `${run.title.replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}.json`;
                        link.click();
                        URL.revokeObjectURL(url);
                      }}
                      type="button"
                    >
                      Export JSON
                    </button>
                    <button
                      className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700 transition hover:bg-white"
                      onClick={() => {
                        void removeSavedRun(run.id);
                      }}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
