# Employee Onboarding App - Frontend

A modern Next.js web application for managing employee onboarding processes with role-based dashboards for admins and group leaders.

## Features

- **Authentication**: Secure login with JWT tokens
- **Role-based Dashboards**: Different interfaces for admins and group leaders
- **Admin Features**:
  - User management (create admins and group leaders)
  - Group management with leader assignments
  - Question management with compliance tracking
  - Task management and reassignment
  - Employee processing via Excel import
  - Comprehensive reporting and audit logs
- **Group Leader Features**:
  - Task completion and progress tracking
  - Task reassignment capabilities
  - Employee management
- **Modern UI**: Built with Tailwind CSS and Radix UI components
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Theme**: Toggle between themes

## Tech Stack

- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with custom animations
- **UI Components**: Radix UI primitives
- **HTTP Client**: Axios for API communication
- **Forms**: React Hook Form for form management
- **Notifications**: React Hot Toast
- **TypeScript**: Full type safety
- **Icons**: Lucide React

## Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager
- Backend API running (see backend README)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create a `.env.local` file in the root directory:
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:2083/api
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js 13+ app directory
│   ├── admin/             # Admin dashboard pages
│   ├── auth/              # Authentication pages and context
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React contexts (theme, etc.)
│   ├── group-lead/        # Group leader dashboard pages
│   ├── lib/               # Utility functions and animations
│   ├── services/          # API service layer
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Helper functions
├── globals.css            # Global styles and Tailwind imports
├── layout.tsx             # Root layout component
└── page.tsx               # Home page with role-based routing
```

## Key Components

- **AuthContext**: Manages user authentication state
- **ThemeContext**: Handles dark/light theme switching
- **API Services**: Centralized HTTP client with interceptors
- **Role-based Routing**: Automatic redirection based on user roles
- **Responsive Navigation**: Adaptive sidebar and mobile menu

## API Integration

The frontend communicates with the Flask backend API through:
- Automatic JWT token management
- Request/response interceptors
- Error handling and token refresh
- Type-safe API calls

## Docker Support

Build and run with Docker:
```bash
docker build -t onboarding-frontend .
docker run -p 3000:3000 onboarding-frontend
```

## Development

- **Hot Reload**: Automatic page refresh during development
- **Type Checking**: Run `npm run type-check` for TypeScript validation
- **Linting**: Run `npm run lint` for code quality checks
- **Code Formatting**: Prettier integration for consistent formatting

## Default Login Credentials

After seeding the backend database, you can use these credentials:

**Admin User:**
- Email: admin@company.com
- Password: admin123

**Group Leader:**
- Email: john.doe@company.com  
- Password: password123
