# FirstJob MVP API Contract

All success responses:

```json
{
  "message": "string",
  "data": {}
}
```

All errors:

```json
{
  "message": "Request failed",
  "error": {
    "code": "HTTP_ERROR",
    "details": ["reason"]
  }
}
```

## Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

## Resume
- `POST /api/v1/resume/upload` (PDF/TXT only)
  - accepts `file` and optional `target_role` in multipart form data
  - persists `target_role` back to the user profile when provided
  - returns `resume_id`, `filename`, `target_role`, `extracted_skills`, `ats_score`, `missing_skills`, `suggestions`
- `GET /api/v1/resume/latest`
  - returns `resume_id`, `filename`, `target_role`, `ats_score`, `extracted_skills`, `missing_skills`, `suggestions`, `created_at`

## Jobs
- `GET /api/v1/jobs` (page, limit, title, location, type)
  - sorted by `posted_at` descending
- `GET /api/v1/jobs/matches/me`
  - returns `source_skills`, `source_type`, `needs_resume`, `items`
  - `source_type` is `resume`, `profile`, or `none`
  - returns an empty list when there is no meaningful skill source

## Notes
- `POST /api/v1/notes/generate`
  - requires a configured OpenAI API key
  - saves notes only after strict schema validation succeeds
  - returns `503 / AI_NOT_CONFIGURED` when the key is missing
  - returns `502 / NOTES_GENERATION_FAILED` when the model response is invalid or upstream generation fails
- `GET /api/v1/notes`
- `GET /api/v1/notes/{id}`

## System
- `GET /health`
