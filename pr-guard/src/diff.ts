/** Lignes ajoutées par une pull request, extraites d'un diff unifié. */
export interface AddedLine {
  path: string;
  line: number;
  content: string;
}

export interface ChangedFile {
  path: string;
  added: AddedLine[];
  deleted: boolean;
}

const FILE_HEADER = /^\+\+\+ (?:b\/)?(.+)$/;
const HUNK_HEADER = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

export function parseDiff(diff: string): ChangedFile[] {
  const files: ChangedFile[] = [];
  let current: ChangedFile | undefined;
  let nextLine = 0;

  for (const raw of diff.split(/\r?\n/)) {
    if (raw.startsWith("diff --git")) {
      current = undefined;
      continue;
    }
    const header = FILE_HEADER.exec(raw);
    if (header) {
      const path = header[1].trim();
      current = { path, added: [], deleted: path === "/dev/null" };
      files.push(current);
      continue;
    }
    if (!current || raw.startsWith("--- ")) continue;
    const hunk = HUNK_HEADER.exec(raw);
    if (hunk) {
      nextLine = Number(hunk[1]);
      continue;
    }
    if (raw.startsWith("+")) {
      current.added.push({ path: current.path, line: nextLine, content: raw.slice(1) });
      nextLine += 1;
    } else if (raw.startsWith(" ")) {
      nextLine += 1;
    }
  }
  return files.filter((f) => !f.deleted);
}
