# CommitBot

CommitBot is a modern web application that helps you manage, analyze, and summarize your GitHub repositories and commit activity. It features a full-stack architecture using Express.js for the backend and React (with Vite) for the frontend, along with a rich set of UI components and integrations.

## Features

- **GitHub Integration:** Connect and analyze your repositories and commit history.
- **AI Summaries:** Generate AI-powered summaries of your commit activity using OpenAI.
- **Dashboard:** Visualize repository statistics, recent commits, and activity trends.
- **Authentication:** Secure login with session management (Passport.js, express-session).
- **Responsive UI:** Built with React, Tailwind CSS, and Radix UI for a modern, accessible experience.
- **Carousel, Charts, and More:** Includes advanced UI elements like carousels, charts, and resizable panels.

## Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Radix UI, Framer Motion
- **Backend:** Express.js, TypeScript, Drizzle ORM, PostgreSQL (NeonDB or local), OpenAI API
- **Authentication:** Passport.js (Local strategy), express-session, memorystore/connect-pg-simple
- **Other Libraries:**
  - Data visualization: recharts
  - Markdown rendering: react-markdown, rehype-raw, remark-gfm
  - Form handling: react-hook-form, zod, drizzle-zod
  - Carousel: embla-carousel-react
  - WebSockets: ws

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- pnpm (or npm/yarn)
- PostgreSQL database (local or NeonDB)
- GitHub OAuth App (for API access, if needed)
- OpenAI API key (for AI summaries)

### Installation

1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd commitbot
   ```
2. **Install dependencies:**
   ```sh
   pnpm install
   # or
   npm install
   ```
3. **Configure environment variables:**

   - Copy `sample_env copy.txt` to `.env` and fill in the required values (database URL, OpenAI key, etc).

4. **Database setup:**
   - Push schema to your database:
     ```sh
     pnpm db:push
     ```

### Running the App

- **Development mode:**

  ```sh
  pnpm dev
  ```

  - Starts the Express server with hot-reloading and the Vite dev server for the frontend.

- **Production build:**
  ```sh
  pnpm build
  pnpm start
  ```

## Project Structure

```
commitbot/
├── api/                # API endpoints (dashboard, etc)
├── client/             # Frontend React app
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Client-side utilities
│   │   └── pages/      # App pages
├── server/             # Express server code
│   ├── lib/            # Server-side utilities (GitHub, OpenAI, etc)
├── shared/             # Shared code/schema
├── drizzle.config.ts   # Drizzle ORM config
├── tailwind.config.ts  # Tailwind CSS config
├── vite.config.ts      # Vite config
├── package.json        # Project metadata and scripts
└── ...
```

## Scripts

- `pnpm dev` — Start development server
- `pnpm build` — Build frontend and backend
- `pnpm start` — Start production server
- `pnpm db:push` — Push Drizzle ORM schema to database
- `pnpm check` — TypeScript type check

## Environment Variables

Create a `.env` file in the root directory. Example variables:

```
DATABASE_URL=postgres://user:password@host:port/dbname
OPENAI_API_KEY=sk-...
SESSION_SECRET=your-session-secret
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

## Customization

- **UI:** Modify or extend components in `client/src/components/`.
- **API:** Add new endpoints in `api/` or `server/routes.ts`.
- **Database:** Update schema in `shared/schema.ts` and run `pnpm db:push`.

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your fork and submit a pull request

## License

MIT

## Acknowledgements

- [Drizzle ORM](https://orm.drizzle.team/)
- [OpenAI](https://openai.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

For questions or support, please open an issue or contact the maintainer.
