<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/83e4e97f-6d9b-4bd5-8a84-109e8a7257a9

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. For local Ollama execution, set `AI_PROVIDER=ollama`, `OLLAMA_BASE_URL=http://127.0.0.1:11434`, and `OLLAMA_MODEL=gemma4:e4b` in [.env.local](.env.local)
3. Run the app:
   `npm run dev`
