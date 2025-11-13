# Smoothie de Jour App (Community)

A community-driven smoothie recipe app built with React, Vite, and TypeScript.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Smoothiedejour
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The server will start on `http://localhost:3000` (configured in `vite.config.ts`). The terminal will display the exact URL when the server is ready.

4. **Open your browser**
   
   Navigate to `http://localhost:3000` or use the URL shown in your terminal.


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

### Architecture Overview

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

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```
   
   Write clear, descriptive commit messages.

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

- The app uses React with TypeScript
- Styling is done with Tailwind CSS
- UI components are from Radix UI
- Run `npm run build` to test the production build locally
- **Pre-commit hooks:** This project uses Husky to run ESLint and tests before each commit. If linting or tests fail, the commit will be blocked. Run `npm run lint` manually to check for issues, or `npm run lint:fix` to automatically fix some issues.
- **Testing:** The project includes a comprehensive test suite using Vitest and React Testing Library. Tests cover utility functions, components, and integration scenarios.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the app for production
- `npm run lint` - Run ESLint to check for code quality issues
- `npm run lint:fix` - Run ESLint and automatically fix fixable issues
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once and exit
- `npm run test:ui` - Run tests with Vitest UI

## Testing

This project includes comprehensive test coverage for all major features:

### Test Coverage

- **Utility Functions** (`src/utils/share.test.ts`): Tests for recipe sharing functionality including Web Share API, clipboard fallback, and error handling
- **Component Tests**:
  - `RecipeCard.test.tsx`: Tests for recipe display, favorite toggling, and sharing
  - `FilterToggles.test.tsx`: Tests for filter functionality (no fat, no nuts, favorites only)
  - `ContributeRecipeModal.test.tsx`: Tests for recipe submission form and validation
- **Integration Tests** (`App.test.tsx`): Tests for app-wide functionality including:
  - Recipe display and filtering
  - Favorite management
  - Recipe submission
  - URL parameter handling
  - localStorage persistence

### Running Tests

```bash
# Run tests in watch mode (recommended during development)
npm run test

# Run tests once (used in CI/pre-commit)
npm run test:run

# Run tests with UI
npm run test:ui
```

Tests are automatically run before each commit via the pre-commit hook. All 45 tests must pass for commits to succeed, ensuring code quality and preventing regressions.