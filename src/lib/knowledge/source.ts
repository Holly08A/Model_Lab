import type { KnowledgeSourceConfig } from "@/types";

const KNOWLEDGE_CHAR_BUDGET = 40000;

function stringifyValue(value: unknown) {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return `${value}`;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function isEmptyValue(value: unknown) {
  return value === null || value === undefined || value === "";
}

function buildRowBlock(row: Record<string, unknown>, columns: string[], index: number) {
  const values = columns.map((column) => row[column]);
  if (values.every((value) => isEmptyValue(value))) {
    return null;
  }

  const lines = [`[Row ${index}]`];
  for (const column of columns) {
    lines.push(`${column}: ${stringifyValue(row[column])}`);
  }

  return lines.join("\n");
}

function truncateKnowledgeBody(blocks: string[]) {
  let totalLength = 0;
  const included: string[] = [];

  for (const block of blocks) {
    const nextLength = totalLength === 0 ? block.length : totalLength + 2 + block.length;
    if (nextLength > KNOWLEDGE_CHAR_BUDGET) {
      if (included.length === 0) {
        included.push(`${block.slice(0, KNOWLEDGE_CHAR_BUDGET - 30).trimEnd()}...`);
      }
      return {
        body: included.join("\n\n"),
        truncated: true,
      };
    }

    included.push(block);
    totalLength = nextLength;
  }

  return {
    body: included.join("\n\n"),
    truncated: false,
  };
}

export function getKnowledgeRows(config: KnowledgeSourceConfig) {
  return config.rows.slice(0, config.rowLimit);
}

export function buildKnowledgePrompt(
  config: KnowledgeSourceConfig,
  rows: Array<Record<string, unknown>>,
  originalUserPrompt: string,
) {
  const rowBlocks = rows
    .map((row, index) => buildRowBlock(row, config.columns, index + 1))
    .filter((block): block is string => Boolean(block));

  const { body, truncated } = truncateKnowledgeBody(
    rowBlocks.length > 0 ? rowBlocks : ["No rows were available in the uploaded local catalog."],
  );

  const note = truncated ? "\n\nAdditional rows omitted for length." : "";

  return [
    "The following uploaded catalog rows describe the capability tags that currently exist in the system.",
    "When choosing existing tags, only use tags supported by the supplied rows.",
    "If the current system does not appear to contain a suitable tag, propose new tags separately instead of pretending they already exist.",
    "Treat the supplied rows as the current capability catalog for this request.",
    "",
    `Source file: ${config.fileName}`,
    "",
    body + note,
    "",
    "User request:",
    originalUserPrompt,
  ].join("\n");
}
