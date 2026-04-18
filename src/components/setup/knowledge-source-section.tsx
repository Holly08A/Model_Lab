"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { createEmptyKnowledgeSourceConfig } from "@/lib/validation/setup";
import type { KnowledgeSourceConfig } from "@/types";

type KnowledgeSourceSectionProps = {
  knowledgeSource: KnowledgeSourceConfig | null;
  onChange: (knowledgeSource: KnowledgeSourceConfig | null) => void;
};

async function readJsonFile(file: File) {
  const text = await file.text();
  const parsed = JSON.parse(text) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("The JSON file must contain an array of rows.");
  }

  const rows = parsed.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null);
  if (rows.length === 0) {
    throw new Error("The JSON file must contain at least one object row.");
  }

  return rows;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === "\"") {
      if (inQuotes && nextChar === "\"") {
        currentValue += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      currentRow.push(currentValue);
      rows.push(currentRow);
      currentRow = [];
      currentValue = "";
      continue;
    }

    currentValue += char;
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }

  return rows
    .map((row) => row.map((cell) => cell.trim()))
    .filter((row) => row.some((cell) => cell.length > 0));
}

async function readCsvFile(file: File) {
  const text = await file.text();
  const parsedRows = parseCsv(text);

  if (parsedRows.length < 2) {
    throw new Error("The CSV file must include a header row and at least one data row.");
  }

  const [headerRow, ...dataRows] = parsedRows;
  const headers = headerRow.map((header) => header.trim()).filter(Boolean);

  if (headers.length === 0) {
    throw new Error("The CSV header row is empty.");
  }

  const rows = dataRows
    .map((dataRow) =>
      Object.fromEntries(headers.map((header, index) => [header, dataRow[index] ?? ""])),
    )
    .filter((row) => Object.values(row).some((value) => `${value}`.trim().length > 0));

  if (rows.length === 0) {
    throw new Error("The CSV file must contain at least one non-empty data row.");
  }

  return rows;
}

export function KnowledgeSourceSection({
  knowledgeSource,
  onChange,
}: KnowledgeSourceSectionProps) {
  const current = knowledgeSource ?? createEmptyKnowledgeSourceConfig();
  const [columnsInput, setColumnsInput] = useState(current.columns.join(", "));
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const showForm = knowledgeSource !== null;
  const availableColumns = useMemo(
    () => Array.from(new Set(current.rows.flatMap((row) => Object.keys(row)))).sort((a, b) => a.localeCompare(b)),
    [current.rows],
  );

  const update = (next: Partial<KnowledgeSourceConfig>) => {
    onChange({
      ...current,
      ...next,
    });
  };

  useEffect(() => {
    if (!showForm) {
      setColumnsInput("");
      setUploadMessage(null);
      return;
    }
  }, [showForm]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const rows = file.name.toLowerCase().endsWith(".csv")
        ? await readCsvFile(file)
        : await readJsonFile(file);
      const nextColumns =
        current.columns.length > 0
          ? current.columns
          : Array.from(new Set(rows.flatMap((row) => Object.keys(row))));

      update({
        fileName: file.name,
        rows,
        columns: nextColumns,
      });
      setColumnsInput(nextColumns.join(", "));
      setUploadMessage(`Loaded ${rows.length} row${rows.length === 1 ? "" : "s"} from ${file.name}.`);
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "Failed to read the catalog file.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <section className="rounded-[28px] border border-[color:var(--border)] bg-stone-50 p-6">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">External Knowledge</p>
          <h3 className="mt-2 text-xl font-semibold text-stone-900">
            Optionally upload a local knowledge base file
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            Upload a JSON or CSV file that contains knowledge rows relevant to your prompts. The app parses the file in this
            browser and can prepend selected columns to the prompt during a test run. For best results, keep only compact
            fields such as name, short description, category, or other lightweight reference data.
          </p>
        </div>

        {showForm ? (
          <button
            className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700 transition hover:bg-white"
            onClick={() => onChange(null)}
            type="button"
          >
            Clear catalog
          </button>
        ) : null}
      </div>

      {!showForm ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-5 py-5">
          <p className="max-w-3xl text-sm leading-6 text-stone-600">
            Leave this empty to keep the app fully local without extra knowledge context. If you want the model to reference
            an uploaded JSON or CSV knowledge base file, add it here and turn it on per run in the workspace or per case in
            batch mode.
          </p>
          <button
            className="mt-4 rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
            onClick={() => onChange(createEmptyKnowledgeSourceConfig())}
            type="button"
          >
            Configure local file
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-3xl border border-stone-200 bg-white px-4 py-4 text-sm leading-6 text-stone-700">
            Workspace decides whether to use this uploaded knowledge file on each test run. Saving it here only stores the
            uploaded rows and selected columns for prompt context.
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-stone-700 md:col-span-2">
              <span>Catalog file</span>
              <input
                accept=".json,.csv,application/json,text/csv"
                className="block w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-stone-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-stone-700 focus:border-[color:var(--accent)]"
                onChange={(event) => {
                  void handleFileChange(event);
                }}
                type="file"
              />
              <p className="text-xs leading-5 text-stone-500">
                JSON format: a JSON array of objects, for example
                <code className="ml-1 rounded bg-stone-100 px-1 py-0.5">
                  [{`{"name":"Billing","category":"Ops"}`}]
                </code>
                . CSV format: first row as headers, one knowledge row per line.
              </p>
            </label>

            <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 text-sm text-stone-700">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Loaded file</p>
              <p className="mt-2 font-medium text-stone-900">{current.fileName || "No file loaded yet"}</p>
              <p className="mt-1 text-stone-500">{current.rows.length} row{current.rows.length === 1 ? "" : "s"} stored</p>
            </div>

            <label className="space-y-2 text-sm text-stone-700">
              <span>Row limit</span>
              <input
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                max="500"
                min="1"
                onChange={(event) =>
                  update({
                    rowLimit: Number(event.target.value) || createEmptyKnowledgeSourceConfig().rowLimit,
                  })
                }
                step="1"
                type="number"
                value={current.rowLimit}
              />
            </label>

            <label className="space-y-2 text-sm text-stone-700 md:col-span-2">
              <span>Columns to include</span>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setColumnsInput(nextValue);
                  update({
                    columns: nextValue
                      .split(/[\n,]/)
                      .map((item) => item.trim())
                      .filter(Boolean),
                  });
                }}
                placeholder="name, description, category"
                value={columnsInput}
              />
              <p className="text-xs leading-5 text-stone-500">
                Separate column names with commas or new lines. Only these columns will be included in the prompt context.
                Available keys from the current file: {availableColumns.length > 0 ? availableColumns.join(", ") : "none yet"}.
              </p>
            </label>
          </div>

          {uploadMessage ? (
            <p className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
              {uploadMessage}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
