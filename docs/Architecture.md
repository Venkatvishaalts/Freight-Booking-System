# System Architecture Documentation

## Overview
Detailed architecture documentation for the Digital Freight Booking System.

## Tech Stack
- **Frontend:** React.js 18+, Redux, Tailwind CSS, Ant Design
- **Backend:** Node.js 18+, Express.js, Sequelize ORM
- **Database:** PostgreSQL 13+
- **Real-time:** Socket.io
- **Authentication:** JWT + bcrypt

## System Components

### Frontend Architecture
- React.js SPA with Redux state management
- Ant Design for UI components
- Tailwind CSS for styling
- Axios for API calls
- Socket.io-client for real-time updates

### Backend Architecture
- Express.js REST API
- Sequelize for database ORM
- JWT for authentication
- Middleware for validation, auth, error handling
- Service layer for business logic

### Database Architecture
- PostgreSQL relational database
- Sequelize migrations for version control
- Proper indexing on frequently queried columns

## Data Flow
Check DATA_FLOW.md for diagrams.

## Deployment Architecture
- Frontend: Vercel
- Backend: Render
- Database: Supabase (PostgreSQL)

