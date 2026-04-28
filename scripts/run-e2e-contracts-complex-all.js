const { spawnSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const workspaceRoot = path.resolve(__dirname, "..");
const reportArchiveRoot = path.join(workspaceRoot, "playwright-report-contracts");
const suites = [
  {
    id: "realworld",
    spec: "e2e/real-world-chains.spec.ts",
  },
  {
    id: "sync",
    spec: "e2e/cross-account-sync.spec.ts",
  },
  {
    id: "persistence",
    spec: "e2e/persistence-contract.spec.ts",
  },
];

let hasFailures = false;

function ensureCleanDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyReportSnapshot(suiteId) {
  const sourceReportDir = path.join(workspaceRoot, "playwright-report");
  const targetReportDir = path.join(reportArchiveRoot, suiteId);

  if (!fs.existsSync(sourceReportDir)) {
    return;
  }

  fs.rmSync(targetReportDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(targetReportDir), { recursive: true });
  fs.cpSync(sourceReportDir, targetReportDir, { recursive: true, force: true });
}

for (const suite of suites) {
  const outputDir = path.join(workspaceRoot, "test-results", `contracts-${suite.id}`);
  const reportSuiteDir = path.join(reportArchiveRoot, suite.id);

  ensureCleanDir(outputDir);
  fs.rmSync(reportSuiteDir, { recursive: true, force: true });

  console.log(`\n=== Running contracts suite: ${suite.id} ===`);

  const suiteCommand = [
    "npx",
    "playwright",
    "test",
    suite.spec,
    "--output",
    `test-results/contracts-${suite.id}`,
  ].join(" ");

  const result = spawnSync(suiteCommand, {
    cwd: workspaceRoot,
    stdio: "inherit",
    shell: true,
  });

  copyReportSnapshot(suite.id);

  if (result.error) {
    hasFailures = true;
    console.error(`--- ${suite.id} failed to start: ${result.error.message}`);
    continue;
  }

  if (result.status !== 0) {
    hasFailures = true;
    console.error(`--- ${suite.id} failed with exit code ${result.status}`);
  }
}

if (hasFailures) {
  console.error("\nComplex contract run completed with failures.");
  process.exit(1);
}

console.log("\nComplex contract run completed successfully.");