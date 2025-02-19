#!/usr/bin/env node
"use strict";

// src/git-operations.ts
var import_child_process = require("child_process");
function formatDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function getCurrentBranchInfo() {
  const originalBranch2 = (0, import_child_process.execSync)("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim();
  const originalCommit2 = (0, import_child_process.execSync)("git rev-parse HEAD", { encoding: "utf8" }).trim();
  return { originalBranch: originalBranch2, originalCommit: originalCommit2 };
}
function collectMonthlyCommits(monthsToGo2) {
  const monthCommits2 = [];
  const currentMonthStart = /* @__PURE__ */ new Date();
  currentMonthStart.setDate(1);
  for (let offset = monthsToGo2 - 1; offset >= 0; offset--) {
    const targetDate = new Date(
      currentMonthStart.getFullYear(),
      currentMonthStart.getMonth() - offset,
      1
    );
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const monthStr = (month + 1).toString().padStart(2, "0");
    const monthLabel = `${year}-${monthStr}`;
    const since = formatDate(new Date(year, month, 1));
    const before = formatDate(new Date(year, month + 1, 1));
    console.log(`
Collecting commits for month: ${monthLabel}`);
    console.log(`  Looking for commits between ${since} and ${before}...`);
    try {
      const gitCommand = `git log --reverse --format="%H" --since="${since}" --before="${before}"`;
      console.log(`Running: ${gitCommand}`);
      const logOutput = (0, import_child_process.execSync)(gitCommand, { encoding: "utf8" }).trim();
      if (logOutput) {
        const commitHash = logOutput.split("\n")[0];
        console.log(`  Found commit ${commitHash} for ${monthLabel}`);
        monthCommits2.push({ year, month, monthStr, commitHash, monthLabel });
      } else {
        console.log(`  No commit found for ${monthLabel}`);
      }
    } catch (err) {
      console.error(`  Error getting git log: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return monthCommits2;
}
function checkoutCommit(commitHash) {
  try {
    (0, import_child_process.execSync)(`git checkout ${commitHash} --quiet`);
    console.log(`  Checked out commit ${commitHash}`);
    return true;
  } catch (err) {
    console.error(`  Error checking out commit ${commitHash}`);
    return false;
  }
}
function restoreOriginalState(originalBranch2, originalCommit2) {
  console.log("\nRestoring original state...");
  (0, import_child_process.execSync)(`git checkout ${originalBranch2} --quiet`);
  (0, import_child_process.execSync)(`git checkout ${originalCommit2} --quiet`);
  console.log("Done.");
}

// src/packmind-cli.ts
var import_child_process2 = require("child_process");
var import_fs = require("fs");
function checkPackmindCliInstalled() {
  try {
    (0, import_child_process2.execSync)("packmind-cli --version", { stdio: "ignore" });
    return true;
  } catch (err) {
    console.error("Error: packmind-cli is not installed.");
    console.error("Please run `npm install -g packmind-cli`");
    return false;
  }
}
function runPackmindAndSaveReport(year, monthStr, sourceDir2, extraArgs2 = "") {
  if (!checkPackmindCliInstalled()) {
    return Promise.resolve({
      success: false,
      error: "packmind-cli is not installed"
    });
  }
  try {
    const yy = (year % 100).toString().padStart(2, "0");
    const outFilename = `packmind-${yy}-${monthStr}.json`;
    const command = `packmind-cli scan ${sourceDir2} --formatters sarif --output "${outFilename}" ${extraArgs2}`.trim();
    console.log(`Running: ${command}`);
    let hasErrorOutput = false;
    const childProcess = (0, import_child_process2.spawn)(command, {
      shell: true,
      stdio: ["pipe", "pipe", "pipe"]
    });
    childProcess.stdout.on("data", (data) => {
      if (data.toString().trim().length) {
        console.log("Output :" + data.toString().trimEnd());
      }
    });
    childProcess.stderr.on("data", (data) => {
      if (data.toString().trim().length) {
        console.error("Error: " + data.toString().trimEnd());
        hasErrorOutput = true;
      }
    });
    return new Promise((resolve) => {
      childProcess.on("close", (code) => {
        const emptyReport = {
          runs: [{
            results: []
          }]
        };
        const message = hasErrorOutput ? "Packmind encountered an error - treating as no violations found" : code !== 0 ? "Packmind scan failed - treating as no violations found" : !(0, import_fs.existsSync)(outFilename) ? "No violations found - creating empty report" : "Report generated successfully";
        if (!(0, import_fs.existsSync)(outFilename)) {
          console.log(message);
          (0, import_fs.writeFileSync)(outFilename, JSON.stringify(emptyReport, null, 2));
        }
        console.log(hasErrorOutput);
        if (code === 0 || hasErrorOutput) {
          console.log(`  Packmind report saved to ${outFilename}`);
          resolve({
            success: true,
            output: outFilename
          });
        } else {
          resolve({
            success: false,
            error: `Packmind scan failed with exit code ${code}`
          });
        }
      });
    });
  } catch (err) {
    return Promise.resolve({
      success: false,
      error: `Error running Packmind scan: ${err instanceof Error ? err.message : String(err)}`
    });
  }
}

// src/report-generator.ts
var import_fs2 = require("fs");
function isValidObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}
function objectIdToDate(objectId) {
  if (!isValidObjectId(objectId)) {
    console.warn(`Invalid ObjectId format: ${objectId}, using current date`);
    return (/* @__PURE__ */ new Date()).toISOString();
  }
  try {
    const timestamp = parseInt(objectId.substring(0, 8), 16);
    const date = new Date(timestamp * 1e3);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid timestamp in ObjectId: ${objectId}, using current date`);
      return (/* @__PURE__ */ new Date()).toISOString();
    }
    return date.toISOString();
  } catch (err) {
    console.warn(`Error processing ObjectId: ${objectId}, using current date`);
    return (/* @__PURE__ */ new Date()).toISOString();
  }
}
function parsePackmindReport(filename) {
  try {
    const fileContent = (0, import_fs2.readFileSync)(filename, "utf-8");
    const sarifData = JSON.parse(fileContent);
    const ruleCounts = {};
    for (const result of sarifData.runs[0].results) {
      const ruleKey = `${result.ruleId}|${result.message.text}`;
      ruleCounts[ruleKey] = (ruleCounts[ruleKey] || 0) + 1;
    }
    return ruleCounts;
  } catch (err) {
    console.error(`Error parsing ${filename}: ${err instanceof Error ? err.message : String(err)}`);
    return {};
  }
}
function escapeCsvValue(value) {
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
function generateCSVReport(monthlyData, currentDate, monthsToGo2) {
  const allRules = /* @__PURE__ */ new Set();
  Object.values(monthlyData).forEach((monthCounts) => {
    Object.keys(monthCounts).forEach((rule) => allRules.add(rule));
  });
  const allMonths = [];
  const startDate = new Date(currentDate);
  startDate.setMonth(startDate.getMonth() - (monthsToGo2 - 1));
  for (let i = 0; i < monthsToGo2; i++) {
    const year = startDate.getFullYear() % 100;
    const month = startDate.getMonth() + 1;
    const monthKey = `${year.toString().padStart(2, "0")}-${month.toString().padStart(2, "0")}`;
    allMonths.push(monthKey);
    startDate.setMonth(startDate.getMonth() + 1);
  }
  const headers = ["Rule Id", "Space Name", "Rule Name", "Rule Creation", ...allMonths];
  let csv = headers.map(escapeCsvValue).join(",") + "\n";
  allRules.forEach((rule) => {
    const [ruleId, fullRuleName] = rule.split("|");
    const spaceMatch = fullRuleName.match(/\(Space: ([^)]+)\)$/);
    const spaceName = spaceMatch ? spaceMatch[1] : "";
    const ruleName = fullRuleName.replace(/\s*\(Space: [^)]+\)$/, "");
    const creationDate = objectIdToDate(ruleId);
    const ruleCreationTime = new Date(creationDate).getTime();
    const row = [
      escapeCsvValue(ruleId),
      escapeCsvValue(spaceName),
      escapeCsvValue(ruleName.trim()),
      escapeCsvValue(creationDate)
    ];
    allMonths.forEach((month) => {
      const [yy, mm] = month.split("-").map((n) => parseInt(n, 10));
      const fullYear = 2e3 + yy;
      const monthDate = new Date(fullYear, mm - 1, 1).getTime();
      if (monthDate < ruleCreationTime) {
        row.push("-1");
      } else {
        const count = monthlyData[month]?.[rule] || 0;
        row.push(count.toString());
      }
    });
    csv += row.join(",") + "\n";
  });
  return allRules.size > 0 ? csv : headers.map(escapeCsvValue).join(",") + "\n";
}
async function generateReport(monthCommits2, monthsToGo2) {
  console.log("\nAnalyzing Packmind reports...");
  const monthlyData = {};
  const currentMonthStart = /* @__PURE__ */ new Date();
  currentMonthStart.setDate(1);
  let hasParsingErrors = false;
  for (const commit of monthCommits2) {
    const yy = (commit.year % 100).toString().padStart(2, "0");
    const monthKey = `${yy}-${commit.monthStr}`;
    const filename = `packmind-${monthKey}.json`;
    try {
      if (!(0, import_fs2.existsSync)(filename)) {
        console.error(`Warning: Report file not found for ${monthKey}`);
        continue;
      }
      console.log(`Parsing report for ${monthKey}...`);
      const ruleCounts = parsePackmindReport(filename);
      if (Object.keys(ruleCounts).length === 0) {
        console.warn(`Warning: No rules found in report for ${monthKey}`);
      }
      monthlyData[monthKey] = ruleCounts;
    } catch (err) {
      hasParsingErrors = true;
      console.error(`Error processing report for ${monthKey}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  if (Object.keys(monthlyData).length === 0) {
    throw new Error("No valid reports were found to process");
  }
  if (hasParsingErrors) {
    console.warn("\nWarning: Some reports had parsing errors. The CSV may be incomplete.");
  }
  try {
    const csvContent = generateCSVReport(monthlyData, currentMonthStart, monthsToGo2);
    const csvFilename = "packmind-history.csv";
    (0, import_fs2.writeFileSync)(csvFilename, csvContent);
    console.log(`
CSV report saved to ${csvFilename}`);
  } catch (err) {
    throw new Error(`Failed to generate CSV report: ${err instanceof Error ? err.message : String(err)}`);
  }
  console.log("\nCleaning up temporary files...");
  let cleanupErrors = 0;
  for (const commit of monthCommits2) {
    const yy = (commit.year % 100).toString().padStart(2, "0");
    const monthKey = `${yy}-${commit.monthStr}`;
    const jsonFilename = `packmind-${monthKey}.json`;
    try {
      if ((0, import_fs2.existsSync)(jsonFilename)) {
        (0, import_fs2.unlinkSync)(jsonFilename);
      }
    } catch (err) {
      cleanupErrors++;
      console.error(`Warning: Could not delete temporary file ${jsonFilename}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  if (cleanupErrors > 0) {
    console.warn(`
Warning: ${cleanupErrors} temporary file(s) could not be deleted`);
  }
}

// packmind.ts
if (!checkPackmindCliInstalled()) {
  process.exit(1);
}
if (process.argv.length < 4) {
  console.error("Usage: node packmind.js <number_of_months> <source_directory> [extra_arguments]");
  console.error('Example: node packmind.js 6 src "--spaces Packmind"');
  process.exit(1);
}
var monthsToGo = parseInt(process.argv[2], 10);
if (isNaN(monthsToGo) || monthsToGo < 1) {
  console.error("The number of months must be a positive integer.");
  process.exit(1);
}
var sourceDir = process.argv[3];
var extraArgs = process.argv[4] || "";
console.log(`Will scan directory: ${sourceDir}`);
if (extraArgs) {
  console.log(`With extra arguments: ${extraArgs}`);
}
var { originalBranch, originalCommit } = getCurrentBranchInfo();
var monthCommits = collectMonthlyCommits(monthsToGo);
async function processCommits() {
  for (const commit of monthCommits) {
    console.log(`
Processing month: ${commit.monthLabel}`);
    if (!checkoutCommit(commit.commitHash)) {
      console.error(`  Error checking out commit ${commit.commitHash}. Skipping ${commit.monthLabel}.`);
      continue;
    }
    const packmindResult = await runPackmindAndSaveReport(commit.year, commit.monthStr, sourceDir, extraArgs);
    if (!packmindResult.success) {
      console.error(`  ${packmindResult.error}`);
    }
  }
  await generateReport(monthCommits, monthsToGo);
  restoreOriginalState(originalBranch, originalCommit);
}
processCommits().catch((err) => {
  console.error("Error processing commits:", err);
  process.exit(1);
});
