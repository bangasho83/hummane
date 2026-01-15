# Hummane API Walkthrough

Base URL
- https://hummane-api.vercel.app

Authentication (Firebase Token -> API Token)

1) Get Firebase ID token in the client (Firebase Auth SDK).
2) Exchange it for a Hummane API access token.

```bash
API_URL="https://hummane-api.vercel.app"
FIREBASE_TOKEN="your_firebase_id_token_here"

curl -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{ "firebaseToken": "'"$FIREBASE_TOKEN"'" }'
```

Response (example)
```json
{
  "access_token": "...",
  "user": {
    "id": "...",
    "email": "...",
    "name": "...",
    "createdAt": "...",
    "companyId": "..."
  },
  "company": {
    "id": "...",
    "name": "...",
    "industry": "...",
    "size": "1-10",
    "ownerId": "...",
    "createdAt": "..."
  }
}
```

Set the access token for subsequent calls:

```bash
TOKEN="your_hummane_jwt_access_token_here"
```

Companies

Create a company (tenant)
```bash
curl -X POST "$API_URL/companies" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "industry": "Technology",
    "size": "50-100",
    "ownerId": "user_123"
  }'
```

Update company settings
```bash
curl -X PUT "$API_URL/companies/YOUR_COMPANY_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "industry": "Fintech", "currency": "USD", "timezone": "America/Los_Angeles", "workingHours": { "monday": { "open": true, "start": "09:00 AM", "end": "05:00 PM" }, "tuesday": { "open": true, "start": "09:00 AM", "end": "05:00 PM" }, "wednesday": { "open": true, "start": "09:00 AM", "end": "05:00 PM" }, "thursday": { "open": true, "start": "09:00 AM", "end": "05:00 PM" }, "friday": { "open": true, "start": "09:00 AM", "end": "05:00 PM" }, "saturday": { "open": false, "start": "09:00 AM", "end": "05:00 PM" }, "sunday": { "open": false, "start": "09:00 AM", "end": "05:00 PM" } } }'
```

Get company by id
```bash
curl -X GET "$API_URL/companies/YOUR_COMPANY_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Departments

Create a department
```bash
curl -X POST "$API_URL/departments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "companyId": "COMPANY_ID", "name": "Engineering", "desc": "Core product team" }'
```
 
Note: Use `desc` (not `description`) for the department description field.

List departments (by company)
```bash
curl -X GET "$API_URL/departments?companyId=COMPANY_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Delete a department
```bash
curl -X DELETE "$API_URL/departments/DEPARTMENT_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Update a department
```bash
curl -X PUT "$API_URL/departments/YOUR_DEPARTMENT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ \"desc\": \"Platform and infrastructure\", \"companyId\": \"YOUR_COMPANY_ID\" }'
```

Roles

Create a role
```bash
curl -X POST "$API_URL/roles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Engineering Manager", "description": "Leads a team", "companyId": "YOUR_COMPANY_ID" }'
```

List roles
```bash
curl -X GET "$API_URL/roles" \
  -H "Authorization: Bearer $TOKEN"
```

Get role by id
```bash
curl -X GET "$API_URL/roles/YOUR_ROLE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Update a role
```bash
curl -X PUT "$API_URL/roles/YOUR_ROLE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "description": "Leads multiple teams", "companyId": "YOUR_COMPANY_ID" }'
```

Delete a role
```bash
curl -X DELETE "$API_URL/roles/YOUR_ROLE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Leave Types

Create a leave type
```bash
curl -X POST "$API_URL/leave-types" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Annual Leave", "unit": "Day", "quota": 15, "companyId": "YOUR_COMPANY_ID" }'
```

List leave types
```bash
curl -X GET "$API_URL/leave-types" \
  -H "Authorization: Bearer $TOKEN"
```

Get leave type by id
```bash
curl -X GET "$API_URL/leave-types/YOUR_LEAVE_TYPE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Update a leave type
```bash
curl -X PUT "$API_URL/leave-types/YOUR_LEAVE_TYPE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "quota": 20, "companyId": "YOUR_COMPANY_ID" }'
```

Delete a leave type
```bash
curl -X DELETE "$API_URL/leave-types/YOUR_LEAVE_TYPE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Leave Records

Create a leave record
```bash
curl -X POST "$API_URL/leaves" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "employeeId": "EMP-001", "date": "2024-01-10", "type": "Annual Leave", "unit": "Day", "amount": 1, "companyId": "YOUR_COMPANY_ID" }'
```

List leave records
```bash
curl -X GET "$API_URL/leaves" \
  -H "Authorization: Bearer $TOKEN"
```

Holidays

Create a holiday
```bash
curl -X POST "$API_URL/holidays" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "date": "2024-12-25", "name": "Christmas Day", "companyId": "YOUR_COMPANY_ID" }'
```

List holidays
```bash
curl -X GET "$API_URL/holidays" \
  -H "Authorization: Bearer $TOKEN"
```

Delete a holiday
```bash
curl -X DELETE "$API_URL/holidays/YOUR_HOLIDAY_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Feedback Cards

Create a feedback card
```bash
curl -X POST "$API_URL/feedback-cards" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Quarterly Review", "subject": "Team Member", "questions": [{ "prompt": "How did it go?", "type": "text" }], "companyId": "YOUR_COMPANY_ID" }'
```

List feedback cards
```bash
curl -X GET "$API_URL/feedback-cards" \
  -H "Authorization: Bearer $TOKEN"
```

Get feedback card by id
```bash
curl -X GET "$API_URL/feedback-cards/YOUR_CARD_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Update a feedback card
```bash
curl -X PUT "$API_URL/feedback-cards/YOUR_CARD_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Updated Review Title", "companyId": "YOUR_COMPANY_ID" }'
```

Delete a feedback card
```bash
curl -X DELETE "$API_URL/feedback-cards/YOUR_CARD_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Feedback Entries

Create a feedback entry
```bash
curl -X POST "$API_URL/feedback-entries" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "cardId": "YOUR_CARD_ID", "subjectId": "YOUR_SUBJECT_ID", "subjectName": "Jane Doe", "answers": [{ "questionId": "q1", "answer": "Great" }], "companyId": "YOUR_COMPANY_ID" }'
```

List feedback entries
```bash
curl -X GET "$API_URL/feedback-entries" \
  -H "Authorization: Bearer $TOKEN"
```

Get feedback entry by id
```bash
curl -X GET "$API_URL/feedback-entries/YOUR_ENTRY_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Update a feedback entry
```bash
curl -X PUT "$API_URL/feedback-entries/YOUR_ENTRY_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "answers": [{ "questionId": "q1", "answer": "Updated answer" }], "companyId": "YOUR_COMPANY_ID" }'
```

Delete a feedback entry
```bash
curl -X DELETE "$API_URL/feedback-entries/YOUR_ENTRY_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Jobs

Create a job
```bash
curl -X POST "$API_URL/jobs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Backend Engineer", "departmentId": "YOUR_DEPARTMENT_ID", "status": "open", "employmentType": "Full-time", "employmentMode": "Remote", "salaryFrom": 60000, "salaryTo": 85000, "companyId": "YOUR_COMPANY_ID" }'
```

List jobs
```bash
curl -X GET "$API_URL/jobs" \
  -H "Authorization: Bearer $TOKEN"
```

Get job by id
```bash
curl -X GET "$API_URL/jobs/YOUR_JOB_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Update a job
```bash
curl -X PUT "$API_URL/jobs/YOUR_JOB_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "closed", "departmentId": "YOUR_DEPARTMENT_ID", "employmentMode": "Hybrid", "salaryTo": 90000, "companyId": "YOUR_COMPANY_ID" }'
```

Delete a job
```bash
curl -X DELETE "$API_URL/jobs/YOUR_JOB_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Employees

Create an employee
```bash
curl -X POST "$API_URL/employees" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "employeeId": "EMP-001", "companyId": "YOUR_COMPANY_ID", "userId": "YOUR_USER_ID", "departmentId": "YOUR_DEPARTMENT_ID", "reportingManagerId": "YOUR_MANAGER_EMPLOYEE_ID", "name": "Jane Doe", "email": "jane@example.com", "startDate": "2024-01-01", "employmentType": "Full-time", "employmentMode": "Onsite", "gender": "Female" }'
```

List employees
```bash
curl -X GET "$API_URL/employees" \
  -H "Authorization: Bearer $TOKEN"
```

Get employee by id
```bash
curl -X GET "$API_URL/employees/YOUR_EMPLOYEE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Update an employee
```bash
curl -X PUT "$API_URL/employees/YOUR_EMPLOYEE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "companyId": "YOUR_COMPANY_ID", "userId": "YOUR_USER_ID", "departmentId": "YOUR_DEPARTMENT_ID", "employmentType": "Full-time", "employmentMode": "Hybrid" }'
```

Delete an employee
```bash
curl -X DELETE "$API_URL/employees/YOUR_EMPLOYEE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Applicants

Create an applicant
```bash
curl -X POST "$API_URL/applicants" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "fullName": "Sam Applicant", "email": "sam@example.com", "status": "new", "appliedDate": "2024-01-02", "companyId": "YOUR_COMPANY_ID", "documents": { "files": ["https://example.com/sam-resume.pdf"] } }'
```

List applicants
```bash
curl -X GET "$API_URL/applicants" \
  -H "Authorization: Bearer $TOKEN"
```

Get applicant by id
```bash
curl -X GET "$API_URL/applicants/YOUR_APPLICANT_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Update an applicant
```bash
curl -X PUT "$API_URL/applicants/YOUR_APPLICANT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "interview", "companyId": "YOUR_COMPANY_ID" }'
```

Delete an applicant
```bash
curl -X DELETE "$API_URL/applicants/YOUR_APPLICANT_ID" \
  -H "Authorization: Bearer $TOKEN"
```
