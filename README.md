# DiaVision

DiaVision is a diabetes risk predictor built with Next.js App Router, TypeScript, Tailwind CSS, and a server-side prediction adapter. It now ships with an embedded port of the supplied Python Pima-based logistic model, so the app can produce real predictions even before a separate external API is connected.

For a fuller client-facing explanation of the project structure, file roles, and end-to-end functionality, see `CLIENT_DOCUMENTATION.md`.

## Features

- Mobile-first diabetes risk questionnaire aligned to the real model inputs
- Server-side `/api/predict` route so secrets never reach the browser
- Embedded Pima logistic model with the same glucose/BMI copula adjustment as the supplied Python file
- External prediction adapter when you want to swap in a different backend later
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

Copy `.env.example` to `.env.local` and fill in the external provider settings only if you want to override the embedded predictor with a separate prediction service.

```bash
cp .env.example .env.local
```

Supported variables:

- `PREDICTION_API_URL`: external prediction endpoint. If omitted, the app uses the embedded Pima logistic model.
- `PREDICTION_API_KEY`: optional token passed to the provider.
- `PREDICTION_API_KEY_HEADER`: header name for the token. Defaults to `Authorization`.
- `PREDICTION_API_KEY_PREFIX`: prefix for authorization headers. Defaults to `Bearer`.
- `PREDICTION_API_TIMEOUT_MS`: request timeout for the external predictor.

## Expected external API contract

The internal route sends this payload to your provider:

```json
{
  "input": {
    "pregnancies": 4,
    "glucose": 156,
    "bloodPressure": 88,
    "skinThickness": 32,
    "insulin": 180,
    "diabetesPedigreeFunction": 0.74,
    "age": 58,
    "bmi": 31.8
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

If you do not set `PREDICTION_API_URL`, the app will still work by using the embedded version of the supplied Python model.

## Standalone Python script

`diabete_risk_predictor.py` is now runnable with only the Python standard library. It uses the same extracted coefficients and preprocessing constants as the app:

```bash
python3 diabete_risk_predictor.py '{"input":{"pregnancies":4,"glucose":156,"bloodPressure":88,"skinThickness":32,"insulin":180,"bmi":31.8,"diabetesPedigreeFunction":0.74,"age":58}}'
```

## Medical note

This project is an educational screening interface, not a diagnostic medical device. Any elevated result should be confirmed with a licensed clinician and formal lab testing.
# diabete-app
