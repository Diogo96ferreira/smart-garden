This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Prerequisites

1.  **Environment Setup**:
    Copy `.env.example` to `.env.local` and fill in the required values:

    ```bash
    cp .env.example .env.local
    ```

    Required variables:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `GEMINI_API_KEY` (Optional, for AI features)

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Testing

This project uses Jest for unit testing. To run the tests:

```bash
npm test
```

### Scripts

- `npm run build-db`: Validates database connection and reads local calendar data (placeholder for seeding logic).
- `npm run lint`: Runs ESLint.
- `npm run format`: Runs Prettier.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Weather‑Aware Watering (New)

- The dashboard now sends your location (if set during onboarding) to `/api/generate-tasks`.
- The server uses Open‑Meteo (no API key required) to fetch recent rain and sunshine, then:
  - Skips creating watering tasks for today if it rained ≥ 5 mm yesterday.
  - Adjusts effective watering frequency dynamically:
    - More rain → water less often (increase interval).
    - More sun/heat → water more often (decrease interval).

Notes:

- Location is read from `localStorage` key `userLocation` (and falls back to `garden.settings.v1` → `userLocation`).
- If location is unavailable, watering behavior remains unchanged.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
