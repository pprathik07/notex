# Notex

Production-style Notion-like notes application with:

- Full CRUD notes
- Instant search
- List/Kanban view toggle
- Live markdown split editor
- Color-coded categories (muted enterprise palette)
- Smart pinning
- Dark mode switch
- Auth (register/login)
- Neon PostgreSQL + Drizzle ORM

## Setup

1. Create a Neon database and copy its Postgres URL.
2. Copy `.env.local.example` to `.env.local` and fill values.
3. Install and run migrations:

```bash
npm install
npm run db:push
```

4. Start the app:

```bash
npm run dev
```

Open `http://localhost:3012`.

## Routes

- `/register` - create account
- `/login` - sign in
- `/` - notes dashboard
- `/notes/[id]` - split markdown editor
