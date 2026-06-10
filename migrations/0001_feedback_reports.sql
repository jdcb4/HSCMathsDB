CREATE TABLE IF NOT EXISTS feedback_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id TEXT NOT NULL,
  paper_id TEXT NOT NULL,
  course_name TEXT NOT NULL,
  year INTEGER NOT NULL,
  question_number TEXT NOT NULL,
  category TEXT NOT NULL CHECK (
    category IN (
      'question-text',
      'answer',
      'worked-solution',
      'diagram',
      'syllabus-link',
      'other'
    )
  ),
  message TEXT NOT NULL,
  contact_email TEXT,
  page_url TEXT,
  app_version TEXT,
  user_agent TEXT,
  ip_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'triaged', 'fixed', 'wontfix', 'spam')),
  admin_note TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS feedback_reports_status_created_idx
  ON feedback_reports (status, created_at DESC);

CREATE INDEX IF NOT EXISTS feedback_reports_question_created_idx
  ON feedback_reports (question_id, created_at DESC);

CREATE INDEX IF NOT EXISTS feedback_reports_ip_created_idx
  ON feedback_reports (ip_hash, created_at DESC);
