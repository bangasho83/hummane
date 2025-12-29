# 🚀 Hummane - Modern HR Management System

A professional-grade HR management system built with Next.js 14+, TypeScript, and modern web technologies. Features secure authentication, employee management, department organization, and comprehensive data validation.

## ✨ Features

### 🔐 Security
- **Password Hashing**: Secure password storage using bcryptjs
- **Input Sanitization**: XSS protection and input validation
- **Enhanced Password Requirements**: Minimum 8 characters with uppercase, lowercase, and numbers
- **Error Boundaries**: Graceful error handling throughout the application

### 👥 Employee Management
- Full CRUD operations for employees
- Department assignment and tracking
- Salary management
- Start date tracking
- Email validation
- Real-time form validation with Zod

### 🏢 Company Management
- Company profile setup
- Industry and size tracking
- Multi-tenant architecture (one company per user)

### 📊 Department Management
- Create and manage departments
- Track team sizes
- Prevent deletion of departments with active employees
- Duplicate name prevention

### 🎨 Modern UI/UX
- Glass morphism design
- Responsive layout (mobile-first)
- Premium shadows and animations
- Toast notifications
- Loading states
- Form validation feedback

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Components**: Radix UI + shadcn/ui
- **State Management**: React Context API
- **Validation**: Zod
- **Security**: bcryptjs
- **Icons**: Lucide React
- **Data Storage**: Browser localStorage

## 📋 Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd antiman-nextjs
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### First Time Setup

1. **Sign Up**: Create a new account with:
   - Name
   - Email
   - Password (min 8 chars, must include uppercase, lowercase, and number)

2. **Company Setup**: After signup, set up your company:
   - Company name
   - Industry
   - Company size

3. **Create Departments**: Navigate to Departments and create your first department

4. **Add Employees**: Start adding employees to your organization

## 📁 Project Structure

```
antiman-nextjs/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── login/               # Login page
│   │   ├── signup/              # Signup page
│   │   ├── company-setup/       # Company setup page
│   │   └── dashboard/           # Protected dashboard routes
│   │       ├── employees/       # Employee management
│   │       ├── departments/     # Department management
│   │       ├── attendance/      # Attendance (placeholder)
│   │       ├── payroll/         # Payroll (placeholder)
│   │       └── settings/        # Settings
│   ├── components/              # React components
│   │   ├── dashboard/           # Dashboard components
│   │   ├── employee/            # Employee components
│   │   ├── error/               # Error boundary
│   │   ├── layout/              # Layout components
│   │   └── ui/                  # UI primitives (shadcn)
│   ├── lib/                     # Utilities and libraries
│   │   ├── context/             # React Context (AppContext)
│   │   ├── security/            # Security utilities (crypto)
│   │   ├── store/               # Data store (localStorage)
│   │   ├── validation/          # Zod schemas
│   │   └── utils.ts             # Helper functions
│   └── types/                   # TypeScript type definitions
├── public/                      # Static assets
└── package.json                 # Dependencies
```

## 🔒 Security Features

### Password Security
- Passwords are hashed using bcryptjs with 10 salt rounds
- Never stored in plain text
- Secure password verification on login

### Input Sanitization
- All user inputs are sanitized before storage
- XSS protection through input filtering
- Email normalization (lowercase, trimmed)
- String length limits to prevent DoS

### Validation
- Runtime validation using Zod schemas
- Type-safe data handling
- Client-side and data-layer validation
- Comprehensive error messages

## 🧪 Data Models

```typescript
User {
  id: string
  name: string
  email: string
  password: string (hashed)
  companyId?: string
  createdAt: string
}

Company {
  id: string
  name: string
  industry: string
  size: string
  ownerId: string
  createdAt: string
}

Employee {
  id: string
  companyId: string
  name: string
  email: string
  position: string
  department: string
  startDate: string
  salary: number
  createdAt: string
  updatedAt?: string
}

Department {
  id: string
  companyId: string
  name: string
  description?: string
  createdAt: string
}

LeaveRecord {
  id: string
  companyId: string
  employeeId: string
  date: string
  type: 'Sick' | 'Vacation' | 'Personal' | 'Other'
  createdAt: string
}
```

## ⚠️ Important Notes

### Data Storage
- All data is stored in browser localStorage
- Data is not synced across devices
- Clearing browser data will delete all information
- **Not suitable for production without a backend**

### Security Limitations
- Client-side only application
- No server-side validation
- No rate limiting
- No session management
- **Intended for demo/learning purposes**

### Recommended Next Steps for Production
1. Add a backend API (Node.js, Python, etc.)
2. Use a real database (PostgreSQL, MongoDB, etc.)
3. Implement proper authentication (JWT, OAuth)
4. Add server-side validation
5. Implement rate limiting
6. Add logging and monitoring
7. Set up CI/CD pipeline
8. Add comprehensive testing
9. Implement data encryption at rest
10. Add audit logging

## 🧪 Testing

Testing infrastructure setup is in progress. To add tests:

```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Run tests (when available)
npm test
```

## 📝 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is for educational and demonstration purposes.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Radix UI](https://www.radix-ui.com/) - UI primitives
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Zod](https://zod.dev/) - Schema validation
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) - Password hashing

## 📧 Support

For questions or issues, please open an issue on GitHub.

---

**Built with ❤️ using Next.js and TypeScript**
