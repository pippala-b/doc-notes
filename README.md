# Doc Notes

Study-notes app for surgery residents preparing for the **ABSITE**. Capture a photo, a link, or typed notes; Claude turns the capture into a structured study note and files it into an ABSITE topic tree.

Status: local-only web experiment. The layout is phone-first (bottom tab bar, camera-friendly file input) as a stepping stone to an iPhone app.

## Features

- **Capture** – photos (downscaled in the browser), a URL (fetched by Claude's web-fetch tool), and/or free text.
- **AI-enhanced note** – cleaned-up source plus added context, high-yield facts, pitfalls, mnemonics, self-test questions, an optional Mermaid management algorithm, an optional bar chart, and a "verify against a primary source" list for anything the model was unsure of.
- **Study tree** – 31 categories / ~150 leaf topics (`src/lib/topics.ts`), with note counts and a filter.
- **Dashboard** – note count, topic coverage by category, review queue.
- **Interactive image notes** – tap a source photo to drop numbered pins with notes.
- **Self-rated confidence** – Shaky / Okay / Solid per note.

## Stack

Next.js 16 (App Router, TypeScript, Tailwind 4) · PostgreSQL 17 via `pg` · Anthropic SDK (`claude-opus-5`, structured outputs with Zod).

## Setup

```bash
brew install postgresql@17 && brew services start postgresql@17
createdb doc_notes
cp .env.example .env.local   # set DATABASE_URL and ANTHROPIC_API_KEY
npm install
npm run dev
```

The schema (`db/schema.sql`) is applied automatically on the first request; `npm run db:migrate` applies it manually. Any hosted Postgres works by changing `DATABASE_URL`.

## Privacy

This is a study tool, not a clinical record. **Do not capture patient identifiers.** Captures are sent to the Claude API for enhancement; notes and photos are stored in your Postgres database.

AI-generated content can be wrong. Treat every note as a draft to check against a primary reference.

## Layout

```
db/schema.sql               tables: notes, note_images
src/lib/topics.ts           ABSITE study tree
src/lib/schema.ts           Zod schema for the enhanced note (shared by API + UI)
src/app/api/enhance         Claude call
src/app/api/notes, images   CRUD + image bytes + pins
src/app/{page,topics,capture,notes/[id]}   UI
```
