import { describe, expect, it } from "vitest";
import { onRequest } from "./feedback";

type InsertedFeedback = {
  questionId: string;
  paperId: string;
  courseName: string;
  year: number;
  questionNumber: string;
  category: string;
  message: string;
  ipHash: string;
};

class FakeD1Database {
  inserts: InsertedFeedback[] = [];

  prepare(query: string) {
    void query;
    const inserts = this.inserts;
    let bindings: unknown[] = [];

    const statement = {
      bind: (...values: unknown[]) => {
        bindings = values;
        return statement;
      },
      first: async <T = Record<string, unknown>>() => ({ count: 0 }) as T,
      run: async () => {
        inserts.push({
          questionId: String(bindings[0]),
          paperId: String(bindings[1]),
          courseName: String(bindings[2]),
          year: Number(bindings[3]),
          questionNumber: String(bindings[4]),
          category: String(bindings[5]),
          message: String(bindings[6]),
          ipHash: String(bindings[11])
        });

        return { meta: { last_row_id: inserts.length } };
      }
    };

    return statement;
  }
}

describe("feedback Pages Function", () => {
  it("validates and inserts a same-origin feedback report", async () => {
    const database = new FakeD1Database();
    const response = await submitFeedback(database, {
      message: "The worked solution skips the key substitution step."
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({ ok: true, id: 1, status: "new" });
    expect(database.inserts).toHaveLength(1);
    expect(database.inserts[0]).toMatchObject({
      questionId: "adv-2025-q01",
      paperId: "adv-2025",
      courseName: "Mathematics Advanced",
      year: 2025,
      questionNumber: "Q1",
      category: "worked-solution",
      message: "The worked solution skips the key substitution step."
    });
    expect(database.inserts[0].ipHash).toHaveLength(64);
  });

  it("rejects invalid feedback bodies", async () => {
    const database = new FakeD1Database();
    const response = await submitFeedback(database, { message: "short" });

    expect(response.status).toBe(400);
    expect(database.inserts).toHaveLength(0);
  });

  it("rejects cross-origin submissions", async () => {
    const database = new FakeD1Database();
    const response = await submitFeedback(
      database,
      { message: "The answer has a sign error in the final line." },
      "https://elsewhere.example"
    );

    expect(response.status).toBe(403);
    expect(database.inserts).toHaveLength(0);
  });
});

async function submitFeedback(
  database: FakeD1Database,
  overrides: Partial<Record<string, unknown>>,
  origin = "https://hscmathsdb.example"
) {
  return onRequest({
    request: new Request("https://hscmathsdb.example/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
        "cf-connecting-ip": "203.0.113.10",
        "user-agent": "vitest"
      },
      body: JSON.stringify({
        questionId: "adv-2025-q01",
        paperId: "adv-2025",
        courseName: "Mathematics Advanced",
        year: 2025,
        questionNumber: "Q1",
        category: "worked-solution",
        message: "The worked solution skips the key substitution step.",
        pageUrl: "https://hscmathsdb.example/",
        appVersion: "0.54.0",
        ...overrides
      })
    }),
    env: {
      FEEDBACK_DB: database,
      FEEDBACK_IP_SALT: "test-salt"
    }
  });
}
