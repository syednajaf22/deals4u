// Additional wallet management functions for admin panel

/**
 * Load and display all user wallets in a table
 */
function loadWalletManagement() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const walletContainer = document.getElementById('wallet-container');
    
    if (!walletContainer) {
        console.error('Wallet container not found');
        return;
    }
    
    // Prepare table HTML
    let tableHTML = `
        <table class="table table-striped table-hover">
            <thead class="table-dark">
                <tr>
                    <th scope="col" width="60">ID</th>
                    <th scope="col" width="60">Avatar</th>
                    <th scope="col">User</th>
                    <th scope="col">Email</th>
                    <th scope="col" width="150">Current Balance</th>
                    <th scope="col" width="180">Last Transaction</th>
                    <th scope="col" width="220">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // No users case
    if (users.length === 0) {
        tableHTML += `
            <tr>
                <td colspan="7" class="text-center p-5">
                    <p>No users found</p>
                </td>
            </tr>
        `;
    } else {
        // Sort users by wallet balance (highest first)
        const usersWithWallets = users.map(user => {
            const wallet = getUserWallet(user.id);
            return { ...user, wallet };
        }).sort((a, b) => b.wallet.balance - a.wallet.balance);
        
        // Generate table rows
        usersWithWallets.forEach((user, index) => {
            const lastTransaction = user.wallet.transactions.length > 0 
                ? new Date(user.wallet.transactions[0].date).toLocaleString() 
                : 'No transactions';
            
            tableHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>
                        <img src="${user.avatar}" alt="${user.name}" class="rounded-circle" width="40" height="40">
                    </td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td class="text-${user.wallet.balance > 0 ? 'success' : 'secondary'} fw-bold">
                        PKR ${user.wallet.balance.toFixed(2)}
                    </td>
                    <td class="text-muted small">${lastTransaction}</td>
                    <td>
                        <button class="btn btn-sm btn-success me-1" onclick="showAddFundsModal('${user.id}', '${user.name}')">
                            <i class="fas fa-plus-circle"></i> Add
                        </button>
                        <button class="btn btn-sm btn-danger me-1" onclick="showDeductFundsModal('${user.id}', '${user.name}')" ${user.wallet.balance <= 0 ? 'disabled' : ''}>
                            <i class="fas fa-minus-circle"></i> Deduct
                        </button>
                        <button class="btn btn-sm btn-info" onclick="viewUserWalletTransactions('${user.id}')">
                            <i class="fas fa-history"></i> History
                        </button>
                    </td>
                </tr>
            `;
        });
    }
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    walletContainer.innerHTML = tableHTML;
}

/**
 * Refresh wallet list
 */
function refreshWalletList() {
    loadWalletManagement();
    // Show toast notification
    const toast = document.createElement('div');
    toast.className = 'position-fixed bottom-0 end-0 p-3';
    toast.style.zIndex = '11';
    toast.innerHTML = `
        <div class="toast align-items-center text-white bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-check-circle me-2"></i> Wallet data refreshed successfully
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    document.body.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast.querySelector('.toast'), { delay: 3000 });
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        document.body.removeChild(toast);
    });
}

/**
 * Search wallets by user name or email
 */
function searchWallets() {
    const searchTerm = document.getElementById('wallet-search').value.toLowerCase().trim();
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const walletContainer = document.getElementById('wallet-container');
    
    if (!searchTerm) {
        loadWalletManagement();
        return;
    }
    
    // Filter users by search term
    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm) || 
        user.email.toLowerCase().includes(searchTerm)
    );
    
    // Prepare table HTML using the same format as loadWalletManagement
    let tableHTML = `
        <table class="table table-striped table-hover">
            <thead class="table-dark">
                <tr>
                    <th scope="col" width="60">ID</th>
                    <th scope="col" width="60">Avatar</th>
                    <th scope="col">User</th>
                    <th scope="col">Email</th>
                    <th scope="col" width="150">Current Balance</th>
                    <th scope="col" width="180">Last Transaction</th>
                    <th scope="col" width="220">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    if (filteredUsers.length === 0) {
        tableHTML += `
            <tr>
                <td colspan="7" class="text-center p-5">
                    <p>No matching users found</p>
                    <button class="btn btn-outline-secondary btn-sm" onclick="loadWalletManagement()">
                        <i class="fas fa-arrow-left"></i> Back to all users
                    </button>
                </td>
            </tr>
        `;
    } else {
        // Map and sort filtered users
        const usersWithWallets = filteredUsers.map(user => {
            const wallet = getUserWallet(user.id);
            return { ...user, wallet };
        }).sort((a, b) => b.wallet.balance - a.wallet.balance);
        
        // Generate table rows using the same format
        usersWithWallets.forEach((user, index) => {
            const lastTransaction = user.wallet.transactions.length > 0 
                ? new Date(user.wallet.transactions[0].date).toLocaleString() 
                : 'No transactions';
            
            tableHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>
                        <img src="${user.avatar}" alt="${user.name}" class="rounded-circle" width="40" height="40">
                    </td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td class="text-${user.wallet.balance > 0 ? 'success' : 'secondary'} fw-bold">
                        PKR ${user.wallet.balance.toFixed(2)}
                    </td>
                    <td class="text-muted small">${lastTransaction}</td>
                    <td>
                        <button class="btn btn-sm btn-success me-1" onclick="showAddFundsModal('${user.id}', '${user.name}')">
                            <i class="fas fa-plus-circle"></i> Add
                        </button>
                        <button class="btn btn-sm btn-danger me-1" onclick="showDeductFundsModal('${user.id}', '${user.name}')" ${user.wallet.balance <= 0 ? 'disabled' : ''}>
                            <i class="fas fa-minus-circle"></i> Deduct
                        </button>
                        <button class="btn btn-sm btn-info" onclick="viewUserWalletTransactions('${user.id}')">
                            <i class="fas fa-history"></i> History
                        </button>
                    </td>
                </tr>
            `;
        });
    }
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    walletContainer.innerHTML = tableHTML;
}

/**
 * Show modal for adding funds to a user's wallet
 */
function showAddFundsModal(userId, userName) {
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'addFundsModal';
    modal.tabIndex = '-1';
    modal.setAttribute('aria-labelledby', 'addFundsModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header bg-success text-white">
                    <h5 class="modal-title" id="addFundsModalLabel">
                        <i class="fas fa-plus-circle me-2"></i> Add Funds to ${userName}'s Wallet
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="add-funds-form">
                        <div class="mb-3">
                            <label for="add-amount" class="form-label">Amount (PKR)</label>
                            <input type="number" class="form-control" id="add-amount" min="1" step="0.01" required>
                            <div class="form-text">Enter the amount you want to add to the user's wallet.</div>
                        </div>
                        <div class="mb-3">
                            <label for="add-transaction-type" class="form-label">Transaction Type</label>
                            <select class="form-select" id="add-transaction-type" required>
                                <option value="adjustment">Adjustment</option>
                                <option value="cashback">Cashback</option>
                                <option value="reward">Reward</option>
                                <option value="referral">Referral</option>
                                <option value="profit">Profit</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="add-description" class="form-label">Description</label>
                            <textarea class="form-control" id="add-description" rows="2" required></textarea>
                            <div class="form-text">Provide a reason or description for this transaction.</div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-success" onclick="addFundsToWallet('${userId}')">Add Funds</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Initialize and show the modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Remove from DOM when hidden
    modal.addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(modal);
    });
}

/**
 * Show modal for deducting funds from a user's wallet
 */
function showDeductFundsModal(userId, userName) {
    // Get wallet data to check current balance
    const walletData = getUserWallet(userId);
    
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'deductFundsModal';
    modal.tabIndex = '-1';
    modal.setAttribute('aria-labelledby', 'deductFundsModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header bg-danger text-white">
                    <h5 class="modal-title" id="deductFundsModalLabel">
                        <i class="fas fa-minus-circle me-2"></i> Deduct Funds from ${userName}'s Wallet
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i> Current balance: <strong>PKR ${walletData.balance.toFixed(2)}</strong>
                    </div>
                    <form id="deduct-funds-form">
                        <div class="mb-3">
                            <label for="deduct-amount" class="form-label">Amount to Deduct (PKR)</label>
                            <input type="number" class="form-control" id="deduct-amount" min="0.01" max="${walletData.balance}" step="0.01" required>
                            <div class="form-text">Enter the amount you want to deduct from the user's wallet.</div>
                        </div>
                        <div class="mb-3">
                            <label for="deduct-transaction-type" class="form-label">Transaction Type</label>
                            <select class="form-select" id="deduct-transaction-type" required>
                                <option value="adjustment">Adjustment</option>
                                <option value="cashback">Reversal</option>
                                <option value="reward">Withdrawal</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="deduct-description" class="form-label">Description</label>
                            <textarea class="form-control" id="deduct-description" rows="2" required></textarea>
                            <div class="form-text">Provide a reason or description for this transaction.</div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-danger" onclick="deductFundsFromWallet('${userId}')">Deduct Funds</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Initialize and show the modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Remove from DOM when hidden
    modal.addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(modal);
    });
}

/**
 * Add funds to a user's wallet
 */
function addFundsToWallet(userId) {
    const amountInput = document.getElementById('add-amount');
    const typeSelect = document.getElementById('add-transaction-type');
    const descriptionInput = document.getElementById('add-description');
    
    if (!amountInput || !typeSelect || !descriptionInput) {
        alert('Form inputs not found');
        return;
    }
    
    const amount = parseFloat(amountInput.value);
    const type = typeSelect.value;
    const description = descriptionInput.value.trim();
    
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid positive amount');
        return;
    }
    
    if (!description) {
        alert('Please enter a description for this transaction');
        return;
    }
    
    // Add funds to wallet
    const updatedWallet = updateUserWalletBalance(userId, amount, description, type);
    
    // Close modal
    const modal = document.getElementById('addFundsModal');
    if (modal) {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
            bsModal.hide();
        }
    }
    
    // Refresh wallet list
    loadWalletManagement();
    
    // Show success message
    alert(`Successfully added PKR ${amount.toFixed(2)} to user's wallet. New balance: PKR ${updatedWallet.balance.toFixed(2)}`);
}

/**
 * Deduct funds from a user's wallet
 */
function deductFundsFromWallet(userId) {
    const amountInput = document.getElementById('deduct-amount');
    const typeSelect = document.getElementById('deduct-transaction-type');
    const descriptionInput = document.getElementById('deduct-description');
    
    if (!amountInput || !typeSelect || !descriptionInput) {
        alert('Form inputs not found');
        return;
    }
    
    const amount = parseFloat(amountInput.value);
    const type = typeSelect.value;
    const description = descriptionInput.value.trim();
    
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid positive amount');
        return;
    }
    
    if (!description) {
        alert('Please enter a description for this transaction');
        return;
    }
    
    // Get wallet data to check balance
    const walletData = getUserWallet(userId);
    if (amount > walletData.balance) {
        alert(`Insufficient funds. Current balance is PKR ${walletData.balance.toFixed(2)}`);
        return;
    }
    
    // Deduct funds from wallet (negative amount)
    const updatedWallet = updateUserWalletBalance(userId, -amount, description, type);
    
    // Close modal
    const modal = document.getElementById('deductFundsModal');
    if (modal) {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
            bsModal.hide();
        }
    }
    
    // Refresh wallet list
    loadWalletManagement();
    
    // Show success message
    alert(`Successfully deducted PKR ${amount.toFixed(2)} from user's wallet. New balance: PKR ${updatedWallet.balance.toFixed(2)}`);
}

/**
 * Update user wallet with positive amount (add funds)
 * @param {string} userId - User ID
 */
function updateUserWallet(userId) {
    const amountInput = document.getElementById('wallet-amount');
    const descriptionInput = document.getElementById('transaction-description');
    const typeSelect = document.getElementById('transaction-type');
    
    if (!amountInput || !descriptionInput || !typeSelect) {
        alert('Form inputs not found!');
        return;
    }
    
    const amount = parseFloat(amountInput.value);
    const description = descriptionInput.value;
    const type = typeSelect.value;
    
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid positive amount');
        return;
    }
    
    if (!description.trim()) {
        alert('Please enter a transaction description');
        return;
    }
    
    // Update wallet using the wallet-admin.js function
    const updatedWallet = updateUserWalletBalance(userId, amount, description, type);
    
    // Show success message
    alert(`Successfully added PKR ${amount.toFixed(2)} to user's wallet. New balance: PKR ${updatedWallet.balance.toFixed(2)}`);
    
    // Refresh user details modal
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        // Close existing modal
        const modal = document.getElementById('userDetailsModal');
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        }
        
        // Reopen user details with updated information
        setTimeout(() => viewUserDetails(userIndex), 500);
    }
}

/**
 * Update user wallet with negative amount (deduct funds)
 * @param {string} userId - User ID
 */
function deductUserWallet(userId) {
    const amountInput = document.getElementById('wallet-amount');
    const descriptionInput = document.getElementById('transaction-description');
    const typeSelect = document.getElementById('transaction-type');
    
    if (!amountInput || !descriptionInput || !typeSelect) {
        alert('Form inputs not found!');
        return;
    }
    
    const amount = parseFloat(amountInput.value);
    const description = descriptionInput.value;
    const type = typeSelect.value;
    
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid positive amount');
        return;
    }
    
    if (!description.trim()) {
        alert('Please enter a transaction description');
        return;
    }
    
    // Get current wallet balance
    const walletData = getUserWallet(userId);
    if (walletData.balance < amount) {
        alert(`Insufficient funds. Current balance is PKR ${walletData.balance.toFixed(2)}`);
        return;
    }
    
    // Update wallet with negative amount
    const updatedWallet = updateUserWalletBalance(userId, -amount, description, type);
    
    // Show success message
    alert(`Successfully deducted PKR ${amount.toFixed(2)} from user's wallet. New balance: PKR ${updatedWallet.balance.toFixed(2)}`);
    
    // Refresh user details modal
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        // Close existing modal
        const modal = document.getElementById('userDetailsModal');
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        }
        
        // Reopen user details with updated information
        setTimeout(() => viewUserDetails(userIndex), 500);
    }
}
