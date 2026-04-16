"use client";

import { useState } from "react";
import { RankingDetailDialog } from "@/components/dashboard/ranking-detail-dialog";
import { rankByMetricScore, rankByOperationalMetric } from "@/lib/scoring/rankings";
import { formatCurrency, formatDuration, formatNumber } from "@/lib/utils/format";
import type { MetricConfig, ModelRunResult } from "@/types";

type DashboardTabProps = {
  results: ModelRunResult[];
  metrics: MetricConfig[];
};

function renderValue(kind: "tokens" | "cost" | "full-time" | "score", value?: number) {
  if (kind === "tokens") return formatNumber(value);
  if (kind === "cost") return formatCurrency(value);
  if (kind === "full-time") return formatDuration(value);
  if (value === undefined) return "Unscored";
  return `${value} / 10`;
}

export function DashboardTab({ results, metrics }: DashboardTabProps) {
  const [selectedPanel, setSelectedPanel] = useState<{
    title: string;
    items: ReturnType<typeof rankByOperationalMetric>;
    kind: "tokens" | "cost" | "full-time" | "score";
  } | null>(null);

  const tokenRanking = rankByOperationalMetric(results, "tokens").slice(0, 5);
  const costRanking = rankByOperationalMetric(results, "cost").slice(0, 5);
  const timeRanking = rankByOperationalMetric(results, "full-time").slice(0, 5);
  const fullTokenRanking = rankByOperationalMetric(results, "tokens");
  const fullCostRanking = rankByOperationalMetric(results, "cost");
  const fullTimeRanking = rankByOperationalMetric(results, "full-time");

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-3">
        {[
          {
            title: "Least total tokens",
            kind: "tokens" as const,
            items: tokenRanking,
          },
          {
            title: "Least estimated cost",
            kind: "cost" as const,
            items: costRanking,
          },
          {
            title: "Fastest full response time",
            kind: "full-time" as const,
            items: timeRanking,
          },
        ].map((panel) => (
          <button
            className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-sm"
            key={panel.title}
            onClick={() =>
              setSelectedPanel({
                title: panel.title,
                kind: panel.kind,
                items:
                  panel.kind === "tokens"
                    ? fullTokenRanking
                    : panel.kind === "cost"
                      ? fullCostRanking
                      : fullTimeRanking,
              })
            }
            type="button"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Top 5</p>
            <h3 className="mt-2 text-lg font-semibold text-stone-900">{panel.title}</h3>
            <ol className="mt-4 space-y-3">
              {panel.items.map((item, index) => (
                <li
                  className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                  key={item.modelConfigId}
                >
                  <span className="text-sm text-stone-700">
                    {index + 1}. {item.displayName}
                  </span>
                  <span className="text-sm font-medium text-stone-900">
                    {renderValue(panel.kind, item.value)}
                  </span>
                </li>
                ))}
              </ol>
          </button>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {metrics.map((metric) => {
          const fullRanking = rankByMetricScore(results, metric);
          const ranking = fullRanking.slice(0, 5);
          return (
            <button
              className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-sm"
              key={metric.id}
              onClick={() =>
                setSelectedPanel({
                  title: metric.label,
                  kind: "score",
                  items: fullRanking,
                })
              }
              type="button"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Top 5</p>
              <h3 className="mt-2 text-lg font-semibold text-stone-900">{metric.label}</h3>
              <ol className="mt-4 space-y-3">
                {ranking.map((item, index) => (
                  <li
                    className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                    key={item.modelConfigId}
                  >
                    <span className="text-sm text-stone-700">
                      {index + 1}. {item.displayName}
                    </span>
                    <span className="text-sm font-medium text-stone-900">
                      {renderValue("score", item.value)}
                    </span>
                  </li>
                ))}
              </ol>
            </button>
          );
        })}
      </section>

      {selectedPanel ? (
        <RankingDetailDialog
          items={selectedPanel.items}
          onClose={() => setSelectedPanel(null)}
          title={selectedPanel.title}
          valueFormatter={(value) => renderValue(selectedPanel.kind, value)}
        />
      ) : null}
    </div>
  );
}
