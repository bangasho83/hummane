# Hummane - Modern HR Management System

A comprehensive, secure HR management system built with Next.js 16, React 19, TypeScript, and Tailwind CSS.

## ✨ Features

- 👥 **Employee Management** - Complete CRUD operations for employee records
- 📊 **Dashboard Analytics** - Real-time insights and statistics
- 🏢 **Department Management** - Organize teams and departments
- 💰 **Payroll Processing** - Streamlined payroll management
- ⏰ **Attendance Tracking** - Monitor employee attendance
- ✅ **Collaborative Tasks** - Shared tasks, subtasks, projects, comments, and assignment
- 🗂️ **Project Membership** - Create, edit, archive, and manage project members
- 🔐 **Secure Authentication** - Password hashing with bcryptjs
- 🛡️ **Input Validation** - Zod schema validation for all forms
- 🚨 **Error Boundaries** - Graceful error handling
- 📱 **Responsive Design** - Mobile-first approach
- ♿ **Accessibility** - WCAG compliant components

## 🚀 Tech Stack

- **Framework:** Next.js 16.1.1 (App Router with Turbopack)
- **UI Library:** React 19.2.3
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **UI Components:** Radix UI
- **Icons:** Lucide React
- **Validation:** Zod
- **Security:** bcryptjs for password hashing
- **Deployment:** Vercel

## 📁 Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/         # Protected dashboard routes
│   │   │   ├── employees/
│   │   │   ├── departments/
│   │   │   ├── payroll/
│   │   │   ├── attendance/
│   │   │   ├── settings/
│   │   │   └── support/
│   │   ├── login/
│   │   ├── signup/
│   │   ├── company-setup/
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   │
│   ├── components/            # React components
│   │   ├── dashboard/         # Dashboard-specific components
│   │   ├── employee/          # Employee management components
│   │   ├── error/             # Error boundary components
│   │   ├── layout/            # Layout components (Sidebar, Shell)
│   │   ├── providers/         # Context providers wrapper
│   │   └── ui/                # Reusable UI components (shadcn/ui)
│   │
│   ├── lib/                   # Utilities and helpers
│   │   ├── context/           # React Context providers
│   │   ├── security/          # Security utilities (hashing, sanitization)
│   │   ├── store/             # Data store and state management
│   │   ├── validation/        # Zod schemas for validation
│   │   └── utils.ts           # Utility functions
│   │
│   ├── types/                 # TypeScript type definitions
│   ├── config/                # Configuration files
│   ├── hooks/                 # Custom React hooks
│   └── features/              # Feature-based modules
│
├── public/                    # Static assets
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Project dependencies
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/bangasho83/hummane.git
cd hummane
```

2. **Install dependencies:**
```bash
npm install
```

3. **Run the development server:**
```bash
npm run dev
```

4. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## ✅ Task Workspace

The member task workspace is available at `/member/tasks` and is backed by the Hummane API rather than local storage.

- All Tasks is the default view; My Tasks is available as a filter.
- Projects are limited to the authenticated employee's active project memberships.
- Tasks support list, board, and Gantt views, search, status/project filters, assignments, subtasks, comments, and due dates.
- The Projects dialog supports project creation, editing, archiving, and member management.
- Project database migrations and API details are documented in `documentation/task-management.md`.

## 🔒 Security Features

- **Password Hashing:** All passwords are hashed using bcryptjs with salt rounds
- **Input Sanitization:** XSS protection through input sanitization
- **Form Validation:** Zod schemas validate all user inputs
- **Error Boundaries:** Graceful error handling prevents app crashes
- **Type Safety:** Full TypeScript coverage for compile-time safety

## 🎨 UI Components

Built with [shadcn/ui](https://ui.shadcn.com/) and [Radix UI](https://www.radix-ui.com/):
- Accessible by default
- Customizable with Tailwind CSS
- Fully typed with TypeScript
- Dark mode ready

## 📝 Code Quality

- **TypeScript:** Strict mode enabled
- **ESLint:** Code linting with Next.js config
- **Component Structure:** Modular and reusable components
- **Best Practices:** Following Next.js and React best practices

## 🚢 Deployment

Deployed on [Vercel](https://vercel.com):
- Automatic deployments from main branch
- Preview deployments for pull requests
- Edge network for optimal performance

**Live URL:** [https://hummane.vercel.app](https://hummane.vercel.app)

## 📄 License

MIT

## 👨‍💻 Author

Built with ❤️ by the Hummane team
