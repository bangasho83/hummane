# Task Management Context

## User Experience

The member task workspace is available at `/member/tasks`.

- The default view is **All Tasks**.
- **My Tasks** remains available as a scope toggle.
- List, Board, and Gantt views are available.
- Search and status/project filters are available in the filter dialog.
- The **Projects** control beside **Add task** lists the current employee's active project memberships.
- Projects can be created, edited, archived, and managed from the Projects dialog.
- New tasks use the same API-loaded project list as the project filter.
- Tasks can be assigned to any company employee; assignment automatically adds that employee to the project.
- Task detail pages support status, priority, assignee, subtasks, comments, and due dates.

## Project Membership

Project membership is stored in the API database table `task_project_members`.

- Existing employees are added to existing projects by the membership migration.
- A new project's creator becomes a member automatically.
- Members can add or remove other company employees.
- A member cannot remove themselves.
- Archived projects are excluded from the active project list.

## API and Data

The frontend uses the authenticated API client in `src/lib/api/client.ts`:

- `GET /task-projects`
- `POST /task-projects`
- `PATCH /task-projects/:id`
- `DELETE /task-projects/:id`
- `GET/POST/DELETE /task-projects/:id/members...`
- `GET /tasks`
- `POST /tasks`
- `GET/PATCH /tasks/:id`
- `POST /tasks/:id/comments`

Tasks store `labels` and `comments` as JSONB arrays. Subtasks are regular task rows connected by `parent_task_id`. Comments store both `authorId` and `authorName`; older comments are hydrated with employee names by the API when returned.

## Important Implementation Rules

- Do not restore local-storage persistence for tasks; the API/database is authoritative.
- Keep company and project membership checks in the API, not only in the UI.
- Use ISO-safe date parsing. API timestamps may be full ISO timestamps while PostgreSQL date fields may be `YYYY-MM-DD`.
- Do not hardcode the current date for overdue, due-soon, or Gantt calculations.
- Pushing `main` triggers the Vercel deployment; no manual Vercel deployment is needed.
