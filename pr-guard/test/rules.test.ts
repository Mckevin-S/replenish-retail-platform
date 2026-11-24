import { describe, expect, it } from "vitest";
import type { ChangedFile } from "../src/diff.js";
import { analyze, checkDomainPurity, checkSecrets, checkSize, checkSql, checkTests, checkTitle, DEFAULT_OPTIONS } from "../src/rules.js";

const file = (path: string, ...lines: string[]): ChangedFile => ({
  path,
  deleted: false,
  added: lines.map((content, i) => ({ path, line: i + 1, content })),
});

describe("checkTitle", () => {
  it.each(["feat(api): propositions de réassort", "fix: arrondi des quantités", "refactor(edi)!: format ORDERS"])("accepte « %s »", (t) => {
    expect(checkTitle(t)).toEqual([]);
  });
  it.each(["Update stuff", "feat:sans espace", "WIP"])("refuse « %s »", (t) => {
    expect(checkTitle(t)[0].rule).toBe("pr.title");
  });
});

describe("checkSecrets", () => {
  it("détecte clé AWS, clé privée, jeton GitHub et mot de passe", () => {
    const f = file("app.yml", "key: AKIAABCDEFGHIJKLMNOP", "-----BEGIN PRIVATE KEY-----", `t = ghp_${"x".repeat(36)}`, 'password: "Sup3rS3cret!"');
    expect(checkSecrets([f]).map((x) => x.line)).toEqual([1, 2, 3, 4]);
  });
  it("ignore les variables, les valeurs courtes et .env.example", () => {
    expect(checkSecrets([file("a.yml", 'password: "${DB_PASSWORD}"', 'token: "abc"'), file(".env.example", 'API_KEY="changeme-please"')])).toEqual([]);
  });
});

describe("checkDomainPurity", () => {
  it("refuse Spring ou JPA dans le domaine, accepte java.*", () => {
    const f = file("api/src/main/java/r/domain/Stock.java", "import java.math.BigDecimal;", "import jakarta.persistence.Entity;", "import org.springframework.stereotype.Service;");
    expect(checkDomainPurity([f], DEFAULT_OPTIONS).map((x) => x.line)).toEqual([2, 3]);
  });
  it("laisse les adaptateurs utiliser le framework", () => {
    const f = file("api/src/main/java/r/adapter/web/StockController.java", "import org.springframework.web.bind.annotation.RestController;");
    expect(checkDomainPurity([f], DEFAULT_OPTIONS)).toEqual([]);
  });
});

describe("checkSql", () => {
  it("refuse select * dans les modèles dbt, sauf en commentaire ou hors dbt", () => {
    const files = [file("data/dbt/models/stg_sales.sql", "select * from raw.sales", "-- select * interdit", "select sku, qty from x"), file("scripts/adhoc.sql", "SELECT * FROM t")];
    expect(checkSql(files).map((x) => `${x.path}:${x.line}`)).toEqual(["data/dbt/models/stg_sales.sql:1"]);
  });
});

describe("checkSize", () => {
  it("avertit au-delà du seuil", () => {
    const big = file("a.ts", ...Array.from({ length: 5 }, () => "x"));
    expect(checkSize([big], { ...DEFAULT_OPTIONS, maxAddedLines: 4 })[0].severity).toBe("warning");
    expect(checkSize([big], DEFAULT_OPTIONS)).toEqual([]);
  });
});

describe("checkTests", () => {
  it("avertit quand le code change sans test", () => {
    expect(checkTests([file("api/src/main/java/r/Svc.java", "x")])[0].rule).toBe("tests.missing");
    expect(checkTests([file("store-bff/src/stock.service.ts", "x")])[0].rule).toBe("tests.missing");
  });
  it("accepte du code accompagné de tests, ou des changements hors code", () => {
    expect(checkTests([file("api/src/main/java/r/Svc.java", "x"), file("api/src/test/java/r/SvcTest.java", "x")])).toEqual([]);
    expect(checkTests([file("store-bff/src/stock.service.ts", "x"), file("store-bff/src/stock.service.spec.ts", "x")])).toEqual([]);
    expect(checkTests([file("README.md", "x")])).toEqual([]);
  });
});

describe("analyze", () => {
  it("cumule les règles", () => {
    const findings = analyze({ title: "wip", files: [file("data/dbt/models/m.sql", "select * from t")] });
    expect(findings.map((f) => f.rule)).toEqual(["pr.title", "sql.no-select-star"]);
  });
  it("une PR propre ne remonte rien", () => {
    expect(analyze({ title: "docs: README", files: [file("README.md", "texte")] })).toEqual([]);
  });
});
