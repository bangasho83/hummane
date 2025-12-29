// ===== Data Storage Layer =====
class DataStore {
    constructor() {
        this.STORAGE_KEY = 'hrSystemData';
        this.initializeStorage();
    }

    initializeStorage() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            const initialData = {
                users: [],
                companies: [],
                employees: [],
                currentUser: null
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialData));
        }
    }

    getData() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEY));
    }

    saveData(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    // User operations
    createUser(userData) {
        const data = this.getData();
        const user = {
            id: this.generateId(),
            ...userData,
            createdAt: new Date().toISOString()
        };
        data.users.push(user);
        this.saveData(data);
        return user;
    }

    getUserByEmail(email) {
        const data = this.getData();
        return data.users.find(user => user.email === email);
    }

    setCurrentUser(userId) {
        const data = this.getData();
        data.currentUser = userId;
        this.saveData(data);
    }

    getCurrentUser() {
        const data = this.getData();
        return data.users.find(user => user.id === data.currentUser);
    }

    logout() {
        const data = this.getData();
        data.currentUser = null;
        this.saveData(data);
    }

    // Company operations
    createCompany(companyData, ownerId) {
        const data = this.getData();
        const company = {
            id: this.generateId(),
            ...companyData,
            ownerId,
            createdAt: new Date().toISOString()
        };
        data.companies.push(company);
        
        // Update user with companyId
        const user = data.users.find(u => u.id === ownerId);
        if (user) {
            user.companyId = company.id;
        }
        
        this.saveData(data);
        return company;
    }

    getCompanyByOwnerId(ownerId) {
        const data = this.getData();
        return data.companies.find(company => company.ownerId === ownerId);
    }

    // Employee operations
    createEmployee(employeeData, companyId) {
        const data = this.getData();
        const employee = {
            id: this.generateId(),
            companyId,
            ...employeeData,
            createdAt: new Date().toISOString()
        };
        data.employees.push(employee);
        this.saveData(data);
        return employee;
    }

    getEmployeesByCompanyId(companyId) {
        const data = this.getData();
        return data.employees.filter(employee => employee.companyId === companyId);
    }

    updateEmployee(employeeId, employeeData) {
        const data = this.getData();
        const index = data.employees.findIndex(emp => emp.id === employeeId);
        if (index !== -1) {
            data.employees[index] = {
                ...data.employees[index],
                ...employeeData,
                updatedAt: new Date().toISOString()
            };
            this.saveData(data);
            return data.employees[index];
        }
        return null;
    }

    deleteEmployee(employeeId) {
        const data = this.getData();
        data.employees = data.employees.filter(emp => emp.id !== employeeId);
        this.saveData(data);
    }

    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// ===== Application State =====
class App {
    constructor() {
        this.dataStore = new DataStore();
        this.currentView = 'auth-view';
        this.isEditMode = false;
        this.currentEmployeeId = null;
        
        this.initializeApp();
    }

    initializeApp() {
        // Check if user is logged in
        const currentUser = this.dataStore.getCurrentUser();
        if (currentUser) {
            const company = this.dataStore.getCompanyByOwnerId(currentUser.id);
            if (company) {
                this.showDashboard();
            } else {
                this.showView('company-setup-view');
            }
        } else {
            this.showView('auth-view');
        }

        this.attachEventListeners();
    }

    attachEventListeners() {
        // Auth form switching
        document.getElementById('show-signup')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchAuthForm('signup');
        });

        document.getElementById('show-login')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchAuthForm('login');
        });

        // Login form
        document.getElementById('login-form-element')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin(e);
        });

        // Signup form
        document.getElementById('signup-form-element')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup(e);
        });

        // Company form
        document.getElementById('company-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCompanySetup(e);
        });

        // Dashboard actions
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.handleLogout();
        });

        document.getElementById('add-employee-btn')?.addEventListener('click', () => {
            this.openEmployeeModal();
        });

        // Employee modal
        document.getElementById('close-modal')?.addEventListener('click', () => {
            this.closeEmployeeModal();
        });

        document.getElementById('cancel-modal')?.addEventListener('click', () => {
            this.closeEmployeeModal();
        });

        document.getElementById('employee-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'employee-modal') {
                this.closeEmployeeModal();
            }
        });

        document.getElementById('employee-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEmployeeSubmit(e);
        });
    }

    switchAuthForm(form) {
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        
        if (form === 'signup') {
            loginForm.classList.remove('active');
            signupForm.classList.add('active');
        } else {
            signupForm.classList.remove('active');
            loginForm.classList.add('active');
        }
    }

    handleLogin(e) {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const user = this.dataStore.getUserByEmail(email);
        
        if (!user) {
            this.showNotification('No account found with this email', 'error');
            return;
        }

        if (user.password !== password) {
            this.showNotification('Incorrect password', 'error');
            return;
        }

        this.dataStore.setCurrentUser(user.id);
        
        const company = this.dataStore.getCompanyByOwnerId(user.id);
        if (company) {
            this.showDashboard();
        } else {
            this.showView('company-setup-view');
        }
        
        this.showNotification('Welcome back!', 'success');
    }

    handleSignup(e) {
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        // Validate password length
        if (password.length < 6) {
            this.showNotification('Password must be at least 6 characters', 'error');
            return;
        }

        // Check if email already exists
        if (this.dataStore.getUserByEmail(email)) {
            this.showNotification('An account with this email already exists', 'error');
            return;
        }

        const user = this.dataStore.createUser({ name, email, password });
        this.dataStore.setCurrentUser(user.id);
        
        this.showView('company-setup-view');
        this.showNotification('Account created successfully!', 'success');
    }

    handleCompanySetup(e) {
        const currentUser = this.dataStore.getCurrentUser();
        
        const companyData = {
            name: document.getElementById('company-name').value,
            industry: document.getElementById('company-industry').value,
            size: document.getElementById('company-size').value
        };

        this.dataStore.createCompany(companyData, currentUser.id);
        this.showDashboard();
        this.showNotification('Company created successfully!', 'success');
    }

    handleLogout() {
        this.dataStore.logout();
        this.showView('auth-view');
        this.switchAuthForm('login');
        
        // Reset forms
        document.getElementById('login-form-element').reset();
        document.getElementById('signup-form-element').reset();
        
        this.showNotification('Logged out successfully', 'success');
    }

    showDashboard() {
        this.showView('dashboard-view');
        this.renderDashboard();
    }

    renderDashboard() {
        const currentUser = this.dataStore.getCurrentUser();
        const company = this.dataStore.getCompanyByOwnerId(currentUser.id);
        const employees = this.dataStore.getEmployeesByCompanyId(company.id);

        // Update header
        document.getElementById('company-name-display').innerHTML = 
            `${company.name} <span class="gradient-text">HR</span>`;
        document.getElementById('user-name-display').textContent = 
            `Welcome back, ${currentUser.name}`;

        // Render employees
        const employeeList = document.getElementById('employee-list');
        const emptyState = document.getElementById('empty-state');

        if (employees.length === 0) {
            emptyState.style.display = 'block';
            employeeList.innerHTML = '';
        } else {
            emptyState.style.display = 'none';
            employeeList.innerHTML = employees.map(emp => this.createEmployeeCard(emp)).join('');
            
            // Attach event listeners to employee cards
            employees.forEach(emp => {
                document.querySelector(`[data-employee-id="${emp.id}"] .edit-btn`)
                    ?.addEventListener('click', () => this.openEmployeeModal(emp));
                
                document.querySelector(`[data-employee-id="${emp.id}"] .delete-btn`)
                    ?.addEventListener('click', () => this.deleteEmployee(emp.id));
            });
        }
    }

    createEmployeeCard(employee) {
        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0
            }).format(amount);
        };

        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        };

        return `
            <div class="employee-card" data-employee-id="${employee.id}">
                <div class="employee-header">
                    <div class="employee-info">
                        <h3>${employee.name}</h3>
                        <div class="position">${employee.position}</div>
                        <div class="email">${employee.email}</div>
                    </div>
                    <div class="employee-actions">
                        <button class="icon-btn edit-btn" title="Edit">✏️</button>
                        <button class="icon-btn delete-btn delete" title="Delete">🗑️</button>
                    </div>
                </div>
                <div class="employee-details">
                    <div class="detail-item">
                        <div class="detail-label">Department</div>
                        <div class="detail-value">${employee.department}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Start Date</div>
                        <div class="detail-value">${formatDate(employee.startDate)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Salary</div>
                        <div class="detail-value">${formatCurrency(employee.salary)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Employee ID</div>
                        <div class="detail-value">#${employee.id.slice(-6).toUpperCase()}</div>
                    </div>
                </div>
            </div>
        `;
    }

    openEmployeeModal(employee = null) {
        const modal = document.getElementById('employee-modal');
        const modalTitle = document.getElementById('modal-title');
        const form = document.getElementById('employee-form');
        
        if (employee) {
            // Edit mode
            this.isEditMode = true;
            this.currentEmployeeId = employee.id;
            modalTitle.textContent = 'Edit Employee';
            
            document.getElementById('employee-id').value = employee.id;
            document.getElementById('employee-name').value = employee.name;
            document.getElementById('employee-email').value = employee.email;
            document.getElementById('employee-position').value = employee.position;
            document.getElementById('employee-department').value = employee.department;
            document.getElementById('employee-start-date').value = employee.startDate;
            document.getElementById('employee-salary').value = employee.salary;
        } else {
            // Add mode
            this.isEditMode = false;
            this.currentEmployeeId = null;
            modalTitle.textContent = 'Add Employee';
            form.reset();
        }
        
        modal.classList.add('active');
    }

    closeEmployeeModal() {
        const modal = document.getElementById('employee-modal');
        modal.classList.remove('active');
        document.getElementById('employee-form').reset();
        this.isEditMode = false;
        this.currentEmployeeId = null;
    }

    handleEmployeeSubmit(e) {
        const currentUser = this.dataStore.getCurrentUser();
        const company = this.dataStore.getCompanyByOwnerId(currentUser.id);
        
        const employeeData = {
            name: document.getElementById('employee-name').value,
            email: document.getElementById('employee-email').value,
            position: document.getElementById('employee-position').value,
            department: document.getElementById('employee-department').value,
            startDate: document.getElementById('employee-start-date').value,
            salary: parseFloat(document.getElementById('employee-salary').value)
        };

        if (this.isEditMode) {
            this.dataStore.updateEmployee(this.currentEmployeeId, employeeData);
            this.showNotification('Employee updated successfully!', 'success');
        } else {
            this.dataStore.createEmployee(employeeData, company.id);
            this.showNotification('Employee added successfully!', 'success');
        }

        this.closeEmployeeModal();
        this.renderDashboard();
    }

    deleteEmployee(employeeId) {
        if (confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
            this.dataStore.deleteEmployee(employeeId);
            this.renderDashboard();
            this.showNotification('Employee deleted', 'success');
        }
    }

    showView(viewId) {
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(viewId).classList.add('active');
        this.currentView = viewId;
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
