# Study Planner Application

## Overview

This is a comprehensive study planner application built as a full-stack web application. It allows users to organize their study materials by subjects, create and manage tasks with priorities and due dates, and track their progress through an intuitive dashboard interface. The application features a modern React frontend with a Node.js/Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Modern React application using functional components and hooks
- **UI Framework**: Shadcn/ui components built on top of Radix UI primitives for accessibility and customization
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Node.js with Express**: RESTful API server with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful endpoints for CRUD operations on subjects, tasks, and user preferences
- **Middleware**: Express middleware for JSON parsing, URL encoding, and request logging
- **Error Handling**: Centralized error handling with proper HTTP status codes

### Database Schema
- **Subjects Table**: Stores study subjects with name, color coding, and creation timestamps
- **Tasks Table**: Manages study tasks with title, description, subject association, priority levels (1-3), status tracking, due dates, and Google Calendar integration support
- **User Preferences Table**: Handles user settings including Google Calendar connection, notification preferences, and study streak tracking

### Development and Deployment
- **Monorepo Structure**: Shared schema and types between frontend and backend
- **Development Setup**: Hot module replacement for frontend, auto-restart for backend changes
- **Type Safety**: Comprehensive TypeScript coverage across the entire stack
- **Validation**: Zod schemas for runtime type validation and API request/response validation

### Component Architecture
- **Modular Components**: Reusable UI components with proper separation of concerns
- **Custom Hooks**: Dedicated hooks for API operations (useTasks, useSubjects)
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Responsive Design**: Mobile-first approach with adaptive layouts

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL database for production
- **Connection**: Uses `@neondatabase/serverless` for database connectivity

### UI and Styling
- **Radix UI**: Headless UI component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography
- **Google Fonts**: Custom font integration (Inter, Poppins, and others)

### Development Tools
- **Drizzle Kit**: Database migration and schema management
- **ESBuild**: Fast JavaScript bundler for server-side code
- **TSX**: TypeScript execution for development
- **Replit Integration**: Specialized Replit plugins for development environment

### Potential Integrations
- **Google Calendar API**: Infrastructure prepared for calendar synchronization
- **Date Utilities**: date-fns library for date manipulation and formatting
- **Session Management**: connect-pg-simple for session storage (if authentication is added)