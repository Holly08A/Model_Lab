export function createRunTitle(title: string | undefined, userPrompt: string, savedAt: string) {
  const trimmedTitle = title?.trim();
  if (trimmedTitle) {
    return trimmedTitle;
  }

  const dateLabel = new Date(savedAt).toLocaleString();
  const promptPreview = userPrompt.trim().replace(/\s+/g, " ");
  const shortPrompt =
    promptPreview.length > 80 ? `${promptPreview.slice(0, 80).trimEnd()}...` : promptPreview;

  return `${dateLabel} - ${shortPrompt || "Untitled comparison"}`;
}
