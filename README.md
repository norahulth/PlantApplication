# Plant Application

A Vue-based web application that helps users care for their plants with timely watering notifications, a simple setup for adding new plants, and stored information tailored to each specific plant. This repository contains the client application, supporting API endpoints, and build configuration for deployment via Vercel.

## Table of Contents
- Overview
- Getting Started
- Available Scripts
- Project Structure
- Linting & Quality
- Deployment
- Contributing
- Additional Resources

## Overview
- Guide newcomers through configuring their first plant with contextual tips.
- Display a dashboard of all registered plants with status indicators.
- Provide on-demand care instructions fetched from API endpoints.
- Persist plant data with the Vuex store for predictable state management.

## Getting Started
### Prerequisites
- Node.js 18+
- npm 9+

### Installation
1. Clone the repository and navigate to the project root:
   ```bash
   git clone <repository-url>
   cd PlantApplication
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Development Server
Run Vite in development mode with hot-module replacement:
```bash
npm run dev
```
Then open `http://localhost:4343` in your browser.

If you prefer the legacy syntax, `npm run-script dev` is equivalent.

## Available Scripts
| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server on port 4343. |
| `npm run build` | Create an optimized production build in the `dist/` directory. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint to analyze the codebase. |
| `npm run lint:fix` | Attempt to automatically fix lint issues. |

## Project Structure
```
PlantApplication/
├── api/                # API handlers such as plant debugging and care tips
├── public/             # Static assets served as-is, images and icons
├── src/
│   ├── App.vue         # Root Vue component
│   ├── store/          # Vuex store configuration and modules
│   ├── views/          # Route-level views (Home, SetupPlant, etc.)
│   ├── components/     # Reusable UI components
│   └── assets/         # Logo
├── vite.config.js      # Vite configuration for build & dev server
├── vercel.json         # Deployment configuration for Vercel
└── README.md
```

## Linting & Quality
- Run `npm run lint` regularly to catch issues early.
- Most problems can be fixed automatically with `npm run lint:fix`.
- Review lint output and commit fixes to maintain consistency.

## Deployment
- The repository includes a `vercel.json` file configured for deployment on Vercel.
- Ensure environment variables (if any) are configured in Vercel before deploying.
- Build locally with `npm run build` to verify production readiness.

## Contributing
1. Fork the repository and create a feature branch.
2. Keep changes scoped and write clear commit messages.
3. Run linting and relevant tests before submitting a pull request.
4. Describe the motivation and approach in the PR description for easier reviews.

## Additional Resources
- [Vue.js Documentation](https://vuejs.org/)
- [Vuex Documentation](https://vuex.vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Vercel Deployment Docs](https://vercel.com/docs)
