# Jobify – Auto Jobs: Cursor Coding Instructions
> **Purpose:** Persistent rules for Cursor AI. These instructions govern every code generation decision for the Auto Jobs backend feature. Read this file before writing any code.

---

## 1. Project Identity

This is **Jobify**, a Next.js 16 App Router application. You are building the **Auto Jobs backend pipeline**. Your counterparts on the frontend team will consume the APIs you build. Do not modify any existing UI files (`src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`) unless explicitly told to.

---

## 2. Folder Responsibilities (Strict)

Every file must be placed in the correct location. Think of the project as having three zones:

**Zone 1: `src/lib/`** — Shared, stateless utilities used by both the app and server. Contains things like the database connection singleton and pure utility functions. Nothing here should have business logic.

**Zone 2: `src/server/`** — Core backend business logic. This is NOT exposed directly to the internet. It contains services (fetcher, analyzer, scheduler) and Mongoose models. Functions here are called by API routes, not imported by frontend components.

**Zone 3: `src/app/api/`** — Next.js route handlers. These are thin controllers. They validate inputs, call services from `src/server/`, and return formatted responses. They must not contain business logic directly.

```
src/
  lib/
    db/
      mongoose.ts          ← DB connection singleton (Zone 1)
    utils/
      rss-parser.ts        ← RSS XML → Job object parser (Zone 1)
      hash.ts              ← MD5 hashing utility (Zone 1)
  server/
    models/
      Job.ts               ← Mongoose Job schema (Zone 2)
      Analysis.ts          ← Mongoose Analysis schema (Zone 2)
    jobs/
      fetcher.ts           ← Fetches Rozee.pk RSS (Zone 2)
      deduplicator.ts      ← Prevents duplicate DB entries (Zone 2)
      scheduler.ts         ← node-cron runner (Zone 2)
    ai/
      gemini.ts            ← (existing) Gemini client
      analyzer.ts          ← CV scoring + insight extraction (Zone 2)
  app/
    api/
      jobs/
        route.ts           ← GET /api/jobs (Zone 3)
      jobs/[id]/
        route.ts           ← GET /api/jobs/:id (Zone 3)
      analyze/
        route.ts           ← POST /api/analyze (Zone 3)
      pipeline/
        route.ts           ← POST /api/pipeline/trigger (Zone 3)
```

---

## 3. TypeScript Rules

Always use TypeScript with strict mode. Define explicit return types for every exported function. Define interfaces or types for every data structure — never use `Record<string, any>` or untyped objects. When calling Gemini and parsing JSON responses, always validate the parsed object shape before using it (use a type guard or Zod-like validation).

Here is the canonical interface for a parsed RSS job item — use this exactly:

```typescript
export interface RawJob {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  company: string;
  location: string;
  category: string;
}
```

---

## 4. Database Rules

Never call `mongoose.connect()` more than once in a process. Always use the connection singleton pattern at `src/lib/db/mongoose.ts`. The pattern is: check if `mongoose.connection.readyState` is already 1 (connected) before calling `connect()`. In Next.js, the module cache keeps this singleton alive across hot reloads in development.

Always use `lean()` on Mongoose queries that are read-only — it returns plain JavaScript objects instead of Mongoose Documents, which is faster and avoids accidental mutation.

Always add indexes at the schema level, not as separate migration scripts. The `Job` model needs a unique index on `externalId` and a regular index on `status` and `publishedAt`.

---

## 5. API Route Rules

Every route handler in `src/app/api/` must follow this exact pattern:

```typescript
import { NextRequest, NextResponse } from "next/server";

// Standard success response
function ok(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

// Standard error response
function fail(message: string, status = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    await connectDB(); // Always connect first
    // ... business logic using services from src/server/
    return ok(result);
  } catch (error) {
    console.error("[API Error]", error);
    return fail("Internal server error");
  }
}
```

Never return raw Mongoose documents. Always `.toObject()` or use `.lean()` and strip the `__v` field. Rename `_id` to `id` in all API responses.

For the `POST /api/pipeline/trigger` route, validate the `x-cron-secret` header against `process.env.CRON_SECRET` before executing. Return 401 if it doesn't match.

---

## 6. AI (Gemini) Rules

Always instruct Gemini to return **only** JSON with no markdown fences. The system prompt for analysis must say: *"You are a JSON API. Respond only with a valid JSON object. No explanations, no markdown, no preamble."*

Always wrap `JSON.parse()` on Gemini responses in a try/catch. If parsing fails, log the raw response for debugging and throw a descriptive error. Never let a JSON parse failure crash the application silently.

Use `gemini-1.5-flash` as the default model — it is fast, free-tier eligible, and sufficient for structured extraction tasks.

Combine relevance scoring AND company insights into a **single Gemini API call** to minimize API usage. Design the prompt to return one JSON object containing both sets of fields.

---

## 7. Job Fetching Rules

Use the Rozee.pk RSS feed: `https://www.rozee.pk/rss/`. This is a public, legal, and stable data source. Do not attempt to scrape HTML pages — RSS is preferred.

Use the native `fetch()` API (available in Node 18+). Do not install axios.

For XML parsing, use `fast-xml-parser`. Install it: `npm install fast-xml-parser`.

Generate `externalId` by creating an MD5 hash of the job's `link` URL. This creates a stable, short unique identifier. Use Node's built-in `crypto` module for hashing — do not install a separate MD5 library.

When inserting jobs, use Mongoose's `insertMany()` with the `ordered: false` option and catch duplicate key errors (MongoDB error code 11000). This is the correct and efficient way to handle deduplication in bulk.

---

## 8. Error Handling Rules

Never let uncaught exceptions crash the Next.js process. Every `async` function that is called by an API route must have a try/catch. The scheduler's cron callback must have its own top-level try/catch.

When a Gemini API call fails for a specific job, mark that job's `status` as `"failed"` in the database and log the error. Do not throw the error upward — let the pipeline continue processing other jobs.

Use `console.error("[ServiceName]", error)` format for all error logging so errors are easily greppable.

---

## 9. Security Practices

Never commit secrets. All environment variables go in `.env.local` (already in `.gitignore`). Access them via `process.env.VARIABLE_NAME`.

The `MONGODB_URI` must only be read in `src/lib/db/mongoose.ts`. No other file should access it directly.

The `GEMINI_API_KEY` must only be read in `src/server/ai/gemini.ts`. No other file should access it directly.

The pipeline trigger endpoint (`POST /api/pipeline/trigger`) must be protected by the `CRON_SECRET` header check. Without this, anyone on the internet could trigger your job pipeline and exhaust your Gemini API quota.

---

## 10. Do's and Don'ts

**DO:**
- Keep API routes thin — they only validate, call a service, and return a response.
- Use async/await consistently. No `.then()` chains.
- Add JSDoc comments to every exported function explaining what it does, its parameters, and what it returns.
- Use Mongoose's built-in validators (e.g., `min`, `max`, `enum`) in schema definitions.
- Log the start and end of every cron run with timestamps.

**DON'T:**
- Don't import from `src/server/` directly in frontend components. The server zone is server-only.
- Don't use `mongoose.model()` more than once for the same model name — always guard with `mongoose.models.Job || mongoose.model('Job', JobSchema)`.
- Don't fetch LinkedIn. It will be blocked and violates ToS.
- Don't make multiple Gemini API calls per job when one combined call will do.
- Don't store the user's raw CV text in the `analyses` collection — store only its MD5 hash for cache-keying. The CV is sensitive data.
- Don't use `var`. Use `const` and `let` only.
- Don't use default exports for utility functions and services — use named exports for clarity.