export function createRunTitle(prompt: string, savedAt: string) {
  const dateLabel = new Date(savedAt).toLocaleString();
  const promptPreview = prompt.trim().replace(/\s+/g, " ");
  const shortPrompt =
    promptPreview.length > 80 ? `${promptPreview.slice(0, 80).trimEnd()}...` : promptPreview;

  return `${dateLabel} - ${shortPrompt || "Untitled comparison"}`;
}
