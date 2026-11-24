import type { AddedLine, ChangedFile } from "./diff.js";

export type Severity = "error" | "warning";

export interface Finding {
  rule: string;
  severity: Severity;
  message: string;
  path?: string;
  line?: number;
}

export interface PullRequestInput {
  title: string;
  files: ChangedFile[];
}

export interface GuardOptions {
  maxAddedLines: number;
  domainMarkers: string[];
  forbiddenInDomain: string[];
}

export const DEFAULT_OPTIONS: GuardOptions = {
  maxAddedLines: 800,
  domainMarkers: ["/domain/"],
  forbiddenInDomain: ["org.springframework", "jakarta.persistence", "javax.persistence"],
};

const SECRET_PATTERNS: Array<[string, RegExp]> = [
  ["clé d'accès AWS", /\bAKIA[0-9A-Z]{16}\b/],
  ["clé privée", /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ["jeton GitHub", /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
  ["mot de passe en clair", /\b(password|passwd|secret|api[_-]?key|token)\b\s*[:=]\s*["'](?!\$\{)[^"'\s]{8,}["']/i],
];

const CONVENTIONAL_TITLE = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([\w\-./]+\))?!?: .+/;
const JAVA_IMPORT = /^\s*import\s+(?:static\s+)?([\w.*]+)\s*;/;
const SELECT_STAR = /\bselect\s+\*/i;

const at = (l: AddedLine) => ({ path: l.path, line: l.line });

export function checkTitle(title: string): Finding[] {
  return CONVENTIONAL_TITLE.test(title)
    ? []
    : [{ rule: "pr.title", severity: "error", message: `titre « ${title} » non conforme à Conventional Commits (ex. « feat(api): … »)` }];
}

export function checkSecrets(files: ChangedFile[]): Finding[] {
  return files
    .filter((f) => !f.path.endsWith(".env.example"))
    .flatMap((f) => f.added)
    .flatMap((l) =>
      SECRET_PATTERNS.filter(([, re]) => re.test(l.content)).map(([label]) => ({
        rule: "secrets.detected",
        severity: "error" as const,
        message: `${label} probable dans une ligne ajoutée`,
        ...at(l),
      })),
    );
}

export function checkDomainPurity(files: ChangedFile[], options: GuardOptions): Finding[] {
  return files
    .filter((f) => f.path.endsWith(".java") && options.domainMarkers.some((m) => f.path.includes(m)))
    .flatMap((f) => f.added)
    .flatMap((l) => {
      const imported = JAVA_IMPORT.exec(l.content)?.[1];
      return imported && options.forbiddenInDomain.some((p) => imported.startsWith(p))
        ? [{ rule: "architecture.domain-purity", severity: "error" as const, message: `le domaine ne doit pas importer ${imported}`, ...at(l) }]
        : [];
    });
}

export function checkSql(files: ChangedFile[]): Finding[] {
  return files
    .filter((f) => f.path.startsWith("data/dbt/") && f.path.endsWith(".sql"))
    .flatMap((f) => f.added)
    .filter((l) => SELECT_STAR.test(l.content) && !l.content.trim().startsWith("--"))
    .map((l) => ({ rule: "sql.no-select-star", severity: "error" as const, message: "lister les colonnes au lieu de « select * »", ...at(l) }));
}

export function checkSize(files: ChangedFile[], options: GuardOptions): Finding[] {
  const added = files.reduce((n, f) => n + f.added.length, 0);
  return added > options.maxAddedLines
    ? [{ rule: "pr.size", severity: "warning", message: `${added} lignes ajoutées (> ${options.maxAddedLines}) : découper la PR` }]
    : [];
}

const isProductionCode = (p: string) => /\/src\/main\//.test(p) || (/\/src\//.test(p) && /\.(ts|tsx|py|cs|scala)$/.test(p) && !isTest(p));
const isTest = (p: string) => /(\/src\/test\/|\/tests?\/|\.test\.|\.spec\.|Tests?\.(java|cs|scala)$|test_\w+\.py$)/.test(p);

export function checkTests(files: ChangedFile[]): Finding[] {
  const touchesCode = files.some((f) => isProductionCode(f.path) && !isTest(f.path));
  const touchesTests = files.some((f) => isTest(f.path));
  return touchesCode && !touchesTests
    ? [{ rule: "tests.missing", severity: "warning", message: "du code de production change sans aucun test modifié ou ajouté" }]
    : [];
}

export function analyze(pr: PullRequestInput, options: GuardOptions = DEFAULT_OPTIONS): Finding[] {
  return [
    ...checkTitle(pr.title),
    ...checkSecrets(pr.files),
    ...checkDomainPurity(pr.files, options),
    ...checkSql(pr.files),
    ...checkSize(pr.files, options),
    ...checkTests(pr.files),
  ];
}
