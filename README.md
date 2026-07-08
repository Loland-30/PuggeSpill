# SpellStack

SpellStack is a fullstack language-practice game designed as a companion tool for language learners.

The goal is simple: users can take words they encounter through school, language courses, apps, reading, or self-study, add them to custom decks, and practice them through game-like modes instead of traditional flashcards.

SpellStack is not trying to replace language-learning apps. It is meant to be a practice layer on top of whatever the user already uses to learn vocabulary.

## Live Demo

**Live site:** add link here
**Repository:** add GitHub link here

> For the best experience, play in fullscreen mode.

## Project Status

SpellStack is currently an early portfolio build / MVP. The current version focuses on the core loop:

* Create an account
* Create and manage custom decks
* Add words to decks
* Practice words through game modes
* Track progress and run results
* Manage profile/account data

The project is actively being developed further.

## Why I Built This

I wanted to build a language-learning tool that feels more like a game client than a traditional web app.

A lot of language-learning tools are good at introducing new words, but repetition can become dry. SpellStack focuses on making vocabulary practice more engaging through custom decks, game modes, progression, feedback, and eventually multiplayer.

## Features

### Current Features

* User registration and login
* Custom deck creation
* Word management
* Game/practice modes
* Score, accuracy and run tracking
* Profile/account functionality
* Theme/customization functionality
* Fullstack frontend/backend architecture

### Planned Features

* AI-generated example sentences based on deck words
* Weak-word practice based on previous mistakes
* Private realtime multiplayer rooms
* Friends/profile expansion
* More deck presets and filtering options
* Faster word import tools
* Optional auto-translation support

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* CSS

### Backend

* ASP.NET Core
* C#
* Entity Framework Core
* PostgreSQL

### Deployment / Planned Infrastructure

* Hosted frontend
* Hosted backend API
* Cloud database
* Custom domain
* Realtime multiplayer using WebSockets or SignalR

## Architecture Overview

SpellStack is built as a fullstack application with a separate frontend and backend.

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React, TypeScript, Vite | UI, game screens, deck management, auth flow and profile pages |
| Backend | ASP.NET Core, C# | API, authentication, deck/word/game/profile logic |
| Database | PostgreSQL | Persistent storage for users, decks, words and game results |

## Screenshots

Screenshots will be added after the early hosted build is deployed.

<!-- Example:
![SpellStack deck screen](./docs/screenshots/decks.png)
![SpellStack gameplay screen](./docs/screenshots/gameplay.png)
-->

## Roadmap

The next development goals are:

1. Deploy the early build with a custom domain
2. Improve README, project documentation and portfolio presentation
3. Add AI-generated example sentences
4. Add weak-word practice mode
5. Improve deck creation/import flow
6. Add realtime private multiplayer rooms
7. Continue improving the game feel with better feedback, sound and animations

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

Environment variables and database setup may be required for the backend to run correctly.

## Environment Variables

Environment variable documentation will be added as the deployment setup is finalized.

Examples of expected configuration:

```env
DATABASE_URL=
FRONTEND_URL=
ASPNETCORE_ENVIRONMENT=
```

## Known Limitations

This is an early build, so some features are still incomplete or planned.

Current limitations include:

* Multiplayer is not fully implemented as realtime private rooms yet
* AI sentence generation is planned but not implemented yet
* Some UI/UX areas are still being polished
* Asset usage and project structure are still being cleaned up for portfolio presentation
* User-generated content moderation features, such as reporting, blocking, and inappropriate content filtering, are not implemented yet

## Assets and Credits

Some visual game assets, including enemies and background/level art, are from CraftPix.

These assets were obtained through a paid CraftPix subscription and are used as part of the SpellStack game experience.

CraftPix assets are not created by me and are not included as my own original artwork. All rights to those assets belong to their respective creators / CraftPix.

CraftPix license information: https://craftpix.net/file-licenses/

## License

The source code in this repository is planned to be released under an open-source license.

Third-party assets, including CraftPix assets, are not covered by the source-code license and may not be copied, redistributed, reused, resold, or treated as open-source assets.

## Forks and Mods

Forks, redesigns, offline versions and custom variants are welcome.

If you publish a modified version, please make it clear whether it is an unofficial fork or a separate project based on SpellStack.

The SpellStack name, logo and official branding should not be used in a way that suggests official endorsement unless permission is given.

## Author

Built by Gøran Løland as a fullstack portfolio project and an actively developed language-practice tool.
