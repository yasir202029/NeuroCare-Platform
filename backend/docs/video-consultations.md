# Video consultation platform

## Lifecycle

```text
Appointment confirmed
  -> POST /api/v1/video/sessions
  -> POST /api/v1/video/sessions/:id/waiting-room/open
  -> POST /api/v1/video/sessions/:id/join
  -> POST /api/v1/video/sessions/:id/start
  -> POST /api/v1/video/sessions/:id/recording/start (after consent)
  -> POST /api/v1/video/sessions/:id/recording/stop
  -> POST /api/v1/video/sessions/:id/end
```

Starting a session writes a `VideoSessionEvent`, marks the appointment `IN_PROGRESS`, creates an `AiSession`, and starts a transcription `AiRun`. Ending a session marks the appointment `COMPLETED`, writes the end event, closes the AI session, and creates review-required `AiSummary` and `AiExtraction` records.

## Provider adapters

`VideoProviderService` is the provider boundary. `TEAMS` and `ZOOM` are persisted as provider values. Local development uses deterministic provider-shaped links when credentials are absent. Production must replace the adapter implementation with Microsoft Graph and Zoom OAuth/API calls and must reject unconfigured providers.

Required environment variables:

- `VIDEO_DEFAULT_PROVIDER`
- `TEAMS_TENANT_ID`, `TEAMS_CLIENT_ID`, `TEAMS_CLIENT_SECRET`
- `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`
- `VIDEO_RECORDING_ENABLED`
- `TRANSCRIPTION_PROVIDER`
- `TRANSCRIPTION_LANGUAGE`
- `OPENAI_API_KEY`

## AI safety

- Recording requires a persisted patient `RecordingConsent`.
- The clinician controls session start, recording, and end.
- Transcripts and generated outputs are clinical data and require private storage and access logging.
- AI summaries, diagnoses, medications, physical-health extractions, letters, and reports are drafts only.
- `AiGeneratedDocument` and `AiSummary` outputs require clinician review before sharing.
- Risk flags are suggestions and must not autonomously diagnose, prescribe, or make safeguarding decisions.
- Production transcription should use a UK/EU-approved processor with a signed data-processing agreement.
