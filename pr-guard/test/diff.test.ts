import { describe, expect, it } from "vitest";
import { parseDiff } from "../src/diff.js";

const DIFF = `diff --git a/replenishment-api/src/main/java/r/domain/Proposal.java b/replenishment-api/src/main/java/r/domain/Proposal.java
new file mode 100644
--- /dev/null
+++ b/replenishment-api/src/main/java/r/domain/Proposal.java
@@ -0,0 +1,3 @@
+package r.domain;
+import org.springframework.stereotype.Service;
+public record Proposal(String sku) {}
diff --git a/README.md b/README.md
--- a/README.md
+++ b/README.md
@@ -10,3 +10,4 @@ ## Titre
 ligne inchangée
-ancienne ligne
+nouvelle ligne
 autre ligne
+ajout final
diff --git a/old.txt b/old.txt
deleted file mode 100644
--- a/old.txt
+++ /dev/null
@@ -1 +0,0 @@
-bye
`;

describe("parseDiff", () => {
  const files = parseDiff(DIFF);

  it("garde les fichiers ajoutés ou modifiés, pas les supprimés", () => {
    expect(files.map((f) => f.path)).toEqual(["replenishment-api/src/main/java/r/domain/Proposal.java", "README.md"]);
  });

  it("numérote les lignes ajoutées dans le nouveau fichier", () => {
    expect(files[0].added.map((l) => l.line)).toEqual([1, 2, 3]);
    expect(files[1].added).toEqual([
      { path: "README.md", line: 11, content: "nouvelle ligne" },
      { path: "README.md", line: 13, content: "ajout final" },
    ]);
  });

  it("supporte un diff vide", () => {
    expect(parseDiff("")).toEqual([]);
  });
});
