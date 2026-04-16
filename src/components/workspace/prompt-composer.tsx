"use client";

type PromptComposerProps = {
  testCaseName: string;
  onTestCaseNameChange: (value: string) => void;
  systemPrompt: string;
  onSystemPromptChange: (value: string) => void;
  userPrompt: string;
  onUserPromptChange: (value: string) => void;
  onNew: () => void;
  onRun: () => void;
  disabled?: boolean;
};

export function PromptComposer({
  testCaseName,
  onTestCaseNameChange,
  systemPrompt,
  onSystemPromptChange,
  userPrompt,
  onUserPromptChange,
  onNew,
  onRun,
  disabled,
}: PromptComposerProps) {
  return (
    <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-stone-500">System Prompt</p>
        <h3 className="mt-2 text-xl font-semibold text-stone-900">
          Add optional model instructions and then the shared user request
        </h3>
      </div>
      <textarea
        className="min-h-28 w-full resize-y rounded-[24px] border border-stone-200 bg-stone-50 px-5 py-4 text-sm leading-7 outline-none transition focus:border-[color:var(--accent)] focus:bg-white"
        onChange={(event) => onSystemPromptChange(event.target.value)}
        placeholder="Optional: You are a concise product analyst. Follow the requested output format exactly."
        value={systemPrompt}
      />
      <div className="mb-4">
        <label className="block space-y-2 text-sm text-stone-700">
          <span>Test case name</span>
          <input
            className="w-full rounded-[24px] border border-stone-200 bg-stone-50 px-5 py-4 text-sm outline-none transition focus:border-[color:var(--accent)] focus:bg-white"
            onChange={(event) => onTestCaseNameChange(event.target.value)}
            placeholder="Example: Customer support tone check"
            value={testCaseName}
          />
        </label>
      </div>
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-stone-500">User Prompt</p>
      </div>
      <textarea
        className="min-h-40 w-full resize-y rounded-[24px] border border-stone-200 bg-stone-50 px-5 py-4 text-sm leading-7 outline-none transition focus:border-[color:var(--accent)] focus:bg-white"
        onChange={(event) => onUserPromptChange(event.target.value)}
        placeholder="Example: Summarize the pros and cons of introducing a 4-day work week for a 50-person startup, and present the answer as a short memo."
        value={userPrompt}
      />
      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="max-w-2xl text-sm leading-6 text-stone-600">
          Responses will appear in fixed-size model cards below. Open any card to review the full answer and score it.
        </p>
        <div className="flex items-center gap-3">
          <button
            className="rounded-full border border-stone-200 px-5 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
            onClick={onNew}
            type="button"
          >
            New
          </button>
          <button
            className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled}
            onClick={onRun}
            type="button"
          >
            {disabled ? "Running..." : "Run comparison"}
          </button>
        </div>
      </div>
    </section>
  );
}
