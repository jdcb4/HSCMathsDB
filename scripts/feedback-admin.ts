import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type FeedbackStatus = "new" | "triaged" | "fixed" | "wontfix" | "spam";

type FeedbackReport = {
  id: number;
  question_id: string;
  paper_id: string;
  course_name: string;
  year: number;
  question_number: string;
  category: string;
  message: string;
  contact_email?: string | null;
  page_url?: string | null;
  app_version?: string | null;
  user_agent?: string | null;
  status: FeedbackStatus;
  admin_note?: string | null;
  created_at: string;
  updated_at?: string | null;
};

const validStatuses = new Set<FeedbackStatus>(["new", "triaged", "fixed", "wontfix", "spam"]);
const command = process.argv[2];
const args = process.argv.slice(3);
const databaseName = getOption("database") ?? process.env.FEEDBACK_D1_NAME ?? "hscmathsdb-feedback";
const remoteFlag = args.includes("--local") ? "--local" : "--remote";

switch (command) {
  case "list":
    await listFeedback();
    break;
  case "update":
    await updateFeedback();
    break;
  case "export":
    await exportFeedbackDashboard();
    break;
  default:
    printUsage();
    process.exit(command ? 1 : 0);
}

async function listFeedback() {
  const limit = parsePositiveInteger(getOption("limit") ?? "50", "limit");
  const status = getOptionalStatus();
  const rows = runSelect(buildFeedbackSelect({ limit, status }));

  console.table(
    rows.map((row) => ({
      id: row.id,
      status: row.status,
      category: row.category,
      course: row.course_name,
      year: row.year,
      question: row.question_number,
      created: row.created_at,
      message: truncate(row.message, 90)
    }))
  );
}

async function updateFeedback() {
  const id = parsePositiveInteger(args[0] ?? "", "id");
  const status = args[1] as FeedbackStatus | undefined;
  const note = getOption("note");

  if (!status || !validStatuses.has(status)) {
    throw new Error(`Status must be one of: ${[...validStatuses].join(", ")}`);
  }

  runD1(
    `UPDATE feedback_reports
     SET status = ${sqlString(status)},
         admin_note = ${note ? sqlString(note) : "admin_note"},
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = ${id}`
  );

  const updated = runSelect(`SELECT * FROM feedback_reports WHERE id = ${id}`);
  console.table(updated);
}

async function exportFeedbackDashboard() {
  const limit = parsePositiveInteger(getOption("limit") ?? "500", "limit");
  const status = getOptionalStatus();
  const outPath = path.resolve(getOption("out") ?? path.join("output", "feedback-dashboard.html"));
  const rows = runSelect(buildFeedbackSelect({ limit, status }));

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, renderDashboard(rows), "utf8");

  console.log(`Exported ${rows.length} feedback reports to ${outPath}`);
}

function buildFeedbackSelect({ limit, status }: { limit: number; status?: FeedbackStatus }) {
  const where = status ? `WHERE status = ${sqlString(status)}` : "";

  return `SELECT *
    FROM feedback_reports
    ${where}
    ORDER BY datetime(created_at) DESC
    LIMIT ${limit}`;
}

function runSelect(sql: string): FeedbackReport[] {
  const result = runD1(sql);

  return result.map((row) => ({
    ...row,
    id: Number(row.id),
    year: Number(row.year)
  })) as FeedbackReport[];
}

function runD1(sql: string): Record<string, unknown>[] {
  const result = spawnSync(
    process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    ["exec", "wrangler", "d1", "execute", databaseName, remoteFlag, "--json", "--command", sql],
    {
      encoding: "utf8",
      shell: false
    }
  );

  if (result.status !== 0) {
    throw new Error(
      [
        `Wrangler D1 command failed for database "${databaseName}" (${remoteFlag}).`,
        result.stdout.trim(),
        result.stderr.trim()
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  const parsed = parseWranglerJson(result.stdout);
  const firstResult = Array.isArray(parsed) ? parsed[0] : parsed;
  const rows = firstResult?.results ?? firstResult?.result?.[0]?.results ?? [];

  if (!Array.isArray(rows)) {
    return [];
  }

  return rows as Record<string, unknown>[];
}

function parseWranglerJson(stdout: string): unknown {
  const trimmed = stdout.trim();
  const start = Math.min(...[trimmed.indexOf("["), trimmed.indexOf("{")].filter((index) => index >= 0));

  if (!Number.isFinite(start)) {
    throw new Error(`Wrangler did not return JSON:\n${stdout}`);
  }

  return JSON.parse(trimmed.slice(start));
}

function renderDashboard(rows: FeedbackReport[]): string {
  const generatedAt = new Date().toISOString();
  const summary = buildSummary(rows);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>HSCMathsDB feedback dashboard</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f3f6f8; color: #17202a; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    header { background: #fff; border-bottom: 1px solid #cad3dc; padding: 24px; }
    main { max-width: 1280px; margin: 0 auto; padding: 20px; }
    h1, h2, h3, p { margin: 0; }
    .eyebrow { color: #2074a6; font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
    h1 { margin-top: 6px; font-size: 28px; }
    .muted { color: #586575; font-size: 14px; }
    .grid { display: grid; gap: 12px; }
    .metrics { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); margin-top: 18px; }
    .metric, .panel { background: #fff; border: 1px solid #d7e0e8; border-radius: 8px; padding: 14px; }
    .metric strong { display: block; font-size: 24px; }
    .controls { display: grid; grid-template-columns: minmax(220px, 1fr) repeat(2, minmax(160px, 220px)); gap: 10px; margin: 18px 0; }
    input, select { width: 100%; min-height: 40px; border: 1px solid #cad3dc; border-radius: 6px; background: #fff; color: #17202a; padding: 8px 10px; font: inherit; }
    table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #d7e0e8; border-radius: 8px; overflow: hidden; }
    th, td { border-bottom: 1px solid #e3e9ee; padding: 10px; text-align: left; vertical-align: top; font-size: 14px; }
    th { background: #edf2f6; font-size: 12px; letter-spacing: .04em; text-transform: uppercase; }
    tr:last-child td { border-bottom: 0; }
    .message { max-width: 520px; white-space: pre-wrap; }
    .badge { display: inline-flex; border: 1px solid #cad3dc; border-radius: 999px; padding: 2px 8px; font-size: 12px; font-weight: 700; }
    .new { border-color: #b35b00; color: #8a4300; }
    .triaged { border-color: #2074a6; color: #155179; }
    .fixed { border-color: #237a48; color: #1b5e37; }
    .wontfix, .spam { border-color: #a62436; color: #81202e; }
    code { display: block; margin-top: 4px; color: #586575; font-size: 12px; overflow-wrap: anywhere; }
    @media (max-width: 760px) {
      .controls { grid-template-columns: 1fr; }
      table, thead, tbody, th, td, tr { display: block; }
      thead { display: none; }
      tr { border-bottom: 1px solid #d7e0e8; }
      td { border-bottom: 0; }
      td::before { content: attr(data-label); display: block; color: #586575; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    }
  </style>
</head>
<body>
  <header>
    <p class="eyebrow">HSCMathsDB</p>
    <h1>Feedback dashboard</h1>
    <p class="muted">Generated ${escapeHtml(generatedAt)} from ${escapeHtml(databaseName)}.</p>
  </header>
  <main>
    <section class="grid metrics" aria-label="Feedback overview">
      <div class="metric"><span class="muted">Total</span><strong>${summary.total}</strong></div>
      <div class="metric"><span class="muted">New</span><strong>${summary.byStatus.new ?? 0}</strong></div>
      <div class="metric"><span class="muted">Triaged</span><strong>${summary.byStatus.triaged ?? 0}</strong></div>
      <div class="metric"><span class="muted">Fixed</span><strong>${summary.byStatus.fixed ?? 0}</strong></div>
      <div class="metric"><span class="muted">Last 7 days</span><strong>${summary.lastSevenDays}</strong></div>
    </section>

    <section class="panel" style="margin-top: 16px;">
      <h2>Review queue</h2>
      <div class="controls">
        <input id="search" type="search" placeholder="Search reports">
        <select id="statusFilter">
          <option value="">All statuses</option>
          ${[...validStatuses].map((status) => `<option value="${status}">${status}</option>`).join("")}
        </select>
        <select id="categoryFilter">
          <option value="">All categories</option>
          ${[...new Set(rows.map((row) => row.category))]
            .sort()
            .map(
              (category) => `<option value="${escapeAttribute(category)}">${escapeHtml(category)}</option>`
            )
            .join("")}
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Status</th>
            <th>Question</th>
            <th>Category</th>
            <th>Message</th>
            <th>Contact</th>
            <th>Created</th>
            <th>Admin</th>
          </tr>
        </thead>
        <tbody id="reports"></tbody>
      </table>
    </section>
  </main>
  <script id="feedback-data" type="application/json">${escapeHtml(JSON.stringify(rows))}</script>
  <script>
    const reports = JSON.parse(document.getElementById("feedback-data").textContent);
    const tbody = document.getElementById("reports");
    const search = document.getElementById("search");
    const statusFilter = document.getElementById("statusFilter");
    const categoryFilter = document.getElementById("categoryFilter");

    function render() {
      const query = search.value.trim().toLowerCase();
      const status = statusFilter.value;
      const category = categoryFilter.value;
      const filtered = reports.filter((report) => {
        const haystack = [report.id, report.question_id, report.paper_id, report.course_name, report.year, report.question_number, report.category, report.message, report.contact_email, report.status].join(" ").toLowerCase();
        return (!query || haystack.includes(query)) && (!status || report.status === status) && (!category || report.category === category);
      });

      tbody.innerHTML = filtered.map((report) => \`
        <tr>
          <td data-label="ID">\${escapeText(report.id)}</td>
          <td data-label="Status"><span class="badge \${escapeText(report.status)}">\${escapeText(report.status)}</span></td>
          <td data-label="Question">
            <strong>\${escapeText(report.year)} \${escapeText(report.course_name)} \${escapeText(report.question_number)}</strong>
            <code>\${escapeText(report.question_id)}</code>
          </td>
          <td data-label="Category">\${escapeText(report.category)}</td>
          <td data-label="Message" class="message">\${escapeText(report.message)}\${report.admin_note ? \`\\n\\nAdmin note: \${escapeText(report.admin_note)}\` : ""}</td>
          <td data-label="Contact">\${escapeText(report.contact_email || "")}</td>
          <td data-label="Created">\${escapeText(report.created_at)}</td>
          <td data-label="Admin">
            <code>pnpm run feedback:update -- \${escapeText(report.id)} triaged</code>
            <code>pnpm run feedback:update -- \${escapeText(report.id)} fixed --note "..."</code>
          </td>
        </tr>
      \`).join("");
    }

    function escapeText(value) {
      return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
    }

    search.addEventListener("input", render);
    statusFilter.addEventListener("change", render);
    categoryFilter.addEventListener("change", render);
    render();
  </script>
</body>
</html>`;
}

function buildSummary(rows: FeedbackReport[]) {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return {
    total: rows.length,
    lastSevenDays: rows.filter((row) => Date.parse(row.created_at) >= sevenDaysAgo).length,
    byStatus: rows.reduce<Record<string, number>>((counts, row) => {
      counts[row.status] = (counts[row.status] ?? 0) + 1;
      return counts;
    }, {})
  };
}

function getOptionalStatus(): FeedbackStatus | undefined {
  const status = getOption("status") as FeedbackStatus | undefined;

  if (!status) {
    return undefined;
  }

  if (!validStatuses.has(status)) {
    throw new Error(`Status must be one of: ${[...validStatuses].join(", ")}`);
  }

  return status;
}

function getOption(name: string): string | undefined {
  const prefix = `--${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));

  if (inline) {
    return inline.slice(prefix.length);
  }

  const index = args.indexOf(`--${name}`);
  if (index >= 0) {
    return args[index + 1];
  }

  return undefined;
}

function parsePositiveInteger(value: string, label: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }

  return parsed;
}

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function truncate(value: string, length: number): string {
  return value.length > length ? `${value.slice(0, length - 1)}...` : value;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function printUsage() {
  console.log(`Usage:
  pnpm run feedback:list -- [--limit 50] [--status new] [--database hscmathsdb-feedback] [--local]
  pnpm run feedback:update -- <id> <new|triaged|fixed|wontfix|spam> [--note "..."] [--database hscmathsdb-feedback] [--local]
  pnpm run feedback:export -- [--limit 500] [--status new] [--out output/feedback-dashboard.html] [--database hscmathsdb-feedback] [--local]

Defaults:
  database: FEEDBACK_D1_NAME or hscmathsdb-feedback
  target: --remote unless --local is supplied`);
}
