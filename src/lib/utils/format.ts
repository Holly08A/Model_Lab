export function formatCurrency(value?: number) {
  if (value === undefined) {
    return "Unavailable";
  }

  if (value === 0) {
    return "$0.0000";
  }

  return `$${value.toFixed(4)}`;
}

export function formatNumber(value?: number) {
  if (value === undefined) {
    return "Unavailable";
  }

  return value.toLocaleString();
}

export function formatDuration(value?: number) {
  if (value === undefined) {
    return "Unavailable";
  }

  return `${value} ms`;
}

export function truncateText(text: string, limit = 240) {
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit).trimEnd()}...`;
}
