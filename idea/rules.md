# Project Rules

## Naming Conventions

- Files: `kebab-case.ts` (e.g., `auth-controller.ts`, `user-schema.ts`)
- Components: `PascalCase.tsx` (e.g., `LoginForm.tsx`, `FileCard.tsx`)
- Hooks: `use-kebab-case.ts` (e.g., `use-auth.ts`, `use-files.ts`)
- Types/Interfaces: `PascalCase` (e.g., `User`, `AuthResponse`)
- Variables/Functions: `camelCase`

---

# Frontend Rules

- Use shadcn/ui components, no custom UI unless necessary.
- No gradients. Stick to shadcn color variables.
- Sonner for toasts with loading states.
- react-query for all API calls.
- Button has `isLoading` and `loadingText` props - use them.
- Skeletons must match content layout precisely. Only skeleton API-dependent content, not static UI.

## Directory Structure

```
apps/web/src/
├── app/              # Next.js app router pages
├── components/
│   ├── ui/           # shadcn components
│   └── loaders/      # skeleton components
├── config/
│   ├── api-endpoints.ts
│   ├── axios-config.ts
│   └── app-config.ts
├── hooks/            # react-query hooks (use-auth.ts, use-files.ts)
├── services/         # API call functions (auth-service.ts)
├── types/            # ALL types go here, nowhere else
├── schema/           # Zod validation schemas
└── lib/              # Utilities (cn, formatters)
```

## Integration Flow

1. Add endpoint to `config/api-endpoints.ts`
2. Create service in `services/{feature}-service.ts`
3. Create hook in `hooks/use-{feature}.ts`
4. Use hook in component

---

# Backend Rules

## Directory Structure

```
apps/api/src/
├── features/
│   └── {feature}/
│       ├── {feature}-controller.ts
│       ├── {feature}-route.ts
│       └── {feature}-services.ts
├── schema/           # Zod schemas ({feature}-schema.ts)
├── middleware/       # Auth, validation, error handlers
├── utils/
│   ├── response-utils.ts
│   ├── pagination-utils.ts
│   ├── auth-utils.ts
│   └── request-validator.ts
├── config/
│   ├── env.ts
│   └── app.config.ts
└── routes/
    └── api.ts        # Central route exports
```

## API Response Format

All responses use `response-utils.ts`:
```ts
// Success
{ success: true, data: {...}, message?: "..." }

// Error
{ success: false, error: { code: "...", message: "..." } }

// Paginated
{ success: true, data: [...], pagination: { page, limit, total, totalPages } }
```

## Feature Rules

- Each feature is self-contained in `features/{name}/`
- Controller: handles request/response
- Service: business logic, DB operations
- Route: defines endpoints, applies middleware
- Validate all inputs with Zod via `request-validator.ts`

---

# Authentication

- Custom JWT-based auth (no NextAuth)
- Access token: short-lived (15m)
- Refresh token: long-lived (7d), stored in httpOnly cookie
- Password hashing: bcrypt
- Token utilities in `utils/auth-utils.ts`

---

# Database

- Drizzle ORM with PostgreSQL
- Schema in `packages/database/src/schema/`
- Migrations via `pnpm db:generate` and `pnpm db:push`
- Use transactions for multi-table operations

---

# General

- No console.log in production code, use proper logger if needed.
- Handle errors at controller level, let services throw.
- Environment variables validated with Zod in `config/env.ts`.
