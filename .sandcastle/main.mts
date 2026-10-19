import { run, claudeCode, createSandbox } from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";

const ISSUES_TO_RESOLVE = ["278", "279"];

for (let i = 0; i < ISSUES_TO_RESOLVE.length; i++) {
  const result = await run({
    sandbox: docker(),
    name: "worker",
    agent: claudeCode("claude-opus-4-8"),
    promptFile: "./.sandcastle/single-implementation.md",
    copyToWorktree: ["node_modules"],
    branchStrategy: {
      type: "branch",
      branch: `feat/issue-${ISSUES_TO_RESOLVE[i]}`,
    },
    promptArgs: {
      ISSUE_NUMBER: ISSUES_TO_RESOLVE[i],
    },
  });

  console.log("🔁 Iterations: ", result.iterations);
  console.log("🔀 Branch:", result.branch);
  console.log("📦 Commits:", result.commits);
  console.log("✅ Completion Signal", result.completionSignal);
}
