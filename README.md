# SpellStack

SpellStack is a full-stack vocabulary practice game designed as a companion tool for language learners.

Users can collect words encountered through school, language courses, apps, reading, or self-study, organize them into custom decks, and practice them through game-like modes instead of relying only on traditional flashcards.

SpellStack is not intended to replace language-learning platforms. It is built as a practice layer that can be used alongside tools such as Duolingo, LingoDeer, classroom learning, or independent study.

## Live Demo

**Live site:** [spellstack.dev](https://spellstack.dev)

The public build currently runs SpellStack **v0.5.0** and demonstrates the main account, deck, gameplay, trial, profile, theme, update, password-reset, and realtime multiplayer flows.

## Project Status

SpellStack is actively developed as a public early-access and portfolio project.

Production releases are deployed from the `main` branch. New features and fixes are developed in separate branches and merged into `main` when they are ready for release.

The current build supports the complete core loop:

- Create an account and sign in
- Recover an account through email-based password reset
- Create and manage custom vocabulary decks
- Add, edit, translate, and organize words
- Practice decks through multiple prompt modes and gameplay modifiers
- Complete exam-style Trials
- Review mistakes and run results
- Track score, accuracy, streaks, achievements, and history
- Customize profiles, fonts, themes, backgrounds, and audio
- Create or join private realtime multiplayer rooms
- Play the realtime multiplayer Race mode

SpellStack is still under active development. Additional multiplayer modes, AI-assisted sentence generation, deck sharing, feedback tools, and moderation systems are planned.

## Project Direction

Many language-learning tools are good at introducing new vocabulary, but repetition can become dry.

SpellStack focuses on making vocabulary review more engaging through:

- User-created decks
- Flexible prompt directions
- Game modes and modifiers
- Progression and achievements
- Detailed result feedback
- Exam-style Trials
- Realtime multiplayer
- Language-specific tools such as readings and romanization

The long-term goal is to make SpellStack useful both for quick personal practice and shared learning sessions with friends.

## Features

### Accounts and Security

- Account registration and session-based authentication
- Strong password requirements
- Email-based password reset using verification codes
- Mailtrap Transactional Email API integration
- Hashed session tokens
- Rate-limited password-reset requests
- Generic password-reset responses to reduce account enumeration
- Production CORS configuration

### Deck Management

- Create, edit, delete, pin, and organize custom decks
- Grid and list views
- Deck filtering
- Add and edit vocabulary entries
- Original and translated word fields
- Multiple accepted answers
- Automatic translation and language suggestions
- Language-aware Create Deck interface
- Optional classic Create Deck workflow
- Support for multiple Japanese readings
- Korean romanization data
- Minimum deck requirements for specific modes

### Gameplay

- Original prompt mode
- Translation prompt mode
- Mixed prompt mode
- Score, lives, streaks, timers, and response tracking
- Exact spelling validation with Unicode normalization
- Explicit support for alternative accepted answers
- Gameplay modifiers, including:
  - Hidden
  - Hint
  - Extra Heart
  - Extra Time
  - Zen
  - Hardcore
  - Boss Rush
  - Time Rush
  - Blind Start
  - Momentum
  - No Time
- Run result summaries
- Accuracy and average response-time statistics
- Mistake review
- Rush Hour tracking

### Trials

- Deck-based exam-style Trials
- Minimum requirement of 10 words
- Every word appears once per attempt
- Feedback is shown after the Trial instead of during it
- Star ratings based on completion score
- Trial progress resets when relevant deck content changes
- Detailed mistake-review modal

### Realtime Multiplayer

- Private multiplayer rooms
- Joinable room codes
- Realtime lobby updates using SignalR
- Host-controlled game setup
- Player ready states
- Race game mode
- Configurable target scores
- Host-controlled round flow and shuffle behavior
- Multiplayer result tracking

Race is currently the first playable realtime multiplayer mode. Additional multiplayer modes are planned.

### Profiles and Customization

- User profiles
- Profile images
- Country and region settings
- Achievements
- Performance and progress information
- Theme palettes and gradients
- Predefined and uploaded backgrounds
- Glow and border-radius settings
- Multiple interface fonts
- Audio settings
- Custom audio uploads
- Japanese and Korean romanization display settings

### Updates

- Public Updates page
- Version and release-note entries
- Administrator create, update, and delete tools
- Localized interface support in Norwegian and English

## Planned Features

- Additional realtime multiplayer modes
- Deck sharing
- In-app feedback tools
- AI-generated example sentences
- Sentence difficulty levels
- Weak-word practice based on previous mistakes
- Faster bulk-import tools
- Deck combining
- Expanded public profile and social features
- User-generated content reporting
- Moderation and blocking tools
- Additional language-specific vocabulary data

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS and CSS
- Framer Motion
- SignalR client
- Leaflet where map-related UI is required

### Backend

- ASP.NET Core
- C#
- Entity Framework Core
- PostgreSQL
- SignalR
- Session-token authentication
- Mailtrap Transactional Email API
- File-based upload storage

### Development and Deployment

- Docker for local PostgreSQL development
- Cloudflare Pages for the frontend
- Railway for the backend API
- Railway PostgreSQL for the production database
- Railway Volume for persistent uploaded files
- Mailtrap for transactional password-reset email
- Custom domain at `spellstack.dev`

## Architecture Overview

SpellStack uses a separate frontend, backend, database, realtime communication layer, and persistent upload storage.

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React, TypeScript, Vite | Interface, authentication flow, deck management, gameplay, profiles, settings, and multiplayer UI |
| Backend | ASP.NET Core, C# | API endpoints, authentication, business logic, email flow, uploads, and persistence |
| Database | PostgreSQL, Entity Framework Core | Users, decks, words, sessions, achievements, game results, Trials, updates, and multiplayer data |
| Realtime communication | SignalR | Multiplayer lobby and game-state communication |
| Upload storage | Railway Volume | Persistent profile images, custom audio, and theme backgrounds |
| Transactional email | Mailtrap Email API | Password-reset verification emails |
| Frontend hosting | Cloudflare Pages | Public web application |
| Backend hosting | Railway | Production API and realtime services |

## Roadmap

Near-term priorities include:

1. Improve documentation and portfolio presentation
2. Continue learning and documenting the existing backend architecture
3. Polish the realtime Race mode
4. Make result components more reusable across game modes
5. Expand Japanese and Korean language-data support
6. Add deck sharing and in-app feedback
7. Add AI-assisted example sentences and difficulty levels
8. Continue security, performance, and error-handling improvements
9. Add reporting and moderation tools before larger public growth

## Running Locally

### Prerequisites

- Node.js
- .NET SDK
- PostgreSQL or Docker
- A Mailtrap API token when testing real password-reset delivery

### Frontend

From the repository root:

```bash
cd Frontend/SpellStack
npm install
npm run dev
```

### Backend

From the repository root:

```bash
cd Backend
dotnet restore
dotnet run
```

The backend expects a PostgreSQL connection string through `ConnectionStrings:DefaultConnection`.

Local development can use a locally installed PostgreSQL instance or the included Docker-based development setup.

## Environment Variables

### Frontend

```env
VITE_API_BASE_URL=http://localhost:5084
VITE_API_URL=http://localhost:5084/api
```

### Backend

```env
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=http://localhost:5084

ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=spellstack_dev;Username=spellstack_dev;Password=change-me

Frontend__AllowedOrigins__0=http://localhost:5173
Frontend__BaseUrl=http://localhost:5173

UPLOAD_ROOT=

Mailtrap__ApiToken=
Mailtrap__Endpoint=https://send.api.mailtrap.io/api/send
Mailtrap__FromEmail=no-reply@spellstack.dev
Mailtrap__FromName=SpellStack

PASSWORD_RESET_HMAC_KEY=
```

Real API tokens, database passwords, HMAC keys, and production credentials must never be committed to the repository.

### Persistent Uploads

For production uploads, `UPLOAD_ROOT` must point to persistent storage.

On Railway, mount a Volume and configure:

```env
UPLOAD_ROOT=/data/uploads
```

Uploaded files are served through `/uploads/...`.

Without persistent storage, uploaded profile images, custom audio, and theme backgrounds may disappear after a backend restart or redeployment.

## Testing

Run the backend test suite with:

```bash
dotnet test Backend.Tests/Backend.Tests.csproj
```

Build the backend with:

```bash
dotnet build Backend/Backend.csproj
```

Run the frontend checks configured by the project with:

```bash
cd Frontend/SpellStack
npm run lint
npm run build
```

## Known Limitations

SpellStack is still an early-access project.

Current limitations include:

- Race is currently the only playable realtime multiplayer mode
- AI sentence generation is planned but not implemented
- Deck sharing is not implemented
- In-app user feedback is not implemented
- Reporting, blocking, and moderation tools are not implemented
- Some language-specific datasets and suggestion flows are still being expanded
- Uploaded files depend on correctly configured persistent production storage
- Some interface and gameplay areas still require mobile and performance polish

## Contributors

- **Gøran Løland** — full-stack development, frontend, backend, deployment, authentication, gameplay, multiplayer, deck systems, profiles, themes, and production debugging
- **Ole Petter Granmar** — project collaboration and contributions, including mobile and client-related work where applicable

## Assets and Credits

Some visual game assets, including enemies and background or level artwork, are provided by CraftPix.

These assets were obtained through a paid CraftPix subscription and are used as part of the SpellStack game experience.

CraftPix assets are third-party assets and are not original SpellStack artwork. All rights to those assets belong to their respective creators and CraftPix.

CraftPix license information:

<https://craftpix.net/file-licenses/>

## License

An open-source license has not yet been selected for the repository.

Until a license is added, the source code is publicly viewable but should not be assumed to grant permission for redistribution, modification, or reuse.

Third-party assets, including CraftPix assets, will not be covered by any future source-code license and may not be copied, redistributed, reused, resold, or treated as open-source assets.

## Forks and Modifications

A clear contribution and reuse policy will be added together with the project's open-source license.

Unofficial versions must not use the SpellStack name, logo, or official branding in a way that suggests endorsement or affiliation without permission.
