# Hummane System Flow (High-Level)

```mermaid
flowchart TD
    A[Signup / Login] --> B[Create Company / Organization Setup]
    B --> C[Configure Organization]
    C --> C1[Departments]
    C --> C2[Roles]
    C --> C3[General Settings]
    B --> D[Create Jobs]
    D --> E[Applicants]
    E --> E1[Applicant Progress]
    B --> F[Add Team Members (Employees)]
    F --> G[Attendance & Leaves]
    G --> G1[Apply Leaves]
    B --> H[Feedback Cards]
    H --> I[Submit Feedback]
    B --> J[Collaborative Tasks]
    J --> J1[Projects]
    J1 --> J2[Project Membership]
    J2 --> J3[Tasks and Subtasks]
    J3 --> J4[Comments and Assignment]
```

Notes
- Organization setup unlocks downstream modules (jobs, employees, feedback, leaves).
- Applicants flow depends on Jobs.
- Feedback flow depends on Feedback Cards and team/applicant context.
- Task flow depends on authenticated project membership; tasks may contain subtasks and JSONB comments/labels.
