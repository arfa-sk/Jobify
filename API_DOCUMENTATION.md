# Jobify API Documentation

Base URL (local): `http://localhost:3000`

All endpoints return JSON in a standard envelope:

- Success: `{ "success": true, "data": ... }`
- Error: `{ "success": false, "error": "message" }`

## 1) Get Jobs (Paginated + Filters)

- **Route:** `GET /api/jobs`
- **Purpose:** Returns paginated jobs with optional status and text search filters.

### Query Parameters

- `page` (optional, number, default: `1`, min: `1`)
- `limit` (optional, number, default: `20`, min: `1`, max: `50`)
- `status` (optional, enum: `all | pending | analyzed`, default: `all`)
- `search` (optional, string; matches job title/company, case-insensitive)

### Request Body

None.

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "680a6cb95cb7a5458de7f095",
        "externalId": "f84ddf5f4f54e0c4af52f4f5dd3f95ce",
        "title": "Backend Developer",
        "company": "Acme Tech",
        "location": "Lahore",
        "description": "Job description...",
        "link": "https://example.com/jobs/123",
        "publishedAt": "2026-04-22T09:12:00.000Z",
        "fetchedAt": "2026-04-24T17:45:10.000Z",
        "status": "pending",
        "category": "Software Development",
        "source": "rozee-rss"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 324,
      "pages": 17
    }
  }
}
```

### Error Responses

- `400`: invalid `status` value
- `500`: internal server error

### Postman Example

- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/jobs?page=1&limit=20&status=all&search=backend`
- **Headers:** none required

---

## 2) Get Job by ID (with Latest Analysis)

- **Route:** `GET /api/jobs/:id`
- **Purpose:** Returns one job and its most recent analysis (or `null` if not analyzed yet).

### Path Parameters

- `id` (required, MongoDB ObjectId)

### Request Body

None.

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "job": {
      "id": "680a6cb95cb7a5458de7f095",
      "externalId": "f84ddf5f4f54e0c4af52f4f5dd3f95ce",
      "title": "Backend Developer",
      "company": "Acme Tech",
      "location": "Lahore",
      "description": "Job description...",
      "link": "https://example.com/jobs/123",
      "publishedAt": "2026-04-22T09:12:00.000Z",
      "fetchedAt": "2026-04-24T17:45:10.000Z",
      "status": "analyzed",
      "category": "Software Development",
      "source": "rozee-rss"
    },
    "analysis": {
      "id": "680a6f605cb7a5458de7f182",
      "jobId": "680a6cb95cb7a5458de7f095",
      "cvHash": "ad56a6f7f4de0fdb57dd45c43f0f5d1f",
      "score": 78,
      "reasoning": "Candidate is strong in Node.js and APIs but lacks Kubernetes depth.",
      "matchedSkills": ["Node.js", "TypeScript", "REST APIs"],
      "missingSkills": ["Kubernetes"],
      "requiredSkills": ["Node.js", "TypeScript", "Kubernetes"],
      "keyResponsibilities": ["Build backend services", "Maintain CI/CD"],
      "companyCharacteristics": ["Product-focused", "Fast-paced"],
      "experienceLevel": "mid",
      "analyzedAt": "2026-04-24T18:10:03.000Z",
      "geminiModel": "gemini-1.5-flash"
    }
  }
}
```

### Error Responses

- `400`: invalid job id
- `404`: job not found
- `500`: internal server error

### Postman Example

- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/jobs/{{jobId}}`
- **Headers:** none required

---

## 3) Analyze Job Against CV

- **Route:** `POST /api/analyze`
- **Purpose:** Runs AI analysis of one job description against provided CV text, stores/upserts analysis, and marks job status.

### Request Headers

- `Content-Type: application/json`

### Request Body

```json
{
  "jobId": "680a6cb95cb7a5458de7f095",
  "cvText": "Paste full CV text here. It must be at least 100 characters long..."
}
```

### Validation Rules

- `jobId` is required and must be a valid MongoDB ObjectId.
- `cvText` is required and must be at least 100 characters.

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "analysis": {
      "id": "680a6f605cb7a5458de7f182",
      "jobId": "680a6cb95cb7a5458de7f095",
      "cvHash": "ad56a6f7f4de0fdb57dd45c43f0f5d1f",
      "score": 78,
      "reasoning": "Candidate is strong in Node.js and APIs but lacks Kubernetes depth.",
      "matchedSkills": ["Node.js", "TypeScript", "REST APIs"],
      "missingSkills": ["Kubernetes"],
      "requiredSkills": ["Node.js", "TypeScript", "Kubernetes"],
      "keyResponsibilities": ["Build backend services", "Maintain CI/CD"],
      "companyCharacteristics": ["Product-focused", "Fast-paced"],
      "experienceLevel": "mid",
      "analyzedAt": "2026-04-24T18:10:03.000Z",
      "geminiModel": "gemini-1.5-flash"
    }
  }
}
```

### Error Responses

- `400`: invalid/missing `jobId` or invalid/short `cvText`
- `404`: job not found
- `502`: AI analysis call failed
- `500`: internal server error

### Postman Example

- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/analyze`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**

```json
{
  "jobId": "{{jobId}}",
  "cvText": "{{cvText}}"
}
```

---

## 4) Trigger Fetch Pipeline (Protected)

- **Route:** `POST /api/pipeline/trigger`
- **Purpose:** Manually triggers RSS fetch pipeline after secret validation.

### Request Headers

- `x-cron-secret: <your-secret>`

### Request Body

None.

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "fetched": 120,
    "inserted": 34,
    "duplicates": 86
  }
}
```

> Note: exact `data` fields depend on `fetchRozeeJobs()` return shape.

### Error Responses

- `401`: missing/invalid `x-cron-secret`
- `500`: internal server error

### Postman Example

- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/pipeline/trigger`
- **Headers:** `x-cron-secret: {{cronSecret}}`
- **Body:** none

---

## Postman Collection (Import)

Import the file `Jobify_API.postman_collection.json` in Postman.

### Suggested Environment Variables

- `baseUrl` = `http://localhost:3000`
- `jobId` = a valid MongoDB job id from your DB
- `cronSecret` = same value as `CRON_SECRET` in `.env.local`
- `cvText` = sample CV text (100+ chars)
