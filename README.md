# Smoothie de Jour App (Community)

A community-driven smoothie recipe app built with React, Vite, and TypeScript.

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Smoothiedejour
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory with your Supabase credentials:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your Supabase project credentials:
   - Get your Supabase URL and anon key from your [Supabase Dashboard](https://supabase.com/dashboard)
   - Go to your project → Settings → API
   - Copy the "Project URL" and "anon public" key
   
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
   
   **Note:** The `.env` file is gitignored and won't be committed to the repository.

   **Using `.env.local`:** You can also use `.env.local` instead of `.env`. Vite automatically loads `.env.local` and it takes precedence over `.env`. This is useful for local-only overrides.

   **For Local Testing:** If you want to test Edge Functions locally, create a `.env.local` file (or update your `.env`):
   ```env
   VITE_SUPABASE_URL=http://localhost:54321
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
   ```
   Then run `supabase functions serve recipes` in a separate terminal to start the local edge function server.
   
   **Note:** After changing environment variables, restart your dev server (`npm run dev`) for the changes to take effect.

### Running the Development Server

Start the development server:

```bash
npm run dev
```

The server will start on `http://localhost:3000` (configured in `vite.config.ts`). The terminal will display the exact URL when the server is ready. Open your browser and navigate to the displayed URL.

### Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `build/` directory. You can preview the production build locally by serving the `build` directory with a static file server.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the app for production
- `npm run lint` - Run ESLint to check for code quality issues
- `npm run lint:fix` - Run ESLint and automatically fix fixable issues
- `npm run test` - Run tests in watch mode (recommended during development)
- `npm run test:run` - Run tests once and exit (used in CI/pre-commit)
- `npm run test:ui` - Run tests with Vitest UI

## Testing

The project includes a comprehensive test suite using Vitest and React Testing Library. Tests cover utility functions, components, and integration scenarios.

```bash
# Run tests in watch mode (recommended during development)
npm run test

# Run tests once (used in CI/pre-commit)
npm run test:run

# Run tests with UI
npm run test:ui
```

**Pre-commit hooks:** This project uses Husky to run ESLint and tests before each commit. If linting or tests fail, the commit will be blocked. Make sure to run `npm run lint` and `npm run test:run` before committing to catch issues early.

## CI/CD

This project uses automated CI/CD pipelines to ensure code quality:

- **GitHub Actions:** Runs linting and tests on every push and pull request to `main`, `master`, and `develop` branches. The workflow tests against Node.js 20.x. If linting or tests fail, the PR will be blocked from merging.
- **Vercel:** Builds and deploys the application. Since GitHub Actions already validates code quality, Vercel focuses on fast builds and deployments.

You can view the CI status in:
- GitHub: Check the "Actions" tab in your repository
- Vercel: Check the deployment logs in your Vercel dashboard

## Contributing

### Making Changes

1. **Create a new branch**
   ```bash
   git checkout -b your-feature-name
   ```
   
   Use descriptive branch names like:
   - `feature/add-recipe-filter`
   - `fix/recipe-card-styling`
   - `docs/update-readme`

2. **Make your changes**
   
   - Write clean, readable code
   - Follow the existing code style
   - Test your changes locally
   - Run `npm run lint` to check for issues
   - Run `npm run test:run` to ensure tests pass

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```
   
   Write clear, descriptive commit messages. Note that pre-commit hooks will automatically run linting and tests. If they fail, the commit will be blocked.

4. **Push your branch**
   ```bash
   git push origin your-feature-name
   ```

5. **Create a Pull Request**
   
   - Push your branch to the remote repository
   - Open a pull request on GitHub (or your Git hosting platform)
   - Provide a clear description of what your changes do and why
   - Wait for review and feedback

### Development Tips

- The app uses React 18 with TypeScript
- Styling is done with Tailwind CSS
- UI components are from Radix UI
- Run `npm run build` to test the production build locally
- Use `npm run lint:fix` to automatically fix some linting issues

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  React 18 + TypeScript                                   │
│       │                                                  │
│       ├──► Vite (Build Tool)                            │
│       ├──► Tailwind CSS (Styling)                       │
│       ├──► Radix UI (Components)                        │
│       ├──► Motion (Animations)                          │
│       └──► Lucide React (Icons)                         │
│                                                          │
└───────────────────┬─────────────────────────────────────┘
                    │
                    │ HTTP Requests
                    │
┌───────────────────▼─────────────────────────────────────┐
│                      Backend                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Supabase Edge Functions                                │
│       │                                                  │
│       ├──► Hono Framework                              │
│       └──► PostgreSQL Database                          │
│            (Store/Fetch Recipes)                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```


## Technology Stack

This project leverages a modern, type-safe tech stack designed for performance and developer experience. Below is a detailed breakdown of each technology and why it was chosen.

### Frontend Technologies

#### React 18 + TypeScript
- **What it does:** React is a declarative JavaScript library for building user interfaces. TypeScript adds static type checking to JavaScript.
- **Why we use it:** React's component-based architecture makes it easy to build reusable UI elements and manage application state. TypeScript catches errors at compile-time, improves code maintainability, and provides excellent IDE autocomplete support. React 18 introduces concurrent features and improved performance optimizations.

#### Vite
- **What it does:** A next-generation frontend build tool that provides lightning-fast development server startup and optimized production builds.
- **Why we use it:** Vite uses native ES modules and esbuild for near-instantaneous hot module replacement (HMR), making development significantly faster than traditional bundlers. It also produces optimized, tree-shaken production builds with minimal configuration.

#### Tailwind CSS
- **What it does:** A utility-first CSS framework that provides low-level utility classes to build custom designs directly in your markup.
- **Why we use it:** Tailwind eliminates the need to write custom CSS for most styling needs, speeds up development, and ensures consistent design patterns. The utility classes are purged in production, resulting in minimal CSS bundle sizes.

#### Radix UI
- **What it does:** A collection of unstyled, accessible component primitives for building design systems.
- **Why we use it:** Radix UI components are fully accessible out of the box (ARIA compliant, keyboard navigation, focus management) and provide complete styling control. This allows us to create a custom design system while maintaining accessibility standards without starting from scratch.

#### Motion (formerly Framer Motion)
- **What it does:** A production-ready motion library for React that provides declarative animations and gesture handling.
- **Why we use it:** Motion makes it easy to create smooth, performant animations and transitions. It handles complex animation orchestration, layout animations, and gesture interactions with a simple, declarative API that integrates seamlessly with React.

#### Lucide React
- **What it does:** A collection of beautifully crafted, customizable SVG icons as React components.
- **Why we use it:** Lucide provides a consistent, modern icon set with tree-shaking support, meaning only used icons are included in the bundle. The icons are customizable via props and integrate perfectly with React and Tailwind CSS.

### Backend Technologies

#### Supabase
- **What it does:** An open-source Firebase alternative providing PostgreSQL database, authentication, storage, and edge functions.
- **Why we use it:** Supabase offers a fully managed PostgreSQL database with real-time capabilities, automatic API generation, and built-in security features. It eliminates the need to manage database infrastructure while providing the power and flexibility of PostgreSQL.

#### Supabase Edge Functions
- **What it does:** Serverless functions that run on Deno at the edge, close to users for low latency.
- **Why we use it:** Edge Functions enable us to run custom server logic without managing servers. They automatically scale, have built-in CORS handling, and execute close to users for optimal performance. Perfect for API endpoints that interact with our database.

#### Hono
- **What it does:** A lightweight, ultrafast web framework for building edge functions and APIs.
- **Why we use it:** Hono is specifically designed for edge computing environments like Supabase Edge Functions. It's incredibly fast, has a minimal footprint, and provides a familiar Express-like API. It's optimized for the Deno runtime used by Supabase Edge Functions.

#### PostgreSQL
- **What it does:** A powerful, open-source relational database management system.
- **Why we use it:** PostgreSQL provides ACID compliance, complex query capabilities, JSON support, and excellent performance. Supabase's managed PostgreSQL includes additional features like real-time subscriptions, automatic backups, and connection pooling, making it ideal for storing and querying community recipe data.
