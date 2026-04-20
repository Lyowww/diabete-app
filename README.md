# DiaVision

DiaVision is a Vercel-ready diabetes risk predictor built with Next.js App Router, TypeScript, Tailwind CSS, and a server-side prediction adapter. It ships with a polished screening UI and a built-in demo predictor so local development and preview deployments work even before a real model or API is connected.

## Features

- Mobile-first diabetes risk questionnaire with accessible validation
- Server-side `/api/predict` route so secrets never reach the browser
- External prediction adapter with an automatic demo fallback
- Readable result cards with probability, key contributors, and next-step guidance
- Focused tests for validation and prediction-client behavior

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- `react-hook-form` + `zod`
- Vitest

## Local development

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the external provider settings only if you have a real prediction service.

```bash
cp .env.example .env.local
```

Supported variables:

- `PREDICTION_API_URL`: external prediction endpoint. If omitted, the app uses the built-in demo predictor.
- `PREDICTION_API_KEY`: optional token passed to the provider.
- `PREDICTION_API_KEY_HEADER`: header name for the token. Defaults to `Authorization`.
- `PREDICTION_API_KEY_PREFIX`: prefix for authorization headers. Defaults to `Bearer`.
- `PREDICTION_API_TIMEOUT_MS`: request timeout for the external predictor.

## Expected external API contract

The internal route sends this payload to your provider:

```json
{
  "input": {
    "age": 58,
    "biologicalSex": "female",
    "bmi": 31.8,
    "familyHistory": true,
    "hypertension": true,
    "activityLevel": "low",
    "glucoseHistory": "borderline",
    "smokingStatus": "former",
    "sleepHours": 5.5,
    "gestationalDiabetes": false
  }
}
```

Your service can respond with this shape:

```json
{
  "probability": 0.61,
  "riskLevel": "high",
  "confidence": 0.88,
  "score": 61,
  "maxScore": 100,
  "summary": "Higher diabetes screening risk.",
  "contributors": [
    {
      "label": "History of borderline glucose or A1c",
      "detail": "Prediabetes-range results are a major signal.",
      "impact": "strong"
    }
  ],
  "recommendedActions": [
    "Schedule a confirmatory HbA1c test."
  ],
  "provider": "Clinical API"
}
```

The adapter also accepts `risk_level` and `recommended_actions`.

## Scripts

```bash
npm run dev
npm run lint
npm run test
npm run build
```

## Deploy to Vercel

1. Import the repository into Vercel.
2. Keep the framework preset as `Next.js`.
3. Add the environment variables from `.env.example` in the Vercel project settings if you are using a real predictor.
4. Deploy.

If you do not set `PREDICTION_API_URL`, preview and production deployments will still work by using the built-in demo predictor.

## Medical note

This project is an educational screening interface, not a diagnostic medical device. Any elevated result should be confirmed with a licensed clinician and formal lab testing.
# diabete-app
