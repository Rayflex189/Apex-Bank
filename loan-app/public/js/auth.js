// API Configuration
const API_BASE_URL = window.location.origin;

// Auth Class for handling authentication
class Auth {
    // Token management
    static getToken() {
        return localStorage.getItem('auth_token');
    }

    static setToken(token) {
        localStorage.setItem('auth_token', token);
    }

    static removeToken() {
        localStorage.removeItem('auth_token');
    }

    // Check if user is authenticated
    static isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;
        
        try {
            // Check if token is expired
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp > Date.now() / 1000;
        } catch (error) {
            return false;
        }
    }

    // Get current user from token
    static getCurrentUser() {
        const token = this.getToken();
        if (!token) return null;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return {
                userId: payload.userId,
                email: payload.email,
                isStaff: payload.isStaff,
                exp: payload.exp
            };
        } catch (error) {
            return null;
        }
    }

    // Fetch wrapper with authentication
    static async fetch(url, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                ...options,
                headers
            });
            
            // Handle unauthorized response
            if (response.status === 401) {
                this.removeToken();
                const currentPath = window.location.pathname;
                const protectedPaths = ['/dashboard', '/profile', '/transactions', '/investments', '/apply-loan', '/apply-card', '/kyc'];
                
                if (protectedPaths.some(path => currentPath.startsWith(path))) {
                    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
                }
                throw new Error('Session expired. Please login again.');
            }
            
            return response;
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }

    // API Methods
    static async login(email, password) {
        const response = await this.fetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
        }
        
        const data = await response.json();
        this.setToken(data.token);
        return data;
    }

    static async register(userData) {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Registration failed');
        }
        
        const data = await response.json();
        if (data.token) {
            this.setToken(data.token);
        }
        return data;
    }

    static async logout() {
        try {
            await this.fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.removeToken();
            window.location.href = '/login';
        }
    }

    static async getUser() {
        const response = await this.fetch('/api/auth/me');
        if (!response.ok) {
            throw new Error('Failed to get user data');
        }
        return await response.json();
    }

    static async changePassword(currentPassword, newPassword) {
        const response = await this.fetch('/api/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Password change failed');
        }
        
        return await response.json();
    }

    static async verifyEmail(token) {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify/${token}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Verification failed');
        }
        return await response.json();
    }

    static async forgotPassword(email) {
        const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Request failed');
        }
        
        return await response.json();
    }

    static async resetPassword(token, newPassword) {
        const response = await fetch(`${API_BASE_URL}/api/auth/reset-password/${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: newPassword })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Password reset failed');
        }
        
        return await response.json();
    }

    // Helper methods
    static getRedirectUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('redirect') || '/dashboard';
    }

    static redirectToDashboard() {
        window.location.href = this.getRedirectUrl();
    }
}

// Toast Notification System
class Toast {
    static show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas ${icons[type] || icons.info}"></i>
            <span class="toast-message">${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('toast-hide');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    
    static success(message, duration) {
        this.show(message, 'success', duration);
    }
    
    static error(message, duration) {
        this.show(message, 'error', duration);
    }
    
    static warning(message, duration) {
        this.show(message, 'warning', duration);
    }
    
    static info(message, duration) {
        this.show(message, 'info', duration);
    }
}

// Loading Spinner
class Loading {
    static show(containerId = null) {
        const spinner = document.createElement('div');
        spinner.className = 'loading-overlay';
        spinner.id = 'global-loading';
        spinner.innerHTML = '<div class="loading-spinner"></div>';
        
        if (containerId) {
            const container = document.getElementById(containerId);
            if (container) {
                container.style.position = 'relative';
                container.appendChild(spinner);
            } else {
                document.body.appendChild(spinner);
            }
        } else {
            document.body.appendChild(spinner);
        }
    }
    
    static hide() {
        const spinner = document.getElementById('global-loading');
        if (spinner) spinner.remove();
    }
}

// Form Helpers
class FormHelper {
    static serialize(form) {
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            if (data[key] !== undefined) {
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].push(value);
            } else {
                data[key] = value;
            }
        });
        return data;
    }
    
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    static validatePhone(phone) {
        const re = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
        return re.test(phone);
    }
    
    static showError(input, message) {
        const formGroup = input.closest('.form-group');
        if (formGroup) {
            const errorSpan = formGroup.querySelector('.error-message') || document.createElement('span');
            errorSpan.className = 'error-message';
            errorSpan.style.color = '#c83a3a';
            errorSpan.style.fontSize = '0.8rem';
            errorSpan.style.marginTop = '0.25rem';
            errorSpan.textContent = message;
            
            if (!formGroup.querySelector('.error-message')) {
                formGroup.appendChild(errorSpan);
            }
            input.style.borderColor = '#c83a3a';
        }
    }
    
    static clearErrors(form) {
        const errors = form.querySelectorAll('.error-message');
        errors.forEach(error => error.remove());
        
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.style.borderColor = '';
        });
    }
}

// Number Formatting
class FormatHelper {
    static currency(amount, currency = 'USD') {
        const symbols = {
            USD: '$',
            NGN: '₦',
            EUR: '€',
            GBP: '£'
        };
        
        const symbol = symbols[currency] || '$';
        return `${symbol}${this.number(amount)}`;
    }
    
    static number(number) {
        return new Intl.NumberFormat('en-US').format(number);
    }
    
    static date(dateString, format = 'MMM DD, YYYY') {
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        return date.toLocaleDateString('en-US', options);
    }
    
    static time(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    static datetime(dateString) {
        return `${this.date(dateString)} at ${this.time(dateString)}`;
    }
}

// Page Protection
class PageGuard {
    static requireAuth() {
        if (!Auth.isAuthenticated()) {
            const currentPath = window.location.pathname;
            const redirect = `/login?redirect=${encodeURIComponent(currentPath)}`;
            window.location.href = redirect;
            return false;
        }
        return true;
    }
    
    static redirectIfAuth() {
        if (Auth.isAuthenticated()) {
            const redirect = Auth.getRedirectUrl();
            window.location.href = redirect;
            return true;
        }
        return false;
    }
    
    static requireStaff() {
        if (!Auth.isAuthenticated()) {
            this.requireAuth();
            return false;
        }
        
        const user = Auth.getCurrentUser();
        if (!user || !user.isStaff) {
            window.location.href = '/dashboard';
            Toast.error('Access denied. Staff privileges required.');
            return false;
        }
        return true;
    }
    
    static async checkAndLoadUser() {
        if (this.requireAuth()) {
            try {
                Loading.show();
                const userData = await Auth.getUser();
                return userData;
            } catch (error) {
                console.error('Error loading user:', error);
                return null;
            } finally {
                Loading.hide();
            }
        }
        return null;
    }
}

// Auto-initialize for protected pages
document.addEventListener('DOMContentLoaded', () => {
    // Add CSS styles for toast and loading
    const style = document.createElement('style');
    style.textContent = `
        .toast {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            border-radius: 8px;
            padding: 12px 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideInRight 0.3s ease;
            max-width: 350px;
        }
        
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .toast-hide {
            animation: slideOutRight 0.3s ease forwards;
        }
        
        @keyframes slideOutRight {
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .toast-success {
            border-left: 4px solid #1e9c50;
        }
        .toast-error {
            border-left: 4px solid #c83a3a;
        }
        .toast-warning {
            border-left: 4px solid #f59e0b;
        }
        .toast-info {
            border-left: 4px solid #0a4b7a;
        }
        
        .toast i {
            font-size: 1.2rem;
        }
        
        .toast-success i { color: #1e9c50; }
        .toast-error i { color: #c83a3a; }
        .toast-warning i { color: #f59e0b; }
        .toast-info i { color: #0a4b7a; }
        
        .toast-message {
            color: #333;
            font-size: 0.9rem;
        }
        
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #0a4b7a;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .error-message {
            font-size: 0.8rem;
            margin-top: 0.25rem;
        }
    `;
    document.head.appendChild(style);
});

// Export for use in other files
window.Auth = Auth;
window.Toast = Toast;
window.Loading = Loading;
window.FormHelper = FormHelper;
window.FormatHelper = FormatHelper;
window.PageGuard = PageGuard;
