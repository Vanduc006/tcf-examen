# TCF Compréhension Orale — Practice App

Web app to create and take TCF listening tests from YouTube videos.

## Features

- **Home page**: list of created tests
- **Create test**: paste a YouTube URL → fetch French subtitles → GPT-4o-mini extracts questions with timestamps
- **Question UI**: TCF-style layout with headphones visualizer and YouTube audio playback at each question's timestamp
- **MySQL storage**: exams, questions, and options (no user auth)

## Setup

### 1. Database

```bash
mysql -u root -p < database/schema.sql
```

### 2. Environment

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=tcf_practice_db
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

### 3. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. Click **+ Nouveau test** on the home page
2. Paste a TCF Compréhension Orale YouTube link (French subtitles required)
3. Wait while subtitles are fetched and processed by the LLM (1–3 minutes)
4. Take the test — click **Écouter** on each question to play audio from the correct timestamp

## Tech stack

- Next.js 16 (App Router)
- MySQL 8
- OpenAI API (gpt-4o-mini)
- youtube-transcript-plus (subtitle extraction)
- YouTube IFrame API (timestamp audio playback)
