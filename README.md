# Arohan Frontend

**Let’s grow, one meaningful habit at a time.**

The React and TypeScript client for Arohan, a cue-first personal-growth system.
This repository is independently buildable and deployable from the Spring Boot
API.

## Local development

Requirements: Node.js 22.12 or newer and npm.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

The default API location is `http://localhost:8081/api/v1`.

## Quality checks

```powershell
npm run lint
npm test -- --run
npm run build
```

GitHub Actions repeats these checks on every push and pull request.

## Vercel preview

1. Import this repository into Vercel.
2. Keep the detected framework as **Vite**.
3. Set `VITE_API_URL` to the Render API URL ending in `/api/v1`.
4. Deploy.

`vercel.json` routes direct visits such as `/growth-studio` back to the React
application instead of returning a 404.

Do not commit `.env.local`. Vite variables are included in the browser build, so
only public configuration such as the API URL may use the `VITE_` prefix.
