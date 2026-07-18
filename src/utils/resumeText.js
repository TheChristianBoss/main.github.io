// Shared helpers for cleaning resume text before export.

export function stripBrackets(text) {
  if (!text) return "";
  return text
    .split("\n")
    .filter((line) => {
      if (/\[[^\]]+\]/.test(line)) return false;
      const clean = line.replace(/^[|•·▪▸\s-]+$/, "").trim();
      return clean.length > 0;
    })
    .join("\n");
}
