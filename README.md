# AquaWatch

An advanced Next.js application for water quality and telemetry monitoring.

---

## Deployment Walkthrough: AquaWatch

The AquaWatch Next.js application has been successfully deployed to Vercel (completely for free, with full support for dynamic features, API routes, and database connectivity).

### Live Application Details
* **Production Deployment URL**: [https://aquawatch-iota.vercel.app](https://aquawatch-iota.vercel.app)
* **Alternative URL**: [https://aquawatch-7si911r5j-priyanshgupta739-5175s-projects.vercel.app](https://aquawatch-7si911r5j-priyanshgupta739-5175s-projects.vercel.app)

### What was Accomplished

#### 1. Fixed TypeScript Build Error
* **File**: [route.ts](file:///c:/Users/priya/Desktop/AquaWatch/src/app/api/telemetry/route.ts)
* **Fix**: Added `enableAveraging` to the properties destructured from `device` at line 112. Previously, it was used on line 126 without being destructured, causing typecheck compilation to fail.

#### 2. Environment Variables Configuration on Vercel
We added the following environment variables to the Vercel project scope for the Production environment:
* `MONGODB_URI`: Connects the serverless functions to the MongoDB Atlas cluster database.
* `NEXTAUTH_SECRET`: Used by NextAuth to sign and encrypt session cookies.
* `NEXTAUTH_URL`: Configured to the canonical production URL `https://aquawatch-iota.vercel.app` so authentication redirects function correctly.

#### 3. Vercel Production Build & Deployment
* Ran `npm install -g vercel` to update the local Vercel CLI.
* Linked the local project to a new Vercel project named `aquawatch`.
* Triggered production deployments and verified that the builds succeed.

---

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

