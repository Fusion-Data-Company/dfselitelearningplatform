# DFS-215 Elite Learning Platform

## Overview

The DFS-215 Elite Learning Platform is a sophisticated insurance education system designed for Florida DFS-215 certification. The platform combines a React-based frontend with an Express.js backend, featuring AI-powered learning assistants, adaptive flashcard systems, comprehensive exam preparation, and continuing education compliance tracking. Built with TypeScript throughout, it uses modern web technologies to deliver an immersive learning experience with glassmorphic UI design and elite branding.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **UI System**: shadcn/ui components built on Radix UI primitives with Tailwind CSS
- **Design Language**: Glassmorphic design with ambient glow effects, using Cinzel font for headings and Inter for UI text
- **State Management**: TanStack Query for server state management with custom query client
- **Authentication**: Session-based authentication integrated with Replit Auth

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with JSON responses
- **Session Management**: Express sessions with PostgreSQL store using connect-pg-simple
- **File Structure**: Organized into services (agents, content, exam, iflash, mcp) for separation of concerns

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon Database serverless connection
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Schema Organization**: Comprehensive schema covering users, courses, questions, flashcards, agent profiles, and CE records
- **Session Storage**: PostgreSQL-backed session store for authentication persistence

### AI and Learning Systems
- **AI Integration**: OpenAI GPT-5 for three specialized learning agents (CoachBot, StudyBuddy, ProctorBot)
- **MCP Protocol**: Custom Model Context Protocol server for agent tool access
- **Flashcard System**: Spaced Repetition System (SRS) using SM-2 algorithm with difficulty tracking
- **Content Processing**: DOCX document parsing and chunking for knowledge base creation

### Authentication and Authorization
- **Authentication Provider**: Replit Auth with OpenID Connect
- **Session Management**: Server-side sessions with PostgreSQL persistence
- **Authorization**: Route-level protection with role-based access (student/admin)
- **Security**: CSRF protection via session secrets and HTTP-only cookies

### Exam and Assessment Engine
- **Question Banking**: Hierarchical organization by topics with difficulty weighting
- **Exam Generation**: Blueprint-based question selection with randomization
- **Proctoring**: Timer management with session persistence and integrity monitoring
- **Analytics**: Performance tracking with item analysis and remediation mapping

### Content Management
- **Course Structure**: Hierarchical tracks, modules, and lessons with learning objectives
- **Progress Tracking**: Granular completion tracking with CE hour accumulation
- **Content Chunking**: Semantic text chunking for AI retrieval and citation
- **Default Content**: Automated seeding of DFS-215 curriculum structure

## External Dependencies

### AI and Language Models
- **OpenAI API**: GPT-5 model for agent responses and content generation
- **Model Configuration**: Temperature and token limits configured per agent type
- **Fallback Strategy**: Model degradation path for resilience

### Database and Storage
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Database Migrations**: Drizzle Kit for schema management and migrations
- **Vector Storage**: pgvector extension capability for semantic search

### Authentication Services
- **Replit Auth**: OAuth 2.0/OpenID Connect provider for user authentication
- **Session Store**: PostgreSQL-backed session persistence

### Development and Build Tools
- **Vite**: Frontend build tool with React plugin and hot module replacement
- **TypeScript**: Strict type checking across frontend and backend
- **ESBuild**: Backend bundling for production deployment
- **Tailwind CSS**: Utility-first styling with custom design tokens

### UI and Component Libraries
- **Radix UI**: Accessible component primitives for complex interactions
- **Lucide React**: Icon system for consistent visual language
- **Framer Motion**: Animation library for enhanced user experience (configured but not actively used)

### Development Environment
- **Replit Integration**: Development environment optimization with runtime error handling
- **Development Server**: Hot reload and middleware integration for seamless development
- **Environment Variables**: Secure configuration management for API keys and database connections