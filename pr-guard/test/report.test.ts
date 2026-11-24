import { describe, expect, it } from "vitest";
import { MARKER, renderReport } from "../src/report.js";

describe("renderReport", () => {
  it("affiche un message positif sans problème", () => {
    const body = renderReport([]);
    expect(body.startsWith(MARKER)).toBe(true);
    expect(body).toContain("Aucun problème");
  });
  it("liste erreurs et avertissements dans un tableau", () => {
    const body = renderReport([
      { rule: "sql.no-select-star", severity: "error", message: "a | b", path: "m.sql", line: 3 },
      { rule: "pr.size", severity: "warning", message: "trop gros" },
    ]);
    expect(body).toContain("**1 erreur(s)**, 1 avertissement(s)");
    expect(body).toContain("| ❌ | `sql.no-select-star` | `m.sql:3` | a \\| b |");
    expect(body).toContain("| ⚠️ | `pr.size` | — | trop gros |");
  });
});
