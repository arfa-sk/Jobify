# Jobify – Auto Jobs Feature: Product Requirements Document
> **Version:** 1.0 | **Last Updated:** 2026-04-24
> **Purpose:** Persistent context file for Cursor AI. Read this before generating any code for the Auto Jobs pipeline.

---

## 1. Feature Overview

The **Auto Jobs** feature is a fully automated job discovery pipeline. It periodically fetches job listings from Rozee.pk's public RSS feed, stores them in MongoDB, and uses Google Gemini AI to score their relevance against a user's CV and extract structured company insights. The frontend team consumes this via REST API routes.

---

## 2. Tech Stack (LOCKED – Do Not Deviate)

| Concern        | Technology                              | Notes                                    |
|----------------|-----------------------------------------|------------------------------------------|
| Framework      | Next.js 16 (App Router)                 | Use `route.ts` not `pages/api`           |
| Language       | TypeScript (strict mode)                | No `any` types                           |
| Database       | MongoDB via Mongoose                    | See schemas in Section 5                 |
| AI Provider    | Google Gemini 1.5 Flash                 | Free tier. Already installed.            |
| Job Source     | Rozee.pk RSS Feed (XML)                 | No scraping. RSS only.                   |
| Scheduler      | node-cron                               | Runs in-process. No external queue.      |
| HTTP Client    | Native `fetch` (Node 18+)               | No axios needed.                         |
| XML Parsing    | `fast-xml-parser`                       | Install as dependency.                   |

---

## 3. Functional Requirements

### FR-1: Job Fetching
- The system SHALL fetch jobs from `https://www.rozee.pk/rss/` every 6 hours via a cron job.
- The system SHALL parse the RSS XML into a normalized `Job` object.
- The system SHALL deduplicate jobs using their `link` field as a unique external ID.
- The system SHALL store a maximum of 500 jobs in the database (evict oldest when over limit).
- The system SHALL log fetch results (count fetched, count new, count duplicate) to console.

### FR-2: Data Storage
- Every fetched job SHALL be stored in the `jobs` MongoDB collection.
- Jobs SHALL have a `status` field: `"pending"` (not yet analyzed) | `"analyzed"` | `"failed"`.
- AI analysis results SHALL be stored in a separate `analyses` collection, linked to `job._id`.

### FR-3: AI Relevance Scoring
- Given a user's CV text and a job's description, the system SHALL return:
  - `score` (integer 0–100): How relevant this job is to the CV.
  - `reasoning` (string): 2–3 sentence explanation of the score.
  - `matchedSkills` (string[]): Skills from the CV that match the job.
  - `missingSkills` (string[]): Skills required by the job not found in the CV.
- The Gemini prompt SHALL instruct the model to respond ONLY in valid JSON.

### FR-4: Company Insights Extraction
- Given a job description, the system SHALL extract:
  - `requiredSkills` (string[]): Hard skills mentioned in the listing.
  - `keyResponsibilities` (string[]): Main duties of the role.
  - `companyCharacteristics` (string[]): Culture/size/domain signals from the description.
  - `experienceLevel` (string): `"junior"` | `"mid"` | `"senior"` | `"not_specified"`.
- This extraction SHALL happen in the same Gemini API call as relevance scoring to minimize API usage.

### FR-5: API Layer
- All routes SHALL be in `src/app/api/` following Next.js 16 App Router conventions.
- All routes SHALL return JSON with a consistent envelope: `{ success: boolean, data?: any, error?: string }`.
- All routes SHALL validate inputs and return appropriate HTTP status codes.
- No route SHALL expose raw MongoDB `_id` fields directly; use `id` (string) in responses.

---

## 4. API Definitions

### `GET /api/jobs`
Fetch a paginated list of jobs from the database.

**Query Parameters:**
| Param    | Type   | Default | Description                        |
|----------|--------|---------|------------------------------------|
| `page`   | number | 1       | Page number                        |
| `limit`  | number | 20      | Results per page (max 50)          |
| `status` | string | all     | Filter: `pending`, `analyzed`      |
| `search` | string | -       | Full-text search on title/company  |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "jobs": [Job],
    "pagination": { "page": 1, "limit": 20, "total": 143, "pages": 8 }
  }
}
```

---

### `GET /api/jobs/:id`
Fetch a single job by its MongoDB ID, including its AI analysis if available.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "job": Job,
    "analysis": Analysis | null
  }
}
```

---

### `POST /api/analyze`
Trigger AI analysis for a specific job against a user's CV.

**Request Body:**
```json
{
  "jobId": "string (required)",
  "cvText": "string (required, min 100 chars)"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": { "analysis": Analysis }
}
```

---

### `POST /api/pipeline/trigger`
Manually trigger the job fetch pipeline (useful for development/testing).

**Request Body:** `{}` (empty)

**Response `200`:**
```json
{
  "success": true,
  "data": { "fetched": 45, "newJobs": 12, "duplicates": 33 }
}
```

---

## 5. Data Schemas

### `Job` (MongoDB Collection: `jobs`)
```typescript
{
  _id: ObjectId,
  externalId: string,          // MD5 hash of the job's RSS link (unique index)
  title: string,
  company: string,
  location: string,
  description: string,         // Full text of the job posting
  link: string,                // Original URL on Rozee.pk
  publishedAt: Date,           // From RSS <pubDate>
  fetchedAt: Date,             // When we stored it
  status: "pending" | "analyzed" | "failed",
  category: string,            // From RSS <category>
  source: "rozee_pk",          // Extensible for future sources
}
```

### `Analysis` (MongoDB Collection: `analyses`)
```typescript
{
  _id: ObjectId,
  jobId: ObjectId,             // Ref to Job
  cvHash: string,              // MD5 of CV text (for caching)
  score: number,               // 0–100
  reasoning: string,
  matchedSkills: string[],
  missingSkills: string[],
  requiredSkills: string[],
  keyResponsibilities: string[],
  companyCharacteristics: string[],
  experienceLevel: "junior" | "mid" | "senior" | "not_specified",
  analyzedAt: Date,
  geminiModel: string,         // e.g., "gemini-1.5-flash"
}
```

---

## 6. Environment Variables Required
```env
MONGODB_URI=mongodb+srv://...
GEMINI_API_KEY=...
CRON_SECRET=some-random-string    # For protecting the pipeline trigger endpoint
```

---

## 7. Success Criteria
- [ ] Jobs are automatically fetched from Rozee.pk RSS every 6 hours.
- [ ] No duplicate jobs appear in the database.
- [ ] Gemini returns valid, parseable JSON for every analysis call.
- [ ] All 4 API endpoints return correct responses with the standard envelope.
- [ ] The system handles Gemini API errors gracefully (marks job as `failed`, does not crash).
- [ ] `GET /api/jobs` responds in under 500ms for up to 500 stored jobs.