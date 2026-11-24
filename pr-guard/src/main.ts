import * as core from "@actions/core";
import * as github from "@actions/github";
import { parseDiff } from "./diff.js";
import { MARKER, renderReport } from "./report.js";
import { analyze, DEFAULT_OPTIONS } from "./rules.js";

async function run(): Promise<void> {
  const pr = github.context.payload.pull_request;
  if (!pr) {
    core.info("Pas de pull request dans ce contexte : rien à analyser.");
    return;
  }
  const token = core.getInput("github-token", { required: true });
  const maxAddedLines = Number(core.getInput("max-added-lines") || DEFAULT_OPTIONS.maxAddedLines);
  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;

  const { data: diff } = await octokit.rest.pulls.get({
    owner, repo, pull_number: pr.number, mediaType: { format: "diff" },
  });
  const findings = analyze({ title: pr.title, files: parseDiff(diff as unknown as string) }, { ...DEFAULT_OPTIONS, maxAddedLines });
  const body = renderReport(findings);

  const comments = await octokit.paginate(octokit.rest.issues.listComments, { owner, repo, issue_number: pr.number });
  const existing = comments.find((c) => c.body?.includes(MARKER));
  if (existing) await octokit.rest.issues.updateComment({ owner, repo, comment_id: existing.id, body });
  else await octokit.rest.issues.createComment({ owner, repo, issue_number: pr.number, body });

  const errors = findings.filter((f) => f.severity === "error").length;
  core.setOutput("errors", errors);
  if (errors > 0) core.setFailed(`pr-guard : ${errors} erreur(s)`);
}

run().catch((error: unknown) => core.setFailed(error instanceof Error ? error.message : String(error)));
