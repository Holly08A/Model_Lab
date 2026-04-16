"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { customModelSchema, type CustomModelFormValues } from "@/lib/validation/setup";

type CustomModelFormProps = {
  onSubmitModel: (values: CustomModelFormValues) => { ok: true } | { ok: false; message: string };
};

export function CustomModelForm({ onSubmitModel }: CustomModelFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<CustomModelFormValues>({
    resolver: zodResolver(customModelSchema),
    defaultValues: {
      provider: "openrouter",
      modelId: "",
      displayName: "",
      inputPricePer1k: 0,
      outputPricePer1k: 0,
    },
  });

  const onSubmit = (values: CustomModelFormValues) => {
    const result = onSubmitModel(values);
    if (!result.ok) {
      setError("modelId", {
        type: "manual",
        message: result.message,
      });
      return;
    }

    reset({
      provider: values.provider,
      modelId: "",
      displayName: "",
      inputPricePer1k: 0,
      outputPricePer1k: 0,
    });
  };

  return (
    <section className="rounded-[28px] border border-[color:var(--border)] bg-stone-50 p-6">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Custom Models</p>
        <h3 className="mt-2 text-xl font-semibold text-stone-900">
          Add a model that is not already prefilled
        </h3>
      </div>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <label className="space-y-2 text-sm text-stone-700">
          <span>Provider</span>
          <select
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
            {...register("provider")}
          >
            <option value="openrouter">OpenRouter</option>
            <option value="nvidia-nim">NVIDIA NIM</option>
          </select>
        </label>

        <label className="space-y-2 text-sm text-stone-700">
          <span>Display name</span>
          <input
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
            placeholder="Claude Sonnet via OpenRouter"
            {...register("displayName")}
          />
          {errors.displayName ? <p className="text-xs text-red-600">{errors.displayName.message}</p> : null}
        </label>

        <label className="space-y-2 text-sm text-stone-700 md:col-span-2">
          <span>Model ID</span>
          <input
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
            placeholder="anthropic/claude-3.7-sonnet"
            {...register("modelId")}
          />
          {errors.modelId ? <p className="text-xs text-red-600">{errors.modelId.message}</p> : null}
        </label>

        <label className="space-y-2 text-sm text-stone-700">
          <span>Input price per 1K tokens</span>
          <input
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
            min="0"
            step="0.0001"
            type="number"
            {...register("inputPricePer1k")}
          />
          {errors.inputPricePer1k ? <p className="text-xs text-red-600">{errors.inputPricePer1k.message}</p> : null}
        </label>

        <label className="space-y-2 text-sm text-stone-700">
          <span>Output price per 1K tokens</span>
          <input
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
            min="0"
            step="0.0001"
            type="number"
            {...register("outputPricePer1k")}
          />
          {errors.outputPricePer1k ? <p className="text-xs text-red-600">{errors.outputPricePer1k.message}</p> : null}
        </label>

        <div className="md:col-span-2 flex items-center justify-between gap-4 rounded-3xl border border-dashed border-stone-300 px-4 py-4">
          <p className="max-w-xl text-sm leading-6 text-stone-600">
            Custom models are saved in this browser and will appear alongside the recommended defaults.
          </p>
          <button
            className="rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            Add model
          </button>
        </div>
      </form>
    </section>
  );
}
