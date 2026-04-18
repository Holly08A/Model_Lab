import { nanoid } from "nanoid";
import type { BatchSuite, BatchSuiteSourceFormat, BatchTestCase, DeterministicCheck } from "@/types";

type ParseImportResult =
  | {
      ok: true;
      suite: BatchSuite;
    }
  | {
      ok: false;
      message: string;
    };

type RawCaseRecord = {
  id?: unknown;
  name?: unknown;
  system_prompt?: unknown;
  systemPrompt?: unknown;
  user_prompt?: unknown;
  userPrompt?: unknown;
  use_knowledge_base?: unknown;
  useKnowledgeBase?: unknown;
  use_local_capability_catalog?: unknown;
  useKnowledgeSource?: unknown;
  reference_answer?: unknown;
  referenceAnswer?: unknown;
  rubric?: unknown;
  tags?: unknown;
  checks_json?: unknown;
  checks?: unknown;
  enabled?: unknown;
};

const MAX_TEXT_LENGTH = 12000;

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "case";
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
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

  const normalizedRows = rows
    .map((row) => row.map((cell) => cell.trim()))
    .filter((row) => row.some((cell) => cell.length > 0));

  if (normalizedRows.length === 0) {
    throw new Error("The CSV file is empty.");
  }

  const [headerRow, ...dataRows] = normalizedRows;
  const headers = headerRow.map((header) => header.trim()).filter(Boolean);

  return dataRows.map((values) => {
    return headers.reduce<Record<string, string>>((record, header, index) => {
      record[header] = values[index] ?? "";
      return record;
    }, {});
  });
}

function parseChecks(value: unknown): DeterministicCheck[] {
  if (Array.isArray(value)) {
    return value.filter(isDeterministicCheck);
  }

  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("checks_json must be valid JSON.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("checks_json must be a JSON array.");
  }

  const invalid = parsed.find((item) => !isDeterministicCheck(item));
  if (invalid) {
    throw new Error("checks_json contains an unsupported deterministic check.");
  }

  return parsed as DeterministicCheck[];
}

function isDeterministicCheck(value: unknown): value is DeterministicCheck {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  switch (record.type) {
    case "keyword_contains":
    case "keyword_absent":
      return typeof record.value === "string" && record.value.trim().length > 0;
    case "regex_match":
      return typeof record.value === "string" && record.value.trim().length > 0;
    case "max_length":
      return typeof record.value === "number" && Number.isFinite(record.value);
    case "json_parse":
      return true;
    default:
      return false;
  }
}

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => `${item}`.trim()).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return false;
    }

    return ["true", "1", "yes", "y"].includes(normalized);
  }

  return false;
}

function validateTextLimit(value: string, label: string) {
  if (value.length > MAX_TEXT_LENGTH) {
    throw new Error(`${label} exceeds the ${MAX_TEXT_LENGTH.toLocaleString()} character limit.`);
  }
}

function normalizeCase(record: RawCaseRecord, index: number, seenIds: Set<string>): BatchTestCase {
  const name = normalizeString(record.name);
  const systemPrompt = normalizeString(record.system_prompt ?? record.systemPrompt);
  const userPrompt = normalizeString(record.user_prompt ?? record.userPrompt);
  const referenceAnswer = normalizeString(record.reference_answer ?? record.referenceAnswer);
  const rubric = normalizeString(record.rubric);

  if (!name) {
    throw new Error(`Row ${index + 1}: name is required.`);
  }

  if (!userPrompt) {
    throw new Error(`Row ${index + 1}: user_prompt is required.`);
  }

  validateTextLimit(systemPrompt, `${name} system prompt`);
  validateTextLimit(userPrompt, `${name} user prompt`);
  validateTextLimit(referenceAnswer, `${name} reference answer`);
  validateTextLimit(rubric, `${name} rubric`);

  const rawId = normalizeString(record.id);
  const id = rawId || `${slugify(name)}-${index + 1}`;

  if (seenIds.has(id)) {
    throw new Error(`Duplicate test case id detected: ${id}`);
  }
  seenIds.add(id);

  return {
    id,
    name,
    systemPrompt,
    userPrompt,
    useKnowledgeSource: normalizeBoolean(
      record.use_knowledge_base ??
        record.useKnowledgeBase ??
        record.use_local_capability_catalog ??
        record.useKnowledgeSource,
    ),
    referenceAnswer: referenceAnswer || undefined,
    rubric: rubric || undefined,
    tags: normalizeTags(record.tags),
    checks: parseChecks(record.checks_json ?? record.checks),
    enabled: record.enabled === undefined ? true : `${record.enabled}` !== "false",
  };
}

function fromRawCases(rawCases: RawCaseRecord[], sourceFormat: BatchSuiteSourceFormat, suiteName?: string): BatchSuite {
  const createdAt = new Date().toISOString();
  const seenIds = new Set<string>();
  const cases = rawCases.map((record, index) => normalizeCase(record, index, seenIds));

  return {
    id: nanoid(),
    name: suiteName?.trim() || `Imported suite ${new Date(createdAt).toLocaleString()}`,
    sourceFormat,
    createdAt,
    cases,
  };
}

export function parseBatchImport(input: { text: string; fileName: string }): ParseImportResult {
  const extension = input.fileName.toLowerCase().split(".").pop();

  try {
    if (extension === "csv") {
      return {
        ok: true,
        suite: fromRawCases(parseCsv(input.text), "csv", input.fileName.replace(/\.csv$/i, "")),
      };
    }

    if (extension === "json") {
      const parsed = JSON.parse(input.text) as unknown;

      if (Array.isArray(parsed)) {
        return {
          ok: true,
          suite: fromRawCases(parsed as RawCaseRecord[], "json", input.fileName.replace(/\.json$/i, "")),
        };
      }

      if (parsed && typeof parsed === "object") {
        const record = parsed as { name?: unknown; cases?: unknown };
        if (Array.isArray(record.cases)) {
          return {
            ok: true,
            suite: fromRawCases(
              record.cases as RawCaseRecord[],
              "json",
              typeof record.name === "string" ? record.name : input.fileName.replace(/\.json$/i, ""),
            ),
          };
        }
      }

      return {
        ok: false,
        message: "JSON imports must be either an array of test cases or an object with a cases array.",
      };
    }

    return {
      ok: false,
      message: "Unsupported file type. Upload a CSV or JSON file.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to parse the imported file.",
    };
  }
}
