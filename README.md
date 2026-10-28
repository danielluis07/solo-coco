This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Metadata and deployment

Set `PRODUCTION_URL` to the real, absolute production origin (including `https://`)
before building to enable `metadataBase`, canonical, `og:url` and absolute sharing
image URLs. Leave it unset until the hostname is known: social image paths stay
relative, and canonical and `og:url` are omitted. No hostname is inferred from
deployment URLs.

Indexing is enabled only when `VERCEL_ENV=production`, or, for self-hosted
deployments without `VERCEL_ENV`, `DEPLOYMENT_ENV=production`. Vercel's environment
takes precedence. Previews, development and unconfigured environments get
`noindex` even when `PRODUCTION_URL` is supplied. `NODE_ENV` does not control this.
These values are read during the build; rebuild after changing them.

`public/sharing-image.png` (1200 × 630), `app/favicon.ico` (32 × 32),
`app/icon.png` (32 × 32) and `app/apple-icon.png` (180 × 180) are static files
generated from the original brand SVGs and the rendered Hero can. Rebuild with
`bun run assets:hero`. Editable SVG sources are in `assets/metadata/` and `assets/brand/`.
The approved title, description and image alt text live in `content/page.ts`.

Run `bun run test:metadata` to build and check five deployment scenarios with
Playwright, including production and preview with and without a production URL.
It starts a fresh server for each build. The `.example` hostname used by these
tests is reserved test data. The ordinary `bun run test:e2e` suite assumes an
unconfigured environment; use the matrix command for deployment-specific checks.

## Hero 3D assets

The coconut, its halves, the can, the Só o Coco label and the Hero poster are
generated from the sources in `assets/hero/`. Rebuild them all with
`bun run assets:hero`; it needs Blender 5.2+ and KTX-Software's `ktx` CLI.
`assets/hero/README.md` lists the sources, licences, outputs and budgets.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
