# SpellStack

SpellStack is a full-stack vocabulary practice game designed as a companion tool for language learners.

The goal is simple: users can take words they encounter through school, language courses, apps, reading, or self-study, add them to custom decks, and practice them through game-like modes instead of traditional flashcards.

SpellStack is not intended to replace language-learning platforms. It is built as a practice layer that can sit alongside tools such as Duolingo, Lingodeer, classroom learning, or self-study.

## Live Demo

**Live site:** [spellstack.dev](https://spellstack.dev)

SpellStack is currently deployed as an early MVP / portfolio build. The hosted version demonstrates the main user flow, account system, custom decks, gameplay loop, profiles, themes, and production deployment setup.

## Project Status

SpellStack is actively developed. The current build focuses on the core loop:

* Create an account and sign in
* Create and manage custom vocabulary decks
* Add and edit words
* Practice words through game modes and modifiers
* Track score, accuracy, streaks, achievements, and run history
* Customize profile images, themes, backgrounds, and audio settings

Some systems are intentionally marked as planned or in progress, especially realtime multiplayer, AI-assisted content, and moderation tooling.

## Project Direction

Many language-learning tools are good at introducing new words, but repetition can become dry. SpellStack focuses on making vocabulary practice more engaging through custom decks, game modes, progression, feedback, and eventually multiplayer.

## Features

### Current Features

* Account registration and session-based login
* Custom deck creation and word management
* Gameplay with scoring, lives, timers, modifiers, and run results
* Achievements and unlock feedback
* Profile, performance, and progress tracking
* Theme customization with predefined and uploaded backgrounds
* Profile image uploads
* Audio settings and custom audio uploads
* Early mock multiplayer room UI
* Production deployment across separate frontend, backend, database, and upload storage services

### Planned Features

* Realtime private multiplayer rooms
* AI-generated example sentences based on deck words
* Weak-word practice based on previous mistakes
* Friends and expanded public profile features
* Faster word import tools
* Optional auto-translation support
* User-generated content reporting and moderation tools

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS / CSS
* Framer Motion

### Backend

* ASP.NET Core
* C#
* Entity Framework Core
* PostgreSQL
* Session-token based authentication

### Deployment

* Cloudflare Pages for the frontend
* Railway for the backend API
* Railway PostgreSQL for the database
* Railway Volume for persistent uploaded files
* Custom domain at `spellstack.dev`

## Architecture Overview

SpellStack is built as a fullstack application with a separate frontend and backend.

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React, TypeScript, Vite | UI, auth flow, deck management, game screens, profile pages, and settings |
| Backend | ASP.NET Core, C# | API, authentication, deck/word/game/profile logic, uploads, and persistence |
| Database | PostgreSQL | Persistent storage for users, decks, words, achievements, sessions, and game results |
| Upload storage | Railway Volume | Persistent storage for profile images, custom audio, and theme backgrounds |

## Roadmap

Near-term development priorities:

1. Improve project documentation and portfolio presentation
2. Polish gameplay feedback, sound, and animation
3. Continue hardening production deployment and upload handling
4. Add AI-assisted vocabulary tooling
5. Add weak-word practice and smarter review flows
6. Replace mock multiplayer with realtime private rooms
7. Add reporting/moderation tools for user-generated content

## Running Locally

### Prerequisites

* Node.js
* .NET SDK
* PostgreSQL

### Frontend

```bash
cd SpellStack/Frontend/SpellStack
npm install
npm run dev
```

### Backend

```bash
cd SpellStack/Backend
dotnet restore
dotnet run
```

The backend expects a PostgreSQL connection string through `ConnectionStrings:DefaultConnection`. Local development can use a local PostgreSQL instance or another developer-provided PostgreSQL setup.

## Environment Variables

Frontend:

```env
VITE_API_URL=http://localhost:5084/api
```

Backend:

```env
ASPNETCORE_ENVIRONMENT=Development
ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=spellstack_dev;Username=spellstack_dev;Password=change-me
Frontend__AllowedOrigins__0=http://localhost:5173
UPLOAD_ROOT=
```

For production uploads, `UPLOAD_ROOT` should point to persistent storage. On Railway, mount a Volume and set:

```env
UPLOAD_ROOT=/data/uploads
```

Uploaded files are served publicly under `/uploads/...`. Without persistent storage, uploaded profile images, custom audio, and theme backgrounds may disappear after a backend restart or redeploy.

## Known Limitations

This is an early MVP, so some features are incomplete or planned.

Current limitations include:

* Multiplayer is currently mock/UI-first and not fully realtime yet
* AI sentence generation is planned but not implemented yet
* Some UI/UX areas are still being polished
* User-generated content moderation features, such as reporting, blocking, and inappropriate content filtering, are not implemented yet
* Uploaded files require persistent production storage to survive backend redeploys/restarts

## Contributors

* Gøran Løland — full-stack development, backend, frontend, deployment, gameplay systems, theme/profile systems, and production debugging
* Ole Petter Granmar — collaboration/project contributions, including mobile/client work where applicable

## Assets and Credits

Some visual game assets, including enemies and background/level art, are from CraftPix.

These assets were obtained through a paid CraftPix subscription and are used as part of the SpellStack game experience.

CraftPix assets are third-party assets and are not original SpellStack artwork. All rights to those assets belong to their respective creators / CraftPix.

CraftPix license information: https://craftpix.net/file-licenses/

## License

The source code in this repository is planned to be released under an open-source license.

Third-party assets, including CraftPix assets, are not covered by the source-code license and may not be copied, redistributed, reused, resold, or treated as open-source assets.

## Forks and Mods

Forks, redesigns, offline versions, and custom variants are welcome.

If a modified version is published, it should be clear whether it is an unofficial fork or a separate project based on SpellStack.

The SpellStack name, logo, and official branding should not be used in a way that suggests official endorsement unless permission is given.


