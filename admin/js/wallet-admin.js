// Admin wallet management functions

/**
 * Get user wallet data
 * @param {string} userId - The user ID
 * @returns {Object} - The wallet data
 */
function getUserWallet(userId) {
    // Check user specific wallet
    let walletData = JSON.parse(localStorage.getItem(`wallet_${userId}`));
    
    // If no wallet exists, create a default one
    if (!walletData) {
        walletData = {
            balance: 0,
            transactions: [],
            rewards: []
        };
        // Save wallet data
        localStorage.setItem(`wallet_${userId}`, JSON.stringify(walletData));
    }
    
    return walletData;
}

/**
 * Update user wallet balance
 * @param {string} userId - The user ID
 * @param {number} amount - The amount to be added/subtracted
 * @param {string} description - Transaction description
 * @param {string} type - Transaction type (adjustment, cashback, reward, referral)
 * @returns {Object} - Updated wallet data
 */
function updateUserWalletBalance(userId, amount, description, type = 'adjustment') {
    // Get wallet data
    const walletData = getUserWallet(userId);
    
    // Parse the amount as a float
    const adjustmentAmount = parseFloat(amount);
    
    // Calculate new balance
    const oldBalance = walletData.balance;
    walletData.balance += adjustmentAmount;
    
    // Add transaction record
    const transaction = {
        id: walletData.transactions.length + 1,
        type: type,
        amount: Math.abs(adjustmentAmount), // Store as positive value
        date: Date.now(),
        description: description,
        isCredit: adjustmentAmount > 0,
        oldBalance: oldBalance,
        newBalance: walletData.balance,
        adminAdjustment: true
    };
    
    // Add to transactions list
    walletData.transactions.unshift(transaction);
    
    // Save updated wallet data
    localStorage.setItem(`wallet_${userId}`, JSON.stringify(walletData));
    
    // Add notification for admin audit
    const adminName = sessionStorage.getItem('adminName') || 'Administrator';
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    notifications.unshift({
        message: `Wallet ${adjustmentAmount >= 0 ? 'credited' : 'debited'} for user (ID: ${userId}): PKR ${Math.abs(adjustmentAmount).toFixed(2)}`,
        icon: adjustmentAmount >= 0 ? 'fa-plus-circle' : 'fa-minus-circle',
        timestamp: new Date().toISOString(),
        type: 'wallet',
        userId: userId,
        amount: adjustmentAmount,
        admin: adminName
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    // If this is a deduction (negative amount), send notification to user
    if (adjustmentAmount < 0) {
        // Add user notification for money deduction
        const userNotificationsKey = `notifications_${userId}`;
        const userNotifications = JSON.parse(localStorage.getItem(userNotificationsKey)) || [];
        userNotifications.unshift({
            id: 'NOTIF_' + Date.now(),
            title: 'Funds Deducted',
            message: `PKR ${Math.abs(adjustmentAmount).toFixed(2)} has been deducted from your wallet by the administrator.`,
            icon: 'fa-minus-circle',
            type: 'wallet',
            status: 'unread',
            timestamp: new Date().toISOString(),
            isDeduction: true, // Flag for red color styling
            description: description || 'Administrative adjustment'
        });
        localStorage.setItem(userNotificationsKey, JSON.stringify(userNotifications));
    }
    
    return walletData;
}

/**
 * View user wallet transactions
 * @param {string} userId - The user ID
 */
function viewUserWalletTransactions(userId) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found!');
        return;
    }
    
    const walletData = getUserWallet(userId);
    
    // Create modal to display wallet transactions
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'walletTransactionsModal';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-labelledby', 'walletTransactionsModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="walletTransactionsModalLabel">Wallet Transactions: ${user.name}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="wallet-summary mb-4 p-3 bg-light rounded">
                        <h4>Current Balance: <span class="text-success">PKR ${walletData.balance.toFixed(2)}</span></h4>
                    </div>
                    <h5>Transaction History</h5>
                    ${walletData.transactions.length > 0 ? `
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Description</th>
                                        <th>Amount</th>
                                        <th>Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${walletData.transactions.map(transaction => `
                                        <tr>
                                            <td>${new Date(transaction.date).toLocaleString()}</td>
                                            <td>
                                                <span class="badge bg-${getTransactionTypeColor(transaction.type)}">
                                                    ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                                                </span>
                                            </td>
                                            <td>${transaction.description}</td>
                                            <td class="${transaction.isCredit ? 'text-success' : 'text-danger'}">
                                                ${transaction.isCredit ? '+' : '-'}PKR ${transaction.amount.toFixed(2)}
                                            </td>
                                            <td>PKR ${transaction.newBalance ? transaction.newBalance.toFixed(2) : '—'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <div class="alert alert-info">No transactions found.</div>
                    `}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Initialize and show the modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Remove modal from DOM when hidden
    modal.addEventListener('hidden.bs.modal', function () {
        modal.remove();
    });
}

/**
 * Get color for transaction type badge
 * @param {string} type - Transaction type
 * @returns {string} - Bootstrap color class
 */
function getTransactionTypeColor(type) {
    switch (type.toLowerCase()) {
        case 'cashback':
            return 'success';
        case 'referral':
            return 'primary';
        case 'reward':
            return 'warning';
        case 'adjustment':
            return 'info';
        default:
            return 'secondary';
    }
}
