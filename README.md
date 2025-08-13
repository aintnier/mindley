# Mindley App

A full-stack application built with React/TypeScript frontend and Supabase backend.

## Project Structure

```
├── frontend/          # React/TypeScript frontend (deployed via Vercel)
├── supabase/          # Supabase backend and Edge Functions
│   └── functions/     # Deno-based Edge Functions
└── .github/workflows/ # CI/CD pipelines
```

## CI/CD Pipeline

### Continuous Integration

The CI pipeline runs on every push and pull request to `main` and `develop` branches. It includes:

#### Frontend CI

- **Dependencies**: Installs npm packages with caching
- **Type Checking**: Validates TypeScript types with `tsc --noEmit`
- **Linting**: Runs ESLint to check code quality
- **Build**: Verifies the project builds successfully

#### Supabase Functions CI

- **Syntax Check**: Validates Deno/TypeScript syntax for all Edge Functions
- **Format Check**: Ensures consistent code formatting with `deno fmt`

#### Security Scanning

- **Dependency Audit**: Scans for known vulnerabilities in npm packages
- **SARIF Upload**: Reports security findings to GitHub Security tab

### Deployment

- **Frontend**: Automatically deployed by Vercel on push to `main`
- **Supabase Functions**: Deployed manually via Supabase CLI

## Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Supabase Functions

```bash
# Requires Supabase CLI
supabase functions serve
```

## Available Scripts

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Supabase

- `deno check index.ts` - Type check functions
- `deno fmt index.ts` - Format code

## Environment Variables

Create `.env.local` in the frontend directory:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
