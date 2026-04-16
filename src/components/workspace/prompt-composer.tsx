"use client";

type PromptComposerProps = {
  prompt: string;
  onChange: (value: string) => void;
  onRun: () => void;
  disabled?: boolean;
};

export function PromptComposer({
  prompt,
  onChange,
  onRun,
  disabled,
}: PromptComposerProps) {
  return (
    <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Prompt</p>
        <h3 className="mt-2 text-xl font-semibold text-stone-900">
          Send the same prompt to every active model
        </h3>
      </div>
      <textarea
        className="min-h-40 w-full resize-y rounded-[24px] border border-stone-200 bg-stone-50 px-5 py-4 text-sm leading-7 outline-none transition focus:border-[color:var(--accent)] focus:bg-white"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Example: Summarize the pros and cons of introducing a 4-day work week for a 50-person startup, and present the answer as a short memo."
        value={prompt}
      />
      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="max-w-2xl text-sm leading-6 text-stone-600">
          Responses will appear in fixed-size model cards below. Open any card to review the full answer and score it.
        </p>
        <button
          className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
          onClick={onRun}
          type="button"
        >
          {disabled ? "Running..." : "Run comparison"}
        </button>
      </div>
    </section>
  );
}
