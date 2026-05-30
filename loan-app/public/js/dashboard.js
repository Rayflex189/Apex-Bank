// Dashboard specific functionality
class Dashboard {
    static async loadUserData() {
        try {
            const response = await Auth.fetch('/api/auth/me');
            if (response.ok) {
                const data = await response.json();
                this.updateUI(data);
                return data;
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            Toast.error('Failed to load user data');
        }
        return null;
    }
    
    static updateUI(userData) {
        const { user, profile } = userData;
        
        // Update profile card
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileBalance = document.getElementById('profileBalance');
        const balanceValue = document.getElementById('balance-value');
        
        if (profileName) {
            profileName.textContent = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || user.email;
        }
        if (profileEmail) profileEmail.textContent = user.email;
        if (profileBalance) {
            profileBalance.textContent = FormatHelper.currency(profile.balance, profile.currency);
        }
        if (balanceValue) {
            balanceValue.textContent = FormatHelper.currency(profile.balance, profile.currency);
        }
        
        // Update user names in menus
        const userNameElements = document.querySelectorAll('#userName, #mobileUserName');
        userNameElements.forEach(el => {
            el.textContent = profile.firstName || user.email;
        });
        
        // Show staff menu if user is staff
        const staffMenu = document.getElementById('staffMenuSection');
        if (staffMenu && (user.isStaff || user.isSuperuser)) {
            staffMenu.style.display = 'block';
        }
        
        // Update transaction count
        const transactionCount = document.getElementById('transactionCount');
        if (transactionCount) {
            this.loadTransactions();
        }
    }
    
    static async loadTransactions(limit = 5) {
        try {
            const response = await Auth.fetch(`/api/transactions/recent?limit=${limit}`);
            if (response.ok) {
                const transactions = await response.json();
                this.renderTransactions(transactions);
                
                const transactionCount = document.getElementById('transactionCount');
                if (transactionCount) {
                    transactionCount.textContent = transactions.length;
                }
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
        }
    }
    
    static renderTransactions(transactions) {
        const transactionList = document.getElementById('transactionList');
        if (!transactionList) return;
        
        if (!transactions || transactions.length === 0) {
            transactionList.innerHTML = `
                <div class="transaction-item">
                    <div class="transaction-desc">No recent transactions.</div>
                </div>
            `;
            return;
        }
        
        transactionList.innerHTML = transactions.map(tx => `
            <div class="transaction-item">
                <div class="transaction-desc">
                    <span class="transaction-title">${tx.description || (tx.amount > 0 ? 'Credit' : 'Debit')}</span>
                    <div class="transaction-meta">
                        <span>${FormatHelper.date(tx.timestamp)}</span>
                        <span class="status-success">Successful</span>
                    </div>
                </div>
                <div class="transaction-amount ${tx.amount > 0 ? 'amount-positive' : 'amount-negative'}">
                    ${FormatHelper.currency(Math.abs(tx.amount))}
                </div>
            </div>
        `).join('');
    }
    
    static async loadLoans() {
        try {
            const response = await Auth.fetch('/api/loans/my-loans?limit=3');
            if (response.ok) {
                const loans = await response.json();
                this.renderLoans(loans);
            }
        } catch (error) {
            console.error('Error loading loans:', error);
        }
    }
    
    static renderLoans(loans) {
        const loanList = document.getElementById('loanList');
        if (!loanList) return;
        
        if (!loans || loans.length === 0) {
            loanList.innerHTML = '<div class="loan-item">No active loans</div>';
            return;
        }
        
        loanList.innerHTML = loans.map(loan => `
            <div class="loan-item">
                <div class="loan-info">
                    <span class="loan-amount">${FormatHelper.currency(loan.amount)}</span>
                    <span class="loan-status status-${loan.status.toLowerCase()}">${loan.status}</span>
                </div>
                <div class="loan-details">
                    <span>Due: ${FormatHelper.currency(loan.monthlyPayment)}/month</span>
                    <span>${loan.duration} months left</span>
                </div>
            </div>
        `).join('');
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    if (!PageGuard.requireAuth()) return;
    
    Loading.show();
    try {
        await Dashboard.loadUserData();
        await Dashboard.loadTransactions();
        await Dashboard.loadLoans();
        
        // Setup balance toggle
        const balanceSpan = document.getElementById('balance-value');
        const eyeIcon = document.getElementById('toggle-balance');
        let isBalanceVisible = true;
        let originalBalance = balanceSpan?.textContent || '';
        
        if (eyeIcon && balanceSpan) {
            eyeIcon.addEventListener('click', () => {
                if (isBalanceVisible) {
                    originalBalance = balanceSpan.textContent;
                    balanceSpan.textContent = '****';
                } else {
                    balanceSpan.textContent = originalBalance;
                }
                isBalanceVisible = !isBalanceVisible;
            });
        }
        
        // Setup add money modal
        const addMoneyBtn = document.getElementById('addMoneyBtn');
        if (addMoneyBtn) {
            addMoneyBtn.addEventListener('click', () => {
                // Show add money modal
                const modal = document.getElementById('addMoneyModal');
                if (modal) modal.classList.add('show');
            });
        }
        
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        Toast.error('Failed to load dashboard');
    } finally {
        Loading.hide();
    }
});
