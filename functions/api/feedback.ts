import { Hono } from "hono";
import { z } from "zod";

type D1RunResult = {
  meta: {
    last_row_id?: number;
  };
};

type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  run: () => Promise<D1RunResult>;
};

type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
};

type FeedbackEnv = {
  FEEDBACK_DB: D1Database;
  FEEDBACK_IP_SALT?: string;
};

const feedbackCategories = [
  "question-text",
  "answer",
  "worked-solution",
  "diagram",
  "syllabus-link",
  "other"
] as const;

const feedbackSchema = z.object({
  questionId: z.string().min(1).max(120),
  paperId: z.string().min(1).max(120),
  courseName: z.string().min(1).max(120),
  year: z.number().int().min(1900).max(2100),
  questionNumber: z.string().min(1).max(40),
  category: z.enum(feedbackCategories),
  message: z.string().trim().min(8).max(1200),
  contactEmail: z.string().trim().email().max(254).optional().or(z.literal("")),
  pageUrl: z.string().trim().url().max(1200).optional().or(z.literal("")),
  appVersion: z.string().trim().max(40).optional().or(z.literal(""))
});

const app = new Hono<{ Bindings: FeedbackEnv }>();

app.options("/api/feedback", (context) => context.newResponse(null, 204));

app.post("/api/feedback", async (context) => {
  if (!isSameOriginRequest(context.req.raw)) {
    return context.json({ error: "Feedback can only be submitted from this site." }, 403);
  }

  if (!context.env.FEEDBACK_DB) {
    return context.json({ error: "Feedback storage is not configured." }, 503);
  }

  const body = await context.req.json().catch(() => undefined);
  const parsed = feedbackSchema.safeParse(body);

  if (!parsed.success) {
    return context.json(
      {
        error: "Invalid feedback report.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      },
      400
    );
  }

  const requestIp = getClientIp(context.req.raw);
  const ipHash = await hashIp(requestIp, context.env.FEEDBACK_IP_SALT);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const database = context.env.FEEDBACK_DB;
  const [ipRate, questionRate] = await Promise.all([
    countRecentIpReports(database, ipHash, oneHourAgo),
    countRecentQuestionReports(database, ipHash, parsed.data.questionId, oneHourAgo)
  ]);

  if (ipRate >= 5 || questionRate >= 3) {
    return context.json({ error: "Too many feedback reports. Please try again later." }, 429);
  }

  const createdAt = new Date().toISOString();
  const userAgent = context.req.raw.headers.get("user-agent")?.slice(0, 500) ?? "";
  const result = await database
    .prepare(
      `INSERT INTO feedback_reports (
        question_id,
        paper_id,
        course_name,
        year,
        question_number,
        category,
        message,
        contact_email,
        page_url,
        app_version,
        user_agent,
        ip_hash,
        status,
        created_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, 'new', ?13)`
    )
    .bind(
      parsed.data.questionId,
      parsed.data.paperId,
      parsed.data.courseName,
      parsed.data.year,
      parsed.data.questionNumber,
      parsed.data.category,
      parsed.data.message,
      parsed.data.contactEmail || null,
      parsed.data.pageUrl || null,
      parsed.data.appVersion || null,
      userAgent,
      ipHash,
      createdAt
    )
    .run();

  return context.json(
    {
      ok: true,
      id: result.meta.last_row_id,
      status: "new"
    },
    201
  );
});

app.all("/api/feedback", (context) => context.json({ error: "Method not allowed." }, 405));

export const onRequest = (context: { request: Request; env: FeedbackEnv }) =>
  app.fetch(context.request, context.env);

async function countRecentIpReports(
  database: D1Database,
  ipHash: string,
  oneHourAgo: string
): Promise<number> {
  const result = await database
    .prepare("SELECT COUNT(*) AS count FROM feedback_reports WHERE ip_hash = ?1 AND created_at >= ?2")
    .bind(ipHash, oneHourAgo)
    .first<{ count: number }>();

  return Number(result?.count ?? 0);
}

async function countRecentQuestionReports(
  database: D1Database,
  ipHash: string,
  questionId: string,
  oneHourAgo: string
): Promise<number> {
  const result = await database
    .prepare(
      "SELECT COUNT(*) AS count FROM feedback_reports WHERE ip_hash = ?1 AND question_id = ?2 AND created_at >= ?3"
    )
    .bind(ipHash, questionId, oneHourAgo)
    .first<{ count: number }>();

  return Number(result?.count ?? 0);
}

function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

async function hashIp(ipAddress: string, salt = "development-feedback-salt"): Promise<string> {
  const input = new TextEncoder().encode(`${salt}:${ipAddress}`);
  const digest = await crypto.subtle.digest("SHA-256", input);

  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
