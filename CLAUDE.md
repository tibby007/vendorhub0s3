# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Development Server:**
- `npm run dev` - Start development server on localhost:5173
- `npm run dev:host` - Start with host access (0.0.0.0)
- `npm run dev:port` - Start on port 3000

**Build & Testing:**
- `npm run build` - TypeScript compile and Vite build for production
- `npm run type-check` - Run TypeScript compiler without emit
- `npm run lint` - Run ESLint for code quality
- `npm run preview` - Preview production build locally

## Architecture Overview

**Tech Stack:**
- Frontend: React 18 + TypeScript + Vite
- Backend: Supabase (PostgreSQL, Auth, Realtime, Storage)
- UI: Tailwind CSS + custom components
- State: React Query + Context API
- Forms: React Hook Form
- Deployment: Netlify (frontend) + Netlify Functions (serverless)

**Multi-tenant SaaS Platform:**
VendorHub OS is an equipment finance broker platform with three subscription tiers (solo/pro/enterprise). It connects brokers with vendors and manages equipment financing deals through a kanban-style workflow.

**Key Architectural Patterns:**

1. **Role-based Access:** Three user roles (broker, loan_officer, vendor) with different capabilities
2. **Organization Isolation:** Data segregated by organization_id with RLS policies
3. **Deal Workflow:** Seven-stage deal progression (submitted → credit_pulled → submitted_for_approval → approved → term_sheet_issued → funded/declined)
4. **Authentication:** Supabase authentication with proper user management and role-based access

**Core Domain Models:**
- Organizations (with subscription tiers and branding)
- Users (with roles and organization membership)  
- Deals (equipment financing applications with workflow states)
- Messages (deal-specific communication threads)
- Documents (file attachments to deals)
- Resources (broker guidelines and documentation)

## Environment Setup

**Required Environment Variables:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLIC_KEY=pk_test_your-stripe-key
VITE_APP_URL=http://localhost:5173 (dev) or production URL
```

Create `.env` file in root directory for local development.

## Database & Migrations

**Database Schema:**
Located in `supabase/migrations/` directory. Apply migrations through Supabase SQL Editor.

**Key Tables:**
- `organizations` - Multi-tenant isolation and subscription management
- `users` - User profiles with role-based permissions
- `deals` - Equipment financing applications and workflow
- `messages` - Deal communication threads
- `documents` - File storage references
- `resources` - Broker knowledge base content

## Code Organization

**Frontend Structure:**
- `src/components/` - Reusable UI components organized by domain (auth/, deals/, vendors/, ui/)
- `src/pages/` - Route components for main application views  
- `src/contexts/` - React contexts (AuthContext for user session management)
- `src/types/` - TypeScript definitions with comprehensive domain models
- `src/lib/` - Utilities (supabase client, utilities)

**Authentication Flow:**
The AuthContext (`src/contexts/AuthContext.tsx`) manages user sessions with mock profiles for testing. It supports both test credentials and real Supabase authentication.

**State Management:**
- React Query for server state and caching
- Context API for global application state (auth)
- Local component state for UI interactions

## Deployment Notes

**Netlify Functions:**
Located in `netlify/functions/` for serverless API endpoints (registration, Stripe integration, invitations).

**Security:**
- Row-level security (RLS) policies on all Supabase tables
- Environment variables for sensitive configuration
- Organization-based data isolation
- Role-based access control

## Authentication

The application uses Supabase authentication for secure user login and session management. Users must register through the proper registration flow to access the system.