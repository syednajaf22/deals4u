/**
 * Wallet Requests Management
 * Handles deposit and withdrawal requests from users
 */

// Keep track of all requests data
let depositRequests = [];
let withdrawalRequests = [];

/**
 * Initialize wallet requests page
 */
function loadWalletRequests() {
    // Load both types of requests
    loadDepositRequests();
    loadWithdrawalRequests();
    
    // Set up tab switching
    document.getElementById('deposit-requests-tab').addEventListener('click', () => {
        showDepositRequestsTab();
    });
    
    document.getElementById('withdrawal-requests-tab').addEventListener('click', () => {
        showWithdrawalRequestsTab();
    });
    
    // Set up search functionality
    document.getElementById('request-search').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        filterRequests(searchTerm);
    });
}

/**
 * Show deposit requests tab
 */
function showDepositRequestsTab() {
    document.getElementById('deposit-requests-tab').classList.add('active');
    document.getElementById('withdrawal-requests-tab').classList.remove('active');
    document.getElementById('deposit-requests-container').style.display = 'block';
    document.getElementById('withdrawal-requests-container').style.display = 'none';
}

/**
 * Show withdrawal requests tab
 */
function showWithdrawalRequestsTab() {
    document.getElementById('withdrawal-requests-tab').classList.add('active');
    document.getElementById('deposit-requests-tab').classList.remove('active');
    document.getElementById('withdrawal-requests-container').style.display = 'block';
    document.getElementById('deposit-requests-container').style.display = 'none';
}

/**
 * Load deposit requests from localStorage
 */
function loadDepositRequests() {
    depositRequests = JSON.parse(localStorage.getItem('depositRequests')) || [];
    renderDepositRequests(depositRequests);
}

/**
 * Load withdrawal requests from localStorage
 */
function loadWithdrawalRequests() {
    withdrawalRequests = JSON.parse(localStorage.getItem('withdrawalRequests')) || [];
    renderWithdrawalRequests(withdrawalRequests);
}

/**
 * Render deposit requests in the table
 */
function renderDepositRequests(requests) {
    const container = document.getElementById('deposit-requests-list');
    container.innerHTML = '';
    
    if (requests.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <p class="text-muted mb-0">No deposit requests found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort by date (newest first)
    requests.sort((a, b) => b.createdAt - a.createdAt);
    
    requests.forEach(request => {
        const requestDate = new Date(request.createdAt);
        const statusClass = getStatusClass(request.status);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${request.id}</td>
            <td>
                <div class="d-flex flex-column">
                    <span class="fw-bold">${request.userName}</span>
                    <small class="text-muted">${request.userEmail}</small>
                </div>
            </td>
            <td class="fw-bold">PKR ${request.amount.toFixed(2)}</td>
            <td>${getMethodName(request.method)}</td>
            <td>${requestDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
            <td><span class="badge ${statusClass}">${request.status.toUpperCase()}</span></td>
            <td class="action-buttons">
                ${request.status === 'pending' ? `
                    <button class="btn btn-sm btn-success me-1" onclick="approveDepositRequest('${request.id}')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="rejectDepositRequest('${request.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                ` : `
                    <button class="btn btn-sm btn-info" onclick="viewDepositDetails('${request.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                `}
            </td>
        `;
        container.appendChild(row);
    });
}

/**
 * Render withdrawal requests in the table
 */
function renderWithdrawalRequests(requests) {
    const container = document.getElementById('withdrawal-requests-list');
    container.innerHTML = '';
    
    if (requests.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <p class="text-muted mb-0">No withdrawal requests found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort by date (newest first)
    requests.sort((a, b) => b.createdAt - a.createdAt);
    
    requests.forEach(request => {
        const requestDate = new Date(request.createdAt);
        const statusClass = getStatusClass(request.status);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${request.id}</td>
            <td>
                <div class="d-flex flex-column">
                    <span class="fw-bold">${request.userName}</span>
                    <small class="text-muted">${request.userEmail}</small>
                </div>
            </td>
            <td class="fw-bold">PKR ${request.amount.toFixed(2)}</td>
            <td>${getMethodName(request.method)}</td>
            <td>${requestDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
            <td><span class="badge ${statusClass}">${request.status.toUpperCase()}</span></td>
            <td class="action-buttons">
                ${request.status === 'pending' ? `
                    <button class="btn btn-sm btn-success me-1" onclick="approveWithdrawalRequest('${request.id}')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="rejectWithdrawalRequest('${request.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                ` : `
                    <button class="btn btn-sm btn-info" onclick="viewWithdrawalDetails('${request.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                `}
            </td>
        `;
        container.appendChild(row);
    });
}

/**
 * Get CSS class for status badge
 */
function getStatusClass(status) {
    switch (status) {
        case 'pending':
            return 'bg-warning text-dark';
        case 'approved':
            return 'bg-success';
        case 'rejected':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

/**
 * Get payment method readable name
 */
function getMethodName(methodKey) {
    const methods = {
        bank_account: 'Bank Account',
        easypaisa: 'EasyPaisa',
        jazzcash: 'JazzCash',
        upaisa: 'UPaisa',
        sadapay: 'SadaPay'
    };
    
    return methods[methodKey] || methodKey;
}

/**
 * Render account details based on request data
 */
function renderAccountDetails(request) {
    // Check for the new direct accountName and accountNumber format
    if (request.accountName && request.accountNumber) {
        return `
            <div class="alert alert-info mt-2 mb-2">
                <h6 class="alert-heading font-weight-bold">${getMethodName(request.method)} Details</h6>
                <p class="mb-1"><strong>Account Holder Name:</strong> ${request.accountName}</p>
                <p class="mb-1"><strong>Account Number:</strong> ${request.accountNumber}</p>
            </div>
        `;
    }
    
    // If no account details, return empty string
    if (!request.accountDetails) return '';
    
    // Extract account details
    const details = request.accountDetails;
    
    // For new format with account number and account holder
    if (details.accountNumber && details.accountHolderName) {
        // Handle bank account details
        if (details.type === 'bank') {
            return `
                <div class="alert alert-info mt-2 mb-2">
                    <h6 class="alert-heading font-weight-bold">Bank Account Details</h6>
                    <p class="mb-1"><strong>Account Number:</strong> ${details.accountNumber}</p>
                    <p class="mb-1"><strong>Account Holder:</strong> ${details.accountHolderName}</p>
                    ${details.bankName ? `<p class="mb-1"><strong>Bank Name:</strong> ${details.bankName}</p>` : ''}
                </div>
            `;
        }
        
        // Handle mobile wallet details
        if (details.type === 'mobile') {
            return `
                <div class="alert alert-info mt-2 mb-2">
                    <h6 class="alert-heading font-weight-bold">${getMethodName(request.method)} Details</h6>
                    <p class="mb-1"><strong>Account Number:</strong> ${details.accountNumber}</p>
                    <p class="mb-1"><strong>Account Holder:</strong> ${details.accountHolderName}</p>
                </div>
            `;
        }
    }
    
    // Handle old mobile wallet format
    if (details.type === 'mobile' && details.mobileNumber) {
        return `
            <div class="alert alert-info mt-2 mb-2">
                <h6 class="alert-heading font-weight-bold">${getMethodName(request.method)} Details</h6>
                <p class="mb-1"><strong>Mobile Number:</strong> ${details.mobileNumber}</p>
            </div>
        `;
    }
    
    // For old bank account format
    if (details.type === 'bank' && details.accountNumber && !details.accountHolderName) {
        return `
            <div class="alert alert-info mt-2 mb-2">
                <h6 class="alert-heading font-weight-bold">Bank Account Details</h6>
                <p class="mb-1"><strong>Account Number:</strong> ${details.accountNumber}</p>
                ${details.bankName ? `<p class="mb-1"><strong>Bank Name:</strong> ${details.bankName}</p>` : ''}
            </div>
        `;
    }
    
    // For old format or text format with account field
    if (request.account) {
        return `<p><strong>Account Details:</strong> ${request.account}</p>`;
    }
    
    // For old format or text format with accountDetails as string
    if (typeof details === 'string') {
        return `<p><strong>Account Details:</strong> ${details}</p>`;
    }
    
    // For any other format, just display what we have
    return `
        <div class="alert alert-info mt-2 mb-2">
            <h6 class="alert-heading font-weight-bold">Account Details</h6>
            ${Object.entries(details).map(([key, value]) => 
                `<p class="mb-1"><strong>${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:</strong> ${value}</p>`
            ).join('')}
        </div>
    `;
}

/**
 * Filter requests based on search term
 */
function filterRequests(searchTerm) {
    if (!searchTerm) {
        renderDepositRequests(depositRequests);
        renderWithdrawalRequests(withdrawalRequests);
        return;
    }
    
    // Filter deposit requests
    const filteredDepositRequests = depositRequests.filter(request => {
        return (
            request.id.toLowerCase().includes(searchTerm) ||
            request.userName.toLowerCase().includes(searchTerm) ||
            request.userEmail.toLowerCase().includes(searchTerm) ||
            getMethodName(request.method).toLowerCase().includes(searchTerm)
        );
    });
    renderDepositRequests(filteredDepositRequests);
    
    // Filter withdrawal requests
    const filteredWithdrawalRequests = withdrawalRequests.filter(request => {
        return (
            request.id.toLowerCase().includes(searchTerm) ||
            request.userName.toLowerCase().includes(searchTerm) ||
            request.userEmail.toLowerCase().includes(searchTerm) ||
            getMethodName(request.method).toLowerCase().includes(searchTerm)
        );
    });
    renderWithdrawalRequests(filteredWithdrawalRequests);
}

/**
 * View deposit request details
 */
function viewDepositDetails(requestId) {
    const request = depositRequests.find(req => req.id === requestId);
    if (!request) return;
    
    // Determine creation timestamp
    const createdAt = request.createdAt || request.timestamp || new Date().toISOString();
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'request-details-modal';
    modal.setAttribute('tabindex', '-1');
    
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Deposit Request Details</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="card mb-3">
                        <div class="card-header bg-primary text-white">
                            Request Information
                        </div>
                        <div class="card-body">
                            <p><strong>Request ID:</strong> ${request.id}</p>
                            <p><strong>Status:</strong> <span class="badge ${getStatusClass(request.status)}">${request.status.toUpperCase()}</span></p>
                            <p><strong>Date:</strong> ${new Date(createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                    
                    <div class="card mb-3">
                        <div class="card-header bg-primary text-white">
                            User Information
                        </div>
                        <div class="card-body">
                            <p><strong>Name:</strong> ${request.userName}</p>
                            <p><strong>Email:</strong> ${request.userEmail || 'Not provided'}</p>
                            <p><strong>User ID:</strong> ${request.userId}</p>
                        </div>
                    </div>
                    
                    <div class="card mb-3">
                        <div class="card-header bg-primary text-white">
                            Payment Information
                        </div>
                        <div class="card-body">
                            <p><strong>Amount:</strong> PKR ${request.amount.toFixed(2)}</p>
                            <p><strong>Method:</strong> ${getMethodName(request.method)}</p>
                            
                            <div class="alert alert-info mt-2 mb-2">
                                <h6 class="alert-heading font-weight-bold">Account Details</h6>
                                ${request.accountName ? `<p class="mb-1"><strong>Account Holder Name:</strong> ${request.accountName}</p>` : ''}
                                ${request.accountNumber ? `<p class="mb-1"><strong>Account Number:</strong> ${request.accountNumber}</p>` : ''}
                                ${!request.accountName && !request.accountNumber ? renderAccountDetails(request) : ''}
                            </div>
                            
                            ${request.notes ? `<p><strong>Notes:</strong> ${request.notes}</p>` : ''}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    modal.addEventListener('hidden.bs.modal', function () {
        modal.remove();
    });
}

/**
 * View withdrawal request details
 */
function viewWithdrawalDetails(requestId) {
    const request = withdrawalRequests.find(req => req.id === requestId);
    if (!request) return;
    
    // Determine creation timestamp
    const createdAt = request.createdAt || request.timestamp || new Date().toISOString();
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'request-details-modal';
    modal.setAttribute('tabindex', '-1');
    
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Withdrawal Request Details</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="card mb-3">
                        <div class="card-header bg-primary text-white">
                            Request Information
                        </div>
                        <div class="card-body">
                            <p><strong>Request ID:</strong> ${request.id}</p>
                            <p><strong>Status:</strong> <span class="badge ${getStatusClass(request.status)}">${request.status.toUpperCase()}</span></p>
                            <p><strong>Date:</strong> ${new Date(createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                    
                    <div class="card mb-3">
                        <div class="card-header bg-primary text-white">
                            User Information
                        </div>
                        <div class="card-body">
                            <p><strong>Name:</strong> ${request.userName}</p>
                            <p><strong>Email:</strong> ${request.userEmail || 'Not provided'}</p>
                            <p><strong>User ID:</strong> ${request.userId}</p>
                        </div>
                    </div>
                    
                    <div class="card mb-3">
                        <div class="card-header bg-primary text-white">
                            Withdrawal Information
                        </div>
                        <div class="card-body">
                            <p><strong>Amount:</strong> PKR ${request.amount.toFixed(2)}</p>
                            <p><strong>Method:</strong> ${getMethodName(request.method)}</p>
                            
                            <div class="alert alert-info mt-2 mb-2">
                                <h6 class="alert-heading font-weight-bold">Account Details</h6>
                                ${request.accountName ? `<p class="mb-1"><strong>Account Holder Name:</strong> ${request.accountName}</p>` : ''}
                                ${request.accountNumber ? `<p class="mb-1"><strong>Account Number:</strong> ${request.accountNumber}</p>` : ''}
                                ${!request.accountName && !request.accountNumber ? renderAccountDetails(request) : ''}
                            </div>
                            
                            ${request.additionalNotes ? `<p><strong>Additional Notes:</strong> ${request.additionalNotes}</p>` : ''}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    modal.addEventListener('hidden.bs.modal', function () {
        modal.remove();
    });
}

/**
 * Approve a deposit request
 */
function approveDepositRequest(requestId) {
    const requestObj = depositRequests.find(req => req.id === requestId);
    if (!requestObj) return;
    
    // Format account details for confirmation
    let accountDetailsText = '';
    if (requestObj.accountName) {
        accountDetailsText += `\nAccount Holder: ${requestObj.accountName}`;
    }
    if (requestObj.accountNumber) {
        accountDetailsText += `\nAccount Number: ${requestObj.accountNumber}`;
    }
    
    if (!confirm(`Are you sure you want to approve this deposit request?\n\nAmount: PKR ${requestObj.amount.toFixed(2)}\nMethod: ${getMethodName(requestObj.method)}\nUser: ${requestObj.userName}${accountDetailsText}`)) {
        return;
    }
    
    const requestIndex = depositRequests.findIndex(req => req.id === requestId);
    if (requestIndex === -1) return;
    
    const request = depositRequests[requestIndex];
    
    // Update request status
    request.status = 'approved';
    request.processedAt = Date.now();
    
    // Update user's wallet
    const walletKey = `wallet_${request.userId}`;
    const walletData = JSON.parse(localStorage.getItem(walletKey)) || {
        balance: 0,
        transactions: [],
        rewards: []
    };
    
    // Add the deposit amount to the wallet balance
    walletData.balance += request.amount;
    
    // Add transaction record
    walletData.transactions.unshift({
        id: 'TXN_' + Date.now(),
        type: 'deposit',
        amount: request.amount,
        description: `Deposit via ${getMethodName(request.method)} approved by admin`,
        date: new Date().toISOString(),
        status: 'completed',
        requestId: request.id
    });
    
    // Save wallet data
    localStorage.setItem(walletKey, JSON.stringify(walletData));
    
    // Update deposit requests in localStorage
    depositRequests[requestIndex] = request;
    localStorage.setItem('depositRequests', JSON.stringify(depositRequests));
    
    // Add notification for admin
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    notifications.unshift({
        message: `Deposit of PKR ${request.amount.toFixed(2)} approved for ${request.userName}`,
        icon: 'fa-money-bill-wave',
        timestamp: new Date().toISOString(),
        type: 'wallet',
        userId: request.userId
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    // Add user notification
    const userNotificationsKey = `notifications_${request.userId}`;
    const userNotifications = JSON.parse(localStorage.getItem(userNotificationsKey)) || [];
    userNotifications.unshift({
        id: 'NOTIF_' + Date.now(),
        title: 'Deposit Request Approved',
        message: `Your deposit request for PKR ${request.amount.toFixed(2)} via ${getMethodName(request.method)} has been approved. Your wallet has been credited.`,
        icon: 'fa-check-circle',
        type: 'wallet',
        status: 'unread',
        timestamp: new Date().toISOString()
    });
    localStorage.setItem(userNotificationsKey, JSON.stringify(userNotifications));
    
    // Refresh the table
    renderDepositRequests(depositRequests);
    
    // Show success message
    alert(`Deposit request approved. PKR ${request.amount.toFixed(2)} has been added to ${request.userName}'s wallet.`);
}

/**
 * Reject a deposit request
 */
function rejectDepositRequest(requestId) {
    const requestObj = depositRequests.find(req => req.id === requestId);
    if (!requestObj) return;
    
    // Format account details for confirmation
    let accountDetailsText = '';
    if (requestObj.accountName) {
        accountDetailsText += `\nAccount Holder: ${requestObj.accountName}`;
    }
    if (requestObj.accountNumber) {
        accountDetailsText += `\nAccount Number: ${requestObj.accountNumber}`;
    }
    
    if (!confirm(`Are you sure you want to reject this deposit request?\n\nAmount: PKR ${requestObj.amount.toFixed(2)}\nMethod: ${getMethodName(requestObj.method)}\nUser: ${requestObj.userName}${accountDetailsText}`)) {
        return;
    }
    
    const requestIndex = depositRequests.findIndex(req => req.id === requestId);
    if (requestIndex === -1) return;
    
    const request = depositRequests[requestIndex];
    
    // Update request status
    request.status = 'rejected';
    request.processedAt = Date.now();
    
    // Update deposit requests in localStorage
    depositRequests[requestIndex] = request;
    localStorage.setItem('depositRequests', JSON.stringify(depositRequests));
    
    // Add notification for admin
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    notifications.unshift({
        message: `Deposit request from ${request.userName} for PKR ${request.amount.toFixed(2)} was rejected`,
        icon: 'fa-times-circle',
        timestamp: new Date().toISOString(),
        type: 'wallet',
        userId: request.userId
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    // Add user notification
    const userNotificationsKey = `notifications_${request.userId}`;
    const userNotifications = JSON.parse(localStorage.getItem(userNotificationsKey)) || [];
    userNotifications.unshift({
        id: 'NOTIF_' + Date.now(),
        title: 'Deposit Request Rejected',
        message: `Your deposit request for PKR ${request.amount.toFixed(2)} via ${getMethodName(request.method)} has been rejected.`,
        icon: 'fa-times-circle',
        type: 'wallet',
        status: 'unread',
        timestamp: new Date().toISOString()
    });
    localStorage.setItem(userNotificationsKey, JSON.stringify(userNotifications));
    
    // Add transaction record for rejection
    const walletKey = `wallet_${request.userId}`;
    const walletData = JSON.parse(localStorage.getItem(walletKey)) || {
        balance: 0,
        transactions: [],
        rewards: []
    };
    
    // Add transaction record without changing balance
    walletData.transactions.unshift({
        id: 'TXN_' + Date.now(),
        type: 'deposit_rejected',
        amount: 0,
        description: `Deposit request via ${getMethodName(request.method)} was rejected`,
        date: new Date().toISOString(),
        status: 'rejected',
        requestId: request.id
    });
    
    // Save wallet data
    localStorage.setItem(walletKey, JSON.stringify(walletData));
    
    // Refresh the table
    renderDepositRequests(depositRequests);
    
    // Show success message
    alert(`Deposit request rejected. A notification has been sent to the user.`);
}

/**
 * Approve a withdrawal request
 */
function approveWithdrawalRequest(requestId) {
    const requestObj = withdrawalRequests.find(req => req.id === requestId);
    if (!requestObj) return;
    
    // Format account details for confirmation
    let accountDetailsText = '';
    
    // Check for new format first
    if (requestObj.accountName) {
        accountDetailsText += `\nAccount Holder: ${requestObj.accountName}`;
    }
    if (requestObj.accountNumber) {
        accountDetailsText += `\nAccount Number: ${requestObj.accountNumber}`;
    }
    
    // Fall back to old format if needed
    if (!accountDetailsText && requestObj.accountDetails) {
        const details = requestObj.accountDetails;
        if (details.accountNumber) {
            accountDetailsText += `\nAccount Number: ${details.accountNumber}`;
        }
        if (details.accountHolderName) {
            accountDetailsText += `\nAccount Holder: ${details.accountHolderName}`;
        }
        if (details.bankName) {
            accountDetailsText += `\nBank Name: ${details.bankName}`;
        }
        // For backward compatibility with older format
        if (details.mobileNumber) {
            accountDetailsText += `\nMobile Number: ${details.mobileNumber}`;
        }
    }
    
    if (!confirm(`Are you sure you want to approve this withdrawal request?\n\nAmount: PKR ${requestObj.amount.toFixed(2)}\nMethod: ${getMethodName(requestObj.method)}${accountDetailsText}\n\nThis will deduct funds from the user's wallet.`)) {
        return;
    }
    
    const requestIndex = withdrawalRequests.findIndex(req => req.id === requestId);
    if (requestIndex === -1) return;
    
    const request = withdrawalRequests[requestIndex];
    
    // Update request status
    request.status = 'approved';
    request.processedAt = Date.now();
    
    // Update user's wallet
    const walletKey = `wallet_${request.userId}`;
    const walletData = JSON.parse(localStorage.getItem(walletKey)) || {
        balance: 0,
        transactions: [],
        rewards: []
    };
    
    // Check if user has sufficient funds
    if (walletData.balance < request.amount) {
        alert(`Error: User does not have sufficient funds. Current balance: PKR ${walletData.balance.toFixed(2)}`);
        return;
    }
    
    // Deduct the withdrawal amount from the wallet balance
    walletData.balance -= request.amount;
    
    // Add transaction record
    walletData.transactions.unshift({
        id: 'TXN_' + Date.now(),
        type: 'withdrawal',
        amount: -request.amount, // Negative amount for withdrawal
        description: `Withdrawal via ${getMethodName(request.method)} approved by admin`,
        date: new Date().toISOString(),
        status: 'completed',
        requestId: request.id
    });
    
    // Save wallet data
    localStorage.setItem(walletKey, JSON.stringify(walletData));
    
    // Update withdrawal requests in localStorage
    withdrawalRequests[requestIndex] = request;
    localStorage.setItem('withdrawalRequests', JSON.stringify(withdrawalRequests));
    
    // Add notification for admin
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    notifications.unshift({
        message: `Withdrawal of PKR ${request.amount.toFixed(2)} approved for ${request.userName}`,
        icon: 'fa-money-bill-wave',
        timestamp: new Date().toISOString(),
        type: 'wallet',
        userId: request.userId
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    // Add user notification
    const userNotificationsKey = `notifications_${request.userId}`;
    const userNotifications = JSON.parse(localStorage.getItem(userNotificationsKey)) || [];
    userNotifications.unshift({
        id: 'NOTIF_' + Date.now(),
        title: 'Withdrawal Request Approved',
        message: `Your withdrawal request for PKR ${request.amount.toFixed(2)} via ${getMethodName(request.method)} has been approved. The funds have been deducted from your wallet.`,
        icon: 'fa-check-circle',
        type: 'wallet',
        status: 'unread',
        timestamp: new Date().toISOString()
    });
    localStorage.setItem(userNotificationsKey, JSON.stringify(userNotifications));
    
    // Refresh the table
    renderWithdrawalRequests(withdrawalRequests);
    
    // Show success message
    alert(`Withdrawal request approved. PKR ${request.amount.toFixed(2)} has been deducted from ${request.userName}'s wallet.`);
}

/**
 * Reject a withdrawal request
 */
function rejectWithdrawalRequest(requestId) {
    const requestObj = withdrawalRequests.find(req => req.id === requestId);
    if (!requestObj) return;
    
    // Format account details for confirmation
    let accountDetailsText = '';
    
    // Check for new format first
    if (requestObj.accountName) {
        accountDetailsText += `\nAccount Holder: ${requestObj.accountName}`;
    }
    if (requestObj.accountNumber) {
        accountDetailsText += `\nAccount Number: ${requestObj.accountNumber}`;
    }
    
    // Fall back to old format if needed
    if (!accountDetailsText && requestObj.accountDetails) {
        const details = requestObj.accountDetails;
        if (details.accountNumber) {
            accountDetailsText += `\nAccount Number: ${details.accountNumber}`;
        }
        if (details.accountHolderName) {
            accountDetailsText += `\nAccount Holder: ${details.accountHolderName}`;
        }
    }
    
    if (!confirm(`Are you sure you want to reject this withdrawal request?\n\nAmount: PKR ${requestObj.amount.toFixed(2)}\nMethod: ${getMethodName(requestObj.method)}${accountDetailsText}`)) {
        return;
    }
    
    const requestIndex = withdrawalRequests.findIndex(req => req.id === requestId);
    if (requestIndex === -1) return;
    
    const request = withdrawalRequests[requestIndex];
    
    // Update request status
    request.status = 'rejected';
    request.processedAt = Date.now();
    
    // Update withdrawal requests in localStorage
    withdrawalRequests[requestIndex] = request;
    localStorage.setItem('withdrawalRequests', JSON.stringify(withdrawalRequests));
    
    // Add notification for admin
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    notifications.unshift({
        message: `Withdrawal request from ${request.userName} for PKR ${request.amount.toFixed(2)} was rejected`,
        icon: 'fa-times-circle',
        timestamp: new Date().toISOString(),
        type: 'wallet',
        userId: request.userId
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    // Add user notification
    const userNotificationsKey = `notifications_${request.userId}`;
    const userNotifications = JSON.parse(localStorage.getItem(userNotificationsKey)) || [];
    userNotifications.unshift({
        id: 'NOTIF_' + Date.now(),
        title: 'Withdrawal Request Rejected',
        message: `Your withdrawal request for PKR ${request.amount.toFixed(2)} via ${getMethodName(request.method)} has been rejected.`,
        icon: 'fa-times-circle',
        type: 'wallet',
        status: 'unread',
        timestamp: new Date().toISOString()
    });
    localStorage.setItem(userNotificationsKey, JSON.stringify(userNotifications));
    
    // Add transaction record for rejection
    const walletKey = `wallet_${request.userId}`;
    const walletData = JSON.parse(localStorage.getItem(walletKey)) || {
        balance: 0,
        transactions: [],
        rewards: []
    };
    
    // Add transaction record without changing balance
    walletData.transactions.unshift({
        id: 'TXN_' + Date.now(),
        type: 'withdrawal_rejected',
        amount: 0,
        description: `Withdrawal request via ${getMethodName(request.method)} was rejected`,
        date: new Date().toISOString(),
        status: 'rejected',
        requestId: request.id
    });
    
    // Save wallet data
    localStorage.setItem(walletKey, JSON.stringify(walletData));
    
    // Refresh the table
    renderWithdrawalRequests(withdrawalRequests);
    
    // Show success message
    alert(`Withdrawal request rejected. A notification has been sent to the user.`);
}
