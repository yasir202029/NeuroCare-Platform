# Environment configuration

Copy `.env.example` to `.env` for local development. Never commit `.env` files or place secret values in browser code, source files, logs, or client-side analytics. Only variables prefixed with `NEXT_PUBLIC_` are safe to expose to a browser build.

| Variable | Required when | Purpose | Exposure |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | all deployments | Public application origin | browser-safe |
| `NEXT_PUBLIC_PORTAL_URL` | patient portal enabled | Patient portal origin | browser-safe |
| `NEXT_PUBLIC_CLINICIAN_PORTAL_URL` | clinician portal enabled | Clinician portal origin | browser-safe |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase auth/data enabled | Supabase project URL | browser-safe |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase auth/data enabled | Supabase anonymous key | browser-safe |
| `SUPABASE_SERVICE_ROLE_KEY` | server-side privileged Supabase jobs | Bypasses RLS; keep server-only | secret |
| `OPENAI_API_KEY` | OpenAI enabled | OpenAI server integration | secret |
| `ANTHROPIC_API_KEY` | Claude enabled | Anthropic server integration | secret |
| `GOOGLE_AI_API_KEY` | Gemini enabled | Google AI server integration | secret |
| `OPENROUTER_API_KEY` | OpenRouter enabled | OpenRouter server integration | secret |
| `OLLAMA_BASE_URL` | local models enabled | Ollama endpoint; default is local | server-only |
| `RESEND_API_KEY` | Resend enabled | Transactional email | secret |
| `SENDGRID_API_KEY` | SendGrid enabled | Transactional email | secret |
| `STRIPE_SECRET_KEY` | Stripe enabled | Server-side payment operations | secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe enabled | Stripe.js public key | browser-safe |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhooks enabled | Validates Stripe webhook signatures | secret |
| `AWS_ACCESS_KEY_ID` | S3 enabled | S3 access credentials | secret |
| `AWS_SECRET_ACCESS_KEY` | S3 enabled | S3 access credentials | secret |
| `S3_BUCKET_NAME` | S3 enabled | Bucket for private documents | server-only |
| `AWS_REGION` | S3 enabled | Bucket region | server-only |
| `GOOGLE_ANALYTICS_ID` | Google Analytics enabled | GA measurement ID | browser-safe |
| `GOOGLE_TAG_MANAGER_ID` | GTM enabled | Tag Manager container ID | browser-safe |
| `POSTHOG_API_KEY` | PostHog enabled | Client analytics project key | browser-safe |
| `POSTHOG_HOST` | self-hosted PostHog | Analytics host | browser-safe |
| `GOOGLE_SEARCH_CONSOLE` | Search Console integration | Verification/integration value | server-only |
| `BING_WEBMASTER_API_KEY` | Bing integration | Bing Webmaster API access | secret |

## Deployment rules

1. Set secrets in the deployment provider's encrypted secret manager, not in the repository.
2. Keep `SUPABASE_SERVICE_ROLE_KEY`, AI provider keys, email keys, Stripe secret/webhook keys, and AWS credentials exclusively in server runtimes.
3. Apply Supabase Row Level Security before enabling production patient data.
4. Rotate any credential that is accidentally exposed, then revoke the old value at its provider.
