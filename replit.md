# Travel Client Management System

## Overview

This is a comprehensive travel client management web application built as a full-stack system for managing travel clients and their associated data. The application allows users to add, view, edit, and delete client information, including personal details, travel preferences, and children's information. It features a modern React frontend with a Express.js backend, designed specifically for travel agencies to manage their customer base without requiring user authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Extensive use of Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Management**: React Hook Form with Zod schema validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon serverless PostgreSQL
- **Development Environment**: Hot module replacement with Vite middleware integration
- **Build Process**: ESBuild for server-side bundling, Vite for client-side bundling

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless platform
- **ORM**: Drizzle ORM with TypeScript for schema definition and database operations
- **Schema Management**: Centralized schema definitions in `/shared/schema.ts`
- **Migration System**: Drizzle Kit for database migrations and schema changes
- **Data Encryption**: Client-side encryption for sensitive fields (CPF, RG, passport numbers) using CryptoJS

### Authentication and Authorization
- **Access Model**: Open access application without user authentication
- **Security**: Sensitive data encryption before storage
- **Session Management**: Connect-pg-simple for session storage (prepared for future auth implementation)

## External Dependencies

### Database and Storage
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database operations and schema management
- **connect-pg-simple**: PostgreSQL session store

### Frontend Libraries
- **Radix UI**: Comprehensive set of low-level UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management and validation
- **Zod**: TypeScript-first schema validation
- **date-fns**: Date manipulation and formatting
- **Wouter**: Minimalist routing library

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Integration**: Development environment optimizations

### Validation and Utilities
- **cpf-cnpj-validator**: Brazilian document validation
- **crypto-js**: Client-side encryption for sensitive data
- **class-variance-authority**: Type-safe CSS class variations
- **clsx**: Conditional className utility

### UI Components and Interactions
- **cmdk**: Command palette component
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel/slider components
- **Recharts**: Chart and data visualization library

## Recent Changes

### December 8, 2025
- **Bug Fix**: Fixed payment calculation bugs for "à vista" (full payment) method
  - "À vista" payments now correctly show full amount as paid with zero outstanding balance
  - Entry fields (entrada) now properly marked as "pago" for avista clients
  - `remainingInstallments` and `installmentAmount` set to 0 for avista payments
- **Bug Fix**: Fixed entrada receipt double-counting issue
  - Entrada receipts are now excluded from `receiptsPaid` calculation in balance endpoint
  - The entrada amount is already counted in `downPaymentTarget` (down_payment field)
  - Entrada receipts are preserved for documentation/PDF generation but don't affect totals
  - Prevents showing R$1000 paid when only R$500 entrada was recorded
- **Bug Fix**: Fixed `avista_payment_type` field not being saved during client edit
  - Added `avista_payment_type` to form.reset() call when editing clients

### November 21, 2025
- **Bug Fix**: Fixed data preloader authentication race condition
  - Modified `useDataPreloader` hook to wait for authentication to complete before prefetching any data
  - Added check for `loading` state to prevent prefetching during authentication initialization
  - Added explicit token verification before attempting protected prefetches (early exit if token retrieval fails)
  - Token is retrieved once and reused for protected endpoints to avoid redundant authentication calls
  - Protected endpoints (`/api/clients`) are now only prefetched when user is authenticated, auth state is fully resolved, and a valid token is available
  - Public endpoints (`/api/destinations`) are prefetched after auth loading completes, regardless of authentication status
  - Graceful degradation: if token retrieval fails, public endpoints still load successfully
  - This eliminates 401 authentication errors during app initialization and auth state transitions
- **Architecture**: Simplified data preloader to follow canonical data pattern
  - Removed dashboard stats prefetch from data preloader (derived data should be computed at component level)
  - Data preloader now only prefetches canonical server resources (clients, destinations)
  - Dashboard components calculate stats from cached clients data using TanStack Query's select or useMemo
  - This prevents duplicate fetches on query retries and keeps cache invalidation aligned with source queries
- **Maintenance**: Updated browserslist database to latest version (caniuse-lite)

## Known Issues and Expected Behavior

### Vite HMR WebSocket Warning (Expected - Not a Bug)
- **Symptom**: Browser console may show: `Failed to construct 'WebSocket': The URL 'wss://localhost:undefined/?token=...' is invalid`
- **Cause**: Vite's Hot Module Replacement (HMR) system attempting to establish a WebSocket connection in Replit's cloud environment
- **Impact**: Cosmetic only - does not affect application functionality. The app works perfectly fine despite this warning.
- **Reason**: This is expected behavior when running Vite in middleware mode on Replit. The server/vite.ts configuration file cannot be modified as it's a core system file.
- **Status**: This warning can be safely ignored. All application features work correctly.