import type { Finding } from "./rules.js";

export const MARKER = "<!-- pr-guard -->";

export function renderReport(findings: Finding[]): string {
  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warning");
  const head = `${MARKER}\n### pr-guard\n`;
  if (findings.length === 0) return `${head}\n✅ Aucun problème détecté.\n`;
  const rows = findings.map((f) => {
    const where = f.path ? `\`${f.path}${f.line ? `:${f.line}` : ""}\`` : "—";
    const icon = f.severity === "error" ? "❌" : "⚠️";
    return `| ${icon} | \`${f.rule}\` | ${where} | ${f.message.replace(/\|/g, "\\|")} |`;
  });
  return [
    head,
    `**${errors.length} erreur(s)**, ${warnings.length} avertissement(s).`,
    "",
    "| | Règle | Emplacement | Détail |",
    "|---|---|---|---|",
    ...rows,
    "",
  ].join("\n");
}
