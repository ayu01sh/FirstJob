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
- `GET /api/v1/resume/latest`

## Jobs
- `GET /api/v1/jobs` (page, limit, title, location, type)
- `GET /api/v1/jobs/matches/me`

## Notes
- `POST /api/v1/notes/generate`
- `GET /api/v1/notes`
- `GET /api/v1/notes/{id}`

## System
- `GET /health`
