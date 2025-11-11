# Landing Page Interactive Demo - Setup Guide

This guide explains how to set up the fully functional interactive demo on your landing page.

## What Was Built

### 🎬 Updated Components

1. **VideoDemo** (`components/landing/VideoDemo.tsx`)
   - Updated YouTube video ID to `vMZHiBhr0SM`
   - Chapters will be auto-generated from transcript
   - Clickable timestamps seek to video position

2. **InteractiveFAQ** (`components/landing/InteractiveFAQ.tsx`)
   - **Now fully functional!**
   - Users can type questions and get AI responses
   - Responses include clickable timestamps that jump to video
   - Uses RAG (Retrieval Augmented Generation) over transcript
   - Powered by Claude 3.5 Haiku

### 🚀 New Infrastructure

3. **API Endpoint** (`app/api/landing/chat/route.ts`)
   - POST `/api/landing/chat` - Handle chat queries
   - GET `/api/landing/chat` - Health check
   - Vector similarity search using OpenAI embeddings
   - Claude AI for response generation

4. **Processing Script** (`scripts/process-landing-transcript.ts`)
   - Reads raw transcript
   - Chunks into searchable segments
   - Generates OpenAI embeddings
   - Extracts chapters using Claude
   - Saves processed data

## Setup Instructions

### Step 1: Add Your Transcript

Place your video transcript in:
```
data/landing-page/demo-video-transcript.txt
```

**Supported formats:**
- Plain text (one paragraph per section)
- Timestamped text: `[00:00:15] Text here...`
- Or: `0:15 Text here...`

### Step 2: Process the Transcript

Run the processing script:
```bash
npm run process-landing-transcript
```

This will:
- Parse your transcript
- Create searchable chunks (500 words each with 50-word overlap)
- Generate embeddings via OpenAI
- Extract chapters using Claude AI
- Save to `processed-chunks.json` and `chapters.json`

**Expected output:**
```
🎬 Processing landing page demo transcript...
📖 Reading transcript...
✅ Read 45,832 characters

✂️  Parsing and chunking transcript...
✅ Created 67 chunks

🧠 Generating embeddings (this may take a minute)...
   Processed 5/67 chunks...
   ...
✅ Generated embeddings for 67 chunks

✅ Extracted 8 chapters

💾 Saving processed data...
✅ Saved to data/landing-page/processed-chunks.json
✅ Saved to data/landing-page/chapters.json

📊 Summary:
   - Transcript: 45,832 characters
   - Chunks: 67
   - Chapters: 8
   - Embeddings: 67 vectors (1536 dimensions)

✨ Processing complete! The interactive demo is ready to use.
```

### Step 3: Update Video Chapters (Optional)

The script auto-generates `chapters.json`. To use these in the VideoDemo component:

1. Open `components/landing/VideoDemo.tsx`
2. Replace the hardcoded `chapters` array with a dynamic import from `chapters.json`
3. Or manually update the chapters array with the extracted data

### Step 4: Test the Demo

1. Start your dev server (if not running):
   ```bash
   npm run dev
   ```

2. Visit: http://localhost:3003

3. Scroll to the "Ask ChronosAI Anything" section

4. Try asking questions like:
   - "How long does it take to set up a Whop account?"
   - "What are the key benefits of using Whop?"
   - "Tell me about the marketplace opportunity"

5. Click on timestamps in responses to jump to video

## How It Works

### RAG Pipeline

```
User Question
    ↓
Generate Query Embedding (OpenAI)
    ↓
Vector Similarity Search (Cosine Similarity)
    ↓
Retrieve Top 3 Relevant Chunks
    ↓
Build Context for Claude
    ↓
Generate Response with Timestamps (Claude)
    ↓
Display to User with Clickable Timestamps
```

### Timestamp Seeking

When a user clicks a timestamp like `[3:45]`:
1. Page scrolls to video section
2. Timestamp is parsed to seconds (225s)
3. YouTube iframe URL is updated: `?start=225&autoplay=1`
4. Video jumps to that position and plays

## API Usage

### Chat Endpoint

**Request:**
```bash
curl -X POST http://localhost:3003/api/landing/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I start on Whop?"}'
```

**Response:**
```json
{
  "response": "Setting up your Whop account takes less than 5 minutes [2:30]. The platform has streamlined onboarding that enables you to get your first product live quickly.",
  "timestamps": ["2:30"],
  "relevantChunks": [
    {
      "text": "The onboarding process is incredibly fast...",
      "startTime": "2:30",
      "similarity": 0.87
    }
  ]
}
```

### Health Check

```bash
curl http://localhost:3003/api/landing/chat
```

Returns:
```json
{
  "status": "ready",
  "message": "Landing page demo is ready"
}
```

Or if not set up:
```json
{
  "status": "not_initialized",
  "message": "Run npm run process-landing-transcript to initialize"
}
```

## Cost Estimates

**One-time processing (per video):**
- OpenAI Embeddings: ~$0.05-0.15 (for ~60-100 chunks)
- Claude API (chapter extraction): ~$0.01

**Per query:**
- OpenAI Embedding: ~$0.0001
- Claude API (response): ~$0.003-0.01
- **Total per interaction: ~$0.01**

**For 1000 demo interactions/month: ~$10**

## Troubleshooting

### Error: "Processed chunks not found"
**Solution:** Run `npm run process-landing-transcript`

### Error: "OpenAI API key not configured"
**Solution:** Add `OPENAI_API_KEY` to your `.env.local`

### Error: "Anthropic API key not configured"
**Solution:** Add `ANTHROPIC_API_KEY` to your `.env.local`

### Chat returns generic responses
**Issue:** Transcript might not have been processed correctly
**Solution:**
1. Check `data/landing-page/processed-chunks.json` exists
2. Verify it contains embeddings
3. Re-run processing script

### Timestamps not working
**Issue:** Timestamp format not recognized
**Solution:** Ensure timestamps in responses are in format `[MM:SS]` or `[HH:MM:SS]`

## Files Generated

After processing, you'll have:

```
data/landing-page/
├── README.md                    # This directory info
├── SETUP_GUIDE.md              # This file
├── demo-video-transcript.txt   # Raw transcript (you provide)
├── processed-chunks.json       # Searchable chunks with embeddings
└── chapters.json               # Auto-extracted chapters
```

## Next Steps

1. **Paste your transcript** into `data/landing-page/demo-video-transcript.txt`
2. **Run** `npm run process-landing-transcript`
3. **Test the demo** at http://localhost:3003
4. **Deploy** - Everything will work in production with environment variables set

## Production Deployment

Make sure these environment variables are set in Vercel:

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

The processed JSON files should be committed to git so they're available in production.

---

**Built with:**
- OpenAI `text-embedding-3-small` (1536 dimensions)
- Claude 3.5 Haiku for responses
- Vector similarity search (cosine distance)
- Next.js 14 App Router
- TypeScript

**Questions?** Check the main CLAUDE.md or reach out!
