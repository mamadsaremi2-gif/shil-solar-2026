# SHIL AI Installation Preview - Real Image Service

This update connects the optional installation-preview block to a real server-side image generation endpoint.

## Required deployment environment variables

Set these variables on Vercel/your server environment, not in client-side Vite code:

```bash
OPENAI_API_KEY=sk-...
SHIL_IMAGE_MODEL=gpt-image-1
SHIL_IMAGE_SIZE=1024x1024
```

## Endpoint

```text
POST /api/shil-ai-installation-preview
```

The frontend sends the site image data URL plus the SHIL engineering prompt. The server calls OpenAI Images and returns a generated image as a data URL or URL.

## Security rule

Never put `OPENAI_API_KEY` in `VITE_*` variables. It must stay server-side only.
