const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const workspaceRoot = path.resolve(__dirname, "..");
const logsRoot = path.join(workspaceRoot, "runbook-logs", "business-visible");

const ALL_SUITES = [
  { id: "realworld", spec: "e2e/real-world-chains.spec.ts" },
  { id: "sync", spec: "e2e/cross-account-sync.spec.ts" },
  { id: "persistence", spec: "e2e/persistence-contract.spec.ts" },
  { id: "payments", spec: "e2e/payments.spec.ts" },
  { id: "notifications", spec: "e2e/notifications.spec.ts" },
  { id: "schedule", spec: "e2e/schedule.spec.ts" },
  { id: "students", spec: "e2e/students.spec.ts" },
  { id: "student-detail", spec: "e2e/student-detail.spec.ts" },
  { id: "packages", spec: "e2e/packages.spec.ts" },
  { id: "finance", spec: "e2e/finance.spec.ts" },
  { id: "journeys", spec: "e2e/journeys.spec.ts" },
];

const QUICK_SUITES = ["realworld", "sync", "persistence", "payments", "notifications"];

function log(message) {
  console.log(`[VISIBLE][${new Date().toISOString()}] ${message}`);
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function parseArgs() {
  const options = {
    listOnly: false,
    quick: false,
    heartbeatMs: 15000,
    maxSuiteMs: 1800000,
    workers: 1,
    onlyIds: [],
  };

  for (const arg of process.argv.slice(2)) {
    if (arg === "--list") {
      options.listOnly = true;
      continue;
    }

    if (arg === "--quick") {
      options.quick = true;
      continue;
    }

    if (arg.startsWith("--heartbeat-ms=")) {
      const parsed = Number(arg.slice("--heartbeat-ms=".length));
      if (Number.isFinite(parsed) && parsed >= 1000) {
        options.heartbeatMs = parsed;
      }
      continue;
    }

    if (arg.startsWith("--max-suite-ms=")) {
      const parsed = Number(arg.slice("--max-suite-ms=".length));
      if (Number.isFinite(parsed) && parsed >= 10000) {
        options.maxSuiteMs = parsed;
      }
      continue;
    }

    // Backward compatibility with the initial flag naming.
    if (arg.startsWith("--max-idle-ms=")) {
      const parsed = Number(arg.slice("--max-idle-ms=".length));
      if (Number.isFinite(parsed) && parsed >= 10000) {
        options.maxSuiteMs = parsed;
      }
      continue;
    }

    if (arg.startsWith("--workers=")) {
      const parsed = Number(arg.slice("--workers=".length));
      if (Number.isFinite(parsed) && parsed >= 1) {
        options.workers = parsed;
      }
      continue;
    }

    if (arg.startsWith("--only=")) {
      options.onlyIds = arg
        .slice("--only=".length)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      continue;
    }
  }

  return options;
}

function selectSuites(options) {
  let suites = [...ALL_SUITES];

  if (options.quick) {
    const quickSet = new Set(QUICK_SUITES);
    suites = suites.filter((suite) => quickSet.has(suite.id));
  }

  if (options.onlyIds.length > 0) {
    const onlySet = new Set(options.onlyIds);
    suites = suites.filter((suite) => onlySet.has(suite.id));
  }

  return suites;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function runSuite(suite, options) {
  return new Promise((resolve) => {
    const logPath = path.join(logsRoot, `${suite.id}.log`);
    ensureDir(path.dirname(logPath));

    const logStream = fs.createWriteStream(logPath, { flags: "w" });
    const writeLog = (message) => {
      logStream.write(`[${new Date().toISOString()}] ${message}\n`);
    };

    const startedAt = Date.now();
    let finalized = false;
    let timeoutTriggered = false;

    const playwrightCli = path.join(workspaceRoot, "node_modules", "@playwright", "test", "cli.js");
    const cliArgs = [
      "test",
      suite.spec,
      "--workers",
      String(options.workers),
      "--reporter",
      "list",
    ];

    const spawnCommand = fs.existsSync(playwrightCli)
      ? process.execPath
      : process.platform === "win32"
        ? "npx.cmd"
        : "npx";

    const spawnArgs = fs.existsSync(playwrightCli)
      ? [playwrightCli, ...cliArgs]
      : ["playwright", ...cliArgs];

    log(`suite:start id=${suite.id} spec=${suite.spec} log=${path.relative(workspaceRoot, logPath)}`);
    writeLog(`suite:start id=${suite.id} spec=${suite.spec}`);

    const child = spawn(spawnCommand, spawnArgs, {
      cwd: workspaceRoot,
      shell: false,
      env: process.env,
      stdio: "inherit",
    });

    const heartbeatTimer = setInterval(() => {
      const elapsedMs = Date.now() - startedAt;
      const elapsed = formatDuration(elapsedMs);
      log(`suite:heartbeat id=${suite.id} elapsed=${elapsed}`);
      writeLog(`suite:heartbeat id=${suite.id} elapsedMs=${elapsedMs}`);

      if (!timeoutTriggered && elapsedMs >= options.maxSuiteMs) {
        timeoutTriggered = true;
        const reason =
          `Suite exceeded max duration ${formatDuration(options.maxSuiteMs)}. ` +
          "Runner stops this suite to avoid silent hanging.";
        log(`suite:timeout id=${suite.id} reason=${reason}`);
        writeLog(`suite:timeout id=${suite.id} reason=${reason}`);

        try {
          if (process.platform === "win32" && child.pid) {
            spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
              shell: false,
              stdio: "ignore",
            });
          } else {
            child.kill("SIGTERM");
          }
        } catch {
          // Keep runner resilient: finalize with timeout reason even if force-kill fails.
        }

        finalize(124, "suite-timeout", reason);
      }
    }, options.heartbeatMs);

    const finalize = (code, signal, errorMessage) => {
      if (finalized) return;
      finalized = true;

      clearInterval(heartbeatTimer);
      const durationMs = Date.now() - startedAt;
      const safeCode = Number.isInteger(code) ? code : 1;
      if (errorMessage) {
        logStream.write(`\n[runner-error] ${errorMessage}\n`);
      }
      writeLog(`suite:end id=${suite.id} code=${safeCode} signal=${signal || "none"} durationMs=${durationMs}`);
      logStream.end();

      log(
        `suite:end id=${suite.id} code=${safeCode} signal=${signal || "none"} duration=${formatDuration(durationMs)} log=${path.relative(workspaceRoot, logPath)}`,
      );

      resolve({
        id: suite.id,
        spec: suite.spec,
        code: safeCode,
        durationMs,
        logPath,
      });
    };

    child.on("error", (error) => {
      finalize(1, "spawn-error", error.message || String(error));
    });

    child.on("close", (code, signal) => {
      finalize(code, signal, "");
    });
  });
}

async function main() {
  const options = parseArgs();
  const suites = selectSuites(options);

  if (suites.length === 0) {
    log("No suites selected. Use --list to see available ids.");
    process.exit(1);
  }

  if (options.listOnly) {
    log("Selected suites:");
    for (const suite of suites) {
      console.log(`- ${suite.id}: ${suite.spec}`);
    }
    process.exit(0);
  }

  ensureDir(logsRoot);
  log(
    `runner:start suites=${suites.length} heartbeatMs=${options.heartbeatMs} maxSuiteMs=${options.maxSuiteMs} workers=${options.workers}`,
  );

  const results = [];
  for (const suite of suites) {
    // eslint-disable-next-line no-await-in-loop
    const result = await runSuite(suite, options);
    results.push(result);
  }

  const failed = results.filter((result) => result.code !== 0);
  const passed = results.length - failed.length;

  log("runner:summary");
  for (const result of results) {
    console.log(
      `- ${result.id} CODE=${result.code} DURATION=${formatDuration(result.durationMs)} LOG=${path.relative(workspaceRoot, result.logPath)}`,
    );
  }

  log(`runner:done passed=${passed} failed=${failed.length}`);
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((error) => {
  log(`runner:fatal ${error?.message || String(error)}`);
  process.exit(1);
});
