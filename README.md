# VendorHub OS

A comprehensive SaaS platform for equipment finance brokers and vendors to streamline equipment financing applications and deal management.

## Features

- **Multi-tenant Architecture**: Separate portals for brokers and vendors
- **Deal Management**: Kanban-style deal tracking with real-time updates
- **Pre-qualification Tool**: Instant customer assessment for vendors
- **Document Management**: Secure file upload and storage
- **Real-time Messaging**: Built-in communication system
- **White-label Customization**: Broker branding options
- **Subscription Tiers**: Solo, Pro, and Enterprise plans

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Real-time, Storage)
- **Styling**: Tailwind CSS
- **State Management**: React Query + Context
- **Forms**: React Hook Form
- **Icons**: Heroicons
- **Deployment**: Vercel (frontend) + Supabase Cloud (backend)

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd vendorhub-os
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and update with your values:

```bash
cp .env.example .env.local
```

Required environment variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_RESEND_API_KEY`: Your Resend API key for emails
- `VITE_STRIPE_PUBLIC_KEY`: Stripe publishable key for billing

### 3. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your URL and keys
3. In the SQL Editor, run the migration file:
   ```sql
   -- Copy and paste the contents of supabase/migrations/001_initial_schema.sql
   ```
4. Configure Authentication:
   - Go to Authentication > Settings
   - Enable email confirmation if desired
   - Add your site URL (http://localhost:5173 for development)

### 4. Database Setup

Run the initial schema migration in your Supabase SQL editor:

```sql
-- Execute the SQL in supabase/migrations/001_initial_schema.sql
```

### 5. Development

```bash
npm run dev
```

The app will be available at http://localhost:5173

## Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components
│   └── ui/            # Reusable UI components
├── contexts/          # React contexts (Auth, etc.)
├── hooks/             # Custom React hooks
├── lib/               # Utilities and configurations
├── pages/             # Page components
├── services/          # API services
└── types/             # TypeScript definitions
```

## Key Components

### Authentication
- Role-based access (broker, loan_officer, vendor)
- Supabase Auth with RLS policies
- Protected routes with role checking

### Pre-qualification Tool
- Point-based scoring system
- Green/Yellow/Red light results
- Instant feedback for vendors

### Deal Management
- Kanban board interface
- Real-time status updates
- Document attachments
- Communication threads

### Multi-tenancy
- Organization-based data isolation
- Row-level security policies
- Subscription tier enforcement

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

## Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy

### Backend (Supabase)
- Already hosted when you create the project
- Run migrations in SQL Editor
- Configure RLS policies
- Set up storage buckets for documents

## Security Features

- Row-level security (RLS) for all tables
- JWT-based authentication
- Encrypted sensitive fields (SSN, financial data)
- File upload validation and virus scanning
- Comprehensive audit logging

## Subscription Tiers

| Feature | Solo ($49.99) | Pro ($97.99) | Enterprise ($397) |
|---------|---------------|--------------|-------------------|
| Max Vendors | 3 | 7 | Unlimited |
| Max Loan Officers | 1 | 3 | 10 |
| Storage | 5GB | 25GB | Unlimited |
| API Access | No | Yes | Yes |
| SSO | No | No | Yes |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For support and questions:
- Check the documentation in `/docs`
- Create an issue on GitHub
- Email support (to be configured)

## License

Private - All rights reserved