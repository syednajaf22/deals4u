/**
 * User Rewards Management for Admin Panel
 * Integrates with the existing wallet system
 */

// Load the rewards section when it's selected
document.addEventListener('DOMContentLoaded', function() {
    // Set up event handlers for the rewards section
    const addRewardForm = document.getElementById('add-reward-form');
    const bulkRewardForm = document.getElementById('bulk-reward-form');
    const rewardsSearch = document.getElementById('rewards-search');
    
    if (addRewardForm) {
        addRewardForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addUserReward();
        });
    }
    
    if (bulkRewardForm) {
        bulkRewardForm.addEventListener('submit', function(e) {
            e.preventDefault();
            sendBulkRewards();
        });
    }
    
    if (rewardsSearch) {
        rewardsSearch.addEventListener('input', function() {
            searchUserRewards();
        });
    }
    
    // Set up tabs event listeners
    const rewardsTabs = document.querySelectorAll('button[data-bs-toggle="tab"]');
    rewardsTabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(e) {
            if (e.target.id === 'bulk-rewards-tab') {
                populateBulkRewardUsersList();
            }
        });
    });
});

/**
 * Load rewards management section and populate user dropdown
 */
function loadUserRewards() {
    console.log('Loading user rewards section');
    
    // Show the section
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('user-rewards').classList.add('active');
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar nav a').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector('.sidebar nav a[href="#user-rewards"]').classList.add('active');
    
    // Populate user dropdown
    populateUserDropdown();
    
    // Load users list
    refreshUsersList();
    
    // Load rewards list
    loadAllRewards();
}

/**
 * Populate user dropdown
 */
function populateUserDropdown() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userDropdown = document.getElementById('reward-user');
    
    if (!userDropdown) return;
    
    // Clear existing options except the first one
    while (userDropdown.options.length > 1) {
        userDropdown.remove(1);
    }
    
    // Sort users by name
    users.sort((a, b) => a.name.localeCompare(b.name));
    
    // Add users to dropdown
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.name} (${user.email})`;
        userDropdown.appendChild(option);
    });
}

/**
 * Load all rewards
 */
function loadAllRewards() {
    const rewardsList = document.getElementById('rewards-list');
    const rewardsSection = document.getElementById('rewards-section');
    if (!rewardsList) return;
    
    // Add a button to mark all rewards as expired
    if (rewardsSection) {
        // Check if the button already exists
        if (!document.getElementById('mark-all-expired-btn')) {
            const actionsDiv = rewardsSection.querySelector('.card-header .d-flex.justify-content-between');
            
            if (actionsDiv) {
                const bulkActionButton = document.createElement('button');
                bulkActionButton.id = 'mark-all-expired-btn';
                bulkActionButton.className = 'btn btn-warning ms-2';
                bulkActionButton.innerHTML = '<i class="fas fa-calendar-times me-1"></i> Mark All Expired';
                bulkActionButton.onclick = confirmMarkAllRewardsExpired;
                
                actionsDiv.appendChild(bulkActionButton);
            }
        }
    }
    
    // Collect all rewards from all users
    const users = JSON.parse(localStorage.getItem('users')) || [];
    let allRewards = [];
    
    users.forEach(user => {
        const walletKey = `wallet_${user.id}`;
        const walletData = JSON.parse(localStorage.getItem(walletKey)) || { rewards: [] };
        
        if (walletData.rewards && walletData.rewards.length > 0) {
            // Add user info to each reward
            const userRewards = walletData.rewards.map(reward => ({
                ...reward,
                userName: user.name,
                userEmail: user.email,
                userId: user.id
            }));
            
            allRewards = [...allRewards, ...userRewards];
        }
    });
    
    // Sort rewards by date (newest first)
    allRewards.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (allRewards.length === 0) {
        rewardsList.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <i class="fas fa-gift text-muted fa-2x mb-3"></i>
                    <p>No rewards found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Generate HTML for rewards list
    let rewardsHTML = '';
    
    allRewards.forEach((reward, index) => {
        // Check if reward is expired
        const isRewardExpired = (reward.expiryDate || reward.expires) ? 
            (new Date() > new Date(reward.expiryDate || reward.expires)) : false;
        
        // Determine status and format dates
        let status, statusClass;
        
        if (reward.isPending) {
            status = 'Pending';
            statusClass = 'bg-warning';
        } else if (reward.isUsed) {
            status = 'Completed';
            statusClass = 'bg-secondary';
        } else if (isRewardExpired) {
            status = 'Expired';
            statusClass = 'bg-danger';
        } else {
            status = 'Available';
            statusClass = 'bg-success';
        }
        
        const formattedDate = new Date(reward.date).toLocaleString();
        
        // Format expiry date if it exists
        const hasExpiry = (reward.expiryDate || reward.expires) ? true : false;
        const expiryDate = hasExpiry ? new Date(reward.expiryDate || reward.expires).toLocaleDateString() : 'No expiry';
        const expiryBadgeClass = isRewardExpired ? 'bg-danger' : 'bg-warning text-dark';
        const expiryIcon = isRewardExpired ? 'fa-calendar-times' : 'fa-clock';
        const expiryText = isRewardExpired ? `Expired on ${expiryDate}` : `Expires on ${expiryDate}`;
        const expiryBadge = hasExpiry ? `<span class="badge ${expiryBadgeClass} ms-1" title="${expiryText}"><i class="fas ${expiryIcon} me-1"></i> ${expiryDate}</span>` : '';
        
        rewardsHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div>
                            <div class="fw-bold">${reward.userName}</div>
                            <div class="small text-muted">${reward.userEmail}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div>${reward.title}</div>
                    ${expiryBadge}
                </td>
                <td>
                    <div class="fw-bold text-success fs-5">PKR ${reward.amount.toFixed(2)}</div>
                </td>
                <td>${formattedDate}</td>
                <td><span class="badge ${statusClass}">${status}</span></td>
                <td>
                    <button class="btn btn-sm btn-info me-1" onclick="viewRewardDetails('${reward.id}', '${reward.userId}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${!reward.isUsed ? 
                        `<button class="btn btn-sm btn-danger" onclick="deleteReward('${reward.id}', '${reward.userId}')">
                            <i class="fas fa-trash"></i>
                        </button>` : 
                        ''}
                </td>
            </tr>
        `;
    });
    
    rewardsList.innerHTML = rewardsHTML;
}

/**
 * Refresh users list for quick selection
 */
function refreshUsersList() {
    const usersList = document.getElementById('users-list');
    if (!usersList) return;
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    if (users.length === 0) {
        usersList.innerHTML = '<div class="alert alert-info w-100 mb-0">No users found</div>';
        document.getElementById('send-to-selected-btn').disabled = true;
        return;
    }
    
    // Sort users by name
    users.sort((a, b) => a.name.localeCompare(b.name));
    
    // Generate HTML for users list with checkboxes
    let usersHTML = '';
    
    users.forEach(user => {
        // Get user wallet to show rewards count
        const walletKey = `wallet_${user.id}`;
        const walletData = JSON.parse(localStorage.getItem(walletKey)) || { rewards: [] };
        const rewardsCount = walletData.rewards ? walletData.rewards.length : 0;
        const activeRewards = walletData.rewards ? walletData.rewards.filter(r => !r.isUsed).length : 0;
        
        usersHTML += `
            <div class="user-list-item border-bottom py-2">
                <div class="d-flex align-items-center">
                    <div class="form-check">
                        <input class="form-check-input user-list-checkbox" type="checkbox" value="${user.id}" 
                            id="user-list-${user.id}" data-user-name="${user.name}">
                    </div>
                    <div class="ms-3 flex-grow-1">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${user.name}</strong>
                                <div class="small text-muted">${user.email || 'No email'}</div>
                            </div>
                            <div class="text-end">
                                <span class="badge bg-${activeRewards > 0 ? 'success' : 'secondary'} rounded-pill">
                                    ${activeRewards} active
                                </span>
                                <span class="badge bg-light text-dark border rounded-pill">
                                    ${rewardsCount} total
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    usersList.innerHTML = usersHTML;
    
    // Add event listeners to checkboxes
    document.querySelectorAll('.user-list-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateQuickSelectedUsersCount);
    });
    
    // Update selected count
    updateQuickSelectedUsersCount();
    
    // Add search functionality
    const searchInput = document.getElementById('user-search');
    if (searchInput) {
        searchInput.addEventListener('input', filterUsersList);
    }
}

/**
 * Filter users list based on search input
 */
function filterUsersList() {
    const searchTerm = document.getElementById('user-search').value.toLowerCase().trim();
    const userItems = document.querySelectorAll('.user-list-item');
    
    userItems.forEach(item => {
        const userName = item.querySelector('strong').textContent.toLowerCase();
        const userEmail = item.querySelector('.text-muted').textContent.toLowerCase();
        
        if (userName.includes(searchTerm) || userEmail.includes(searchTerm) || searchTerm === '') {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

/**
 * Update the count of selected users in the quick selection panel
 */
function updateQuickSelectedUsersCount() {
    const selectedCount = document.querySelectorAll('.user-list-checkbox:checked').length;
    const countElement = document.getElementById('quick-selected-count');
    const sendButton = document.getElementById('send-to-selected-btn');
    
    if (countElement) {
        countElement.textContent = selectedCount;
        
        // Change color based on selection
        if (selectedCount > 0) {
            countElement.classList.remove('bg-secondary');
            countElement.classList.add('bg-primary');
            if (sendButton) {
                sendButton.disabled = false;
            }
        } else {
            countElement.classList.remove('bg-primary');
            countElement.classList.add('bg-secondary');
            if (sendButton) {
                sendButton.disabled = true;
            }
        }
    }
}

/**
 * Select all users from the list
 */
function selectAllUsersFromList() {
    document.querySelectorAll('.user-list-checkbox').forEach(checkbox => {
        checkbox.checked = true;
    });
    updateQuickSelectedUsersCount();
}

/**
 * Deselect all users from the list
 */
function deselectAllUsersFromList() {
    document.querySelectorAll('.user-list-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    updateQuickSelectedUsersCount();
}

/**
 * Open modal to send reward to selected users
 */
function sendRewardToSelectedUsers() {
    // Get selected users
    const selectedUsers = Array.from(document.querySelectorAll('.user-list-checkbox:checked')).map(checkbox => {
        return {
            id: checkbox.value,
            name: checkbox.getAttribute('data-user-name')
        };
    });
    
    if (selectedUsers.length === 0) {
        alert('Please select at least one user to send rewards to');
        return;
    }
    
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="quickRewardModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">Send Reward to ${selectedUsers.length} Users</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="quick-reward-form">
                            <div class="mb-3">
                                <label class="form-label">Selected Users</label>
                                <div class="border rounded p-2 bg-light">
                                    <div class="d-flex flex-wrap gap-1">
                                        ${selectedUsers.map(user => `
                                            <span class="badge bg-primary text-white rounded-pill px-2 py-1">
                                                ${user.name}
                                            </span>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="quick-reward-title" class="form-label">Reward Title</label>
                                <input type="text" id="quick-reward-title" class="form-control" required placeholder="e.g., Loyalty Bonus, Special Offer">
                            </div>
                            <div class="mb-3">
                                <label for="quick-reward-amount" class="form-label">Reward Amount (PKR)</label>
                                <input type="number" id="quick-reward-amount" class="form-control" required min="1" step="1" placeholder="Enter amount in PKR">
                            </div>
                            <div class="mb-3">
                                <label for="quick-reward-description" class="form-label">Description</label>
                                <textarea id="quick-reward-description" class="form-control" rows="3" placeholder="Enter details about this reward"></textarea>
                            </div>
                            <div class="mb-3">
                                <label for="quick-reward-expiry" class="form-label">Expiry Date (Optional)</label>
                                <input type="date" id="quick-reward-expiry" class="form-control">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="confirmQuickRewards()">Send Rewards</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to document
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    // Show modal
    const modalElement = document.getElementById('quickRewardModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    
    // Store the selected users in a global variable for later use
    window.selectedUsersForReward = selectedUsers;
    
    // Remove modal from DOM when hidden
    modalElement.addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(modalContainer);
    });
}

/**
 * Confirm and send rewards to selected users from quick selection
 */
function confirmQuickRewards() {
    // Get selected users from global variable
    const selectedUsers = window.selectedUsersForReward || [];
    
    if (selectedUsers.length === 0) {
        alert('No users selected');
        return;
    }
    
    // Get reward details
    const title = document.getElementById('quick-reward-title').value.trim();
    const amount = parseFloat(document.getElementById('quick-reward-amount').value);
    const description = document.getElementById('quick-reward-description').value.trim();
    const expiryDate = document.getElementById('quick-reward-expiry').value;
    
    if (!title) {
        alert('Please enter a reward title');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    // Create base reward object
    const baseReward = {
        title: title,
        amount: amount,
        description: description || `Reward: ${title}`,
        date: new Date().toISOString(),
        isUsed: false,
        expiryDate: expiryDate || null
    };
    
    // Keep track of successful sends
    let successCount = 0;
    let usersList = '';
    
    // Send reward to each selected user
    selectedUsers.forEach(user => {
        // Generate unique ID for each user's reward
        const reward = {
            ...baseReward,
            id: 'reward_quick_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
        };
        
        // Add reward to user's wallet
        const walletKey = `wallet_${user.id}`;
        const walletData = JSON.parse(localStorage.getItem(walletKey)) || {
            balance: 0,
            transactions: [],
            rewards: [],
            notifications: []
        };
        
        // Add reward to wallet
        if (!walletData.rewards) {
            walletData.rewards = [];
        }
        
        walletData.rewards.unshift(reward);
        localStorage.setItem(walletKey, JSON.stringify(walletData));
        
        // Send notification to user
        const notification = {
            id: 'notif_reward_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            title: 'New Reward Added',
            message: `You have received a new reward: ${title} worth PKR ${amount.toFixed(2)}`,
            timestamp: new Date().toISOString(),
            status: 'unread',
            type: 'reward',
            fromAdmin: true
        };
        
        // Add notification to user's notifications
        const notificationsKey = `notifications_${user.id}`;
        const notifications = JSON.parse(localStorage.getItem(notificationsKey)) || [];
        notifications.unshift(notification);
        localStorage.setItem(notificationsKey, JSON.stringify(notifications));
        
        successCount++;
        usersList += `<li>${user.name}</li>`;
    });
    
    // Add to admin notifications
    const adminNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
    adminNotifications.unshift({
        message: `Quick reward '${title}' (PKR ${amount.toFixed(2)}) sent to ${successCount} users`,
        timestamp: new Date().toISOString(),
        type: 'reward',
        icon: 'fa-gift',
        admin: sessionStorage.getItem('adminName') || 'Admin'
    });
    localStorage.setItem('notifications', JSON.stringify(adminNotifications));
    
    // Close the modal
    const modalElement = document.getElementById('quickRewardModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
    }
    
    // Show success message
    alert(`Rewards sent successfully to ${successCount} users!`);
    
    // Show more detailed success message
    const successModal = `
        <div class="modal fade" id="quickRewardSuccessModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">Rewards Sent Successfully</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="text-center mb-3">
                            <i class="fas fa-check-circle text-success fa-3x mb-3"></i>
                            <h4>Success!</h4>
                            <p>Reward "${title}" worth PKR ${amount.toFixed(2)} has been sent to ${successCount} users.</p>
                        </div>
                        <div class="mb-3">
                            <h6>Recipients:</h6>
                            <ul class="small">${usersList}</ul>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to document
    const successModalContainer = document.createElement('div');
    successModalContainer.innerHTML = successModal;
    document.body.appendChild(successModalContainer);
    
    // Show modal
    const successModalElement = document.getElementById('quickRewardSuccessModal');
    const successModalInstance = new bootstrap.Modal(successModalElement);
    successModalInstance.show();
    
    // Remove modal from DOM when hidden
    successModalElement.addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(successModalContainer);
    });
    
    // Clear selections and refresh the users list
    deselectAllUsersFromList();
    refreshUsersList();
    
    // Refresh rewards list
    loadAllRewards();
}

/**
 * Populate users list for bulk rewards
 */
function populateBulkRewardUsersList() {
    const usersList = document.getElementById('bulk-reward-users-list');
    if (!usersList) return;
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    if (users.length === 0) {
        usersList.innerHTML = '<div class="alert alert-info w-100 mb-0">No users found</div>';
        return;
    }
    
    // Sort users by name
    users.sort((a, b) => a.name.localeCompare(b.name));
    
    // Generate HTML for users
    let usersHTML = '';
    
    users.forEach(user => {
        usersHTML += `
            <div class="form-check form-check-inline user-check-item mb-2">
                <input class="form-check-input bulk-reward-user-checkbox" type="checkbox" value="${user.id}" id="bulk-reward-user-${user.id}" data-user-name="${user.name}">
                <label class="form-check-label" for="bulk-reward-user-${user.id}">
                    ${user.name}
                </label>
            </div>
        `;
    });
    
    usersList.innerHTML = usersHTML;
    
    // Add event listeners to checkboxes
    document.querySelectorAll('.bulk-reward-user-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedUsersCount);
    });
    
    // Update selected count
    updateSelectedUsersCount();
}

/**
 * Update the count of selected users
 */
function updateSelectedUsersCount() {
    const selectedCount = document.querySelectorAll('.bulk-reward-user-checkbox:checked').length;
    const countElement = document.getElementById('selected-users-count');
    
    if (countElement) {
        countElement.textContent = selectedCount;
        
        // Change color based on selection
        if (selectedCount > 0) {
            countElement.classList.remove('bg-secondary');
            countElement.classList.add('bg-primary');
        } else {
            countElement.classList.remove('bg-primary');
            countElement.classList.add('bg-secondary');
        }
    }
}

/**
 * Select all users for bulk rewards
 */
function selectAllUsers(prefix) {
    document.querySelectorAll(`.${prefix}-user-checkbox`).forEach(checkbox => {
        checkbox.checked = true;
    });
    updateSelectedUsersCount();
}

/**
 * Deselect all users for bulk rewards
 */
function deselectAllUsers(prefix) {
    document.querySelectorAll(`.${prefix}-user-checkbox`).forEach(checkbox => {
        checkbox.checked = false;
    });
    updateSelectedUsersCount();
}

/**
 * Send bulk rewards to multiple users
 */
function sendBulkRewards() {
    // Get selected users
    const selectedUsers = Array.from(document.querySelectorAll('.bulk-reward-user-checkbox:checked')).map(checkbox => {
        return {
            id: checkbox.value,
            name: checkbox.getAttribute('data-user-name')
        };
    });
    
    if (selectedUsers.length === 0) {
        alert('Please select at least one user to send rewards to');
        return;
    }
    
    // Get reward details
    const title = document.getElementById('bulk-reward-title').value.trim();
    const amount = parseFloat(document.getElementById('bulk-reward-amount').value);
    const description = document.getElementById('bulk-reward-description').value.trim();
    const expiryDate = document.getElementById('bulk-reward-expiry').value;
    
    if (!title) {
        alert('Please enter a reward title');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    // Confirm before sending
    if (!confirm(`Are you sure you want to send this reward to ${selectedUsers.length} users?`)) {
        return;
    }
    
    // Create base reward object
    const baseReward = {
        title: title,
        amount: amount,
        description: description || `Bulk Reward: ${title}`,
        date: new Date().toISOString(),
        isUsed: false,
        expiryDate: expiryDate || null
    };
    
    // Keep track of successful and failed sends
    let successCount = 0;
    let usersList = '';
    
    // Send reward to each selected user
    selectedUsers.forEach(user => {
        // Generate unique ID for each user's reward
        const reward = {
            ...baseReward,
            id: 'reward_bulk_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
        };
        
        // Add reward to user's wallet
        const walletKey = `wallet_${user.id}`;
        const walletData = JSON.parse(localStorage.getItem(walletKey)) || {
            balance: 0,
            transactions: [],
            rewards: [],
            notifications: []
        };
        
        // Add reward to wallet
        if (!walletData.rewards) {
            walletData.rewards = [];
        }
        
        walletData.rewards.unshift(reward);
        localStorage.setItem(walletKey, JSON.stringify(walletData));
        
        // Send notification to user
        const notification = {
            id: 'notif_reward_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            title: 'New Reward Added',
            message: `You have received a new reward: ${title} worth PKR ${amount.toFixed(2)}`,
            timestamp: new Date().toISOString(),
            status: 'unread',
            type: 'reward',
            fromAdmin: true
        };
        
        // Add notification to user's notifications
        const notificationsKey = `notifications_${user.id}`;
        const notifications = JSON.parse(localStorage.getItem(notificationsKey)) || [];
        notifications.unshift(notification);
        localStorage.setItem(notificationsKey, JSON.stringify(notifications));
        
        successCount++;
        usersList += `<li>${user.name}</li>`;
    });
    
    // Add to admin notifications
    const adminNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
    adminNotifications.unshift({
        message: `Bulk reward '${title}' (PKR ${amount.toFixed(2)}) sent to ${successCount} users`,
        timestamp: new Date().toISOString(),
        type: 'reward',
        icon: 'fa-gift',
        admin: sessionStorage.getItem('adminName') || 'Admin'
    });
    localStorage.setItem('notifications', JSON.stringify(adminNotifications));
    
    // Reset form
    document.getElementById('bulk-reward-form').reset();
    deselectAllUsers('bulk-reward');
    
    // Show success message with users list
    alert(`Rewards sent successfully to ${successCount} users!`);
    
    // Show more detailed success message
    const successModal = `
        <div class="modal fade" id="bulkRewardSuccessModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">Bulk Rewards Sent</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="text-center mb-3">
                            <i class="fas fa-check-circle text-success fa-3x mb-3"></i>
                            <h4>Success!</h4>
                            <p>Reward "${title}" worth PKR ${amount.toFixed(2)} has been sent to ${successCount} users.</p>
                        </div>
                        <div class="mb-3">
                            <h6>Recipients:</h6>
                            <ul class="small">${usersList}</ul>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to document
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = successModal;
    document.body.appendChild(modalContainer);
    
    // Show modal
    const modalElement = document.getElementById('bulkRewardSuccessModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    
    // Remove modal from DOM when hidden
    modalElement.addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(modalContainer);
    });
    
    // Refresh rewards list and summary
    loadAllRewards();
    refreshRewardsSummary();
}

/**
 * Add a new reward for a user
 */
function addUserReward() {
    const userId = document.getElementById('reward-user').value;
    const title = document.getElementById('reward-title').value.trim();
    const amount = parseFloat(document.getElementById('reward-amount').value);
    const description = document.getElementById('reward-description').value.trim();
    const expiryDate = document.getElementById('reward-expiry').value;
    
    if (!userId) {
        alert('Please select a user');
        return;
    }
    
    if (!title) {
        alert('Please enter a reward title');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    // Get user info
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found');
        return;
    }
    
    // Create reward
    const reward = {
        id: 'reward_' + Date.now(),
        title: title,
        amount: amount,
        description: description || `Reward: ${title}`,
        date: new Date().toISOString(),
        isUsed: false,
        expiryDate: expiryDate || null
    };
    
    // Add reward to user's wallet
    const walletKey = `wallet_${userId}`;
    const walletData = JSON.parse(localStorage.getItem(walletKey)) || {
        balance: 0,
        transactions: [],
        rewards: [],
        notifications: []
    };
    
    // Add reward to wallet
    if (!walletData.rewards) {
        walletData.rewards = [];
    }
    
    walletData.rewards.unshift(reward);
    localStorage.setItem(walletKey, JSON.stringify(walletData));
    
    // Send notification to user
    const notification = {
        id: 'notif_reward_' + Date.now(),
        title: 'New Reward Added',
        message: `You have received a new reward: ${title} worth PKR ${amount.toFixed(2)}`,
        timestamp: new Date().toISOString(),
        status: 'unread',
        type: 'reward',
        fromAdmin: true
    };
    
    // Add notification to user's notifications
    const notificationsKey = `notifications_${userId}`;
    const notifications = JSON.parse(localStorage.getItem(notificationsKey)) || [];
    notifications.unshift(notification);
    localStorage.setItem(notificationsKey, JSON.stringify(notifications));
    
    // Add to admin notifications
    const adminNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
    adminNotifications.unshift({
        message: `Reward '${title}' (PKR ${amount.toFixed(2)}) added to user ${user.name}`,
        timestamp: new Date().toISOString(),
        type: 'reward',
        icon: 'fa-gift',
        admin: sessionStorage.getItem('adminName') || 'Admin'
    });
    localStorage.setItem('notifications', JSON.stringify(adminNotifications));
    
    // Reset form
    document.getElementById('add-reward-form').reset();
    
    // Show success message
    alert(`Reward added successfully to ${user.name}'s account`);
    
    // Refresh rewards list and summary
    loadAllRewards();
    refreshRewardsSummary();
}

/**
 * Search for rewards
 */
function searchUserRewards() {
    const searchTerm = document.getElementById('rewards-search').value.toLowerCase().trim();
    const rewardsList = document.getElementById('rewards-list');
    
    if (!rewardsList) return;
    
    // Get all reward rows
    const rows = rewardsList.getElementsByTagName('tr');
    
    // First check if we have actual rows or just a placeholder
    if (rows.length === 1 && rows[0].cells.length === 1 && rows[0].cells[0].colSpan) {
        // This is a placeholder row, reload rewards first
        loadAllRewards();
        return;
    }
    
    // Hide/show rows based on search term
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const text = row.textContent.toLowerCase();
        
        if (text.includes(searchTerm) || searchTerm === '') {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }
}

/**
 * View reward details
 * @param {string} rewardId - Reward ID
 * @param {string} userId - User ID
 */
function viewRewardDetails(rewardId, userId) {
    // Get reward data
    const walletKey = `wallet_${userId}`;
    const walletData = JSON.parse(localStorage.getItem(walletKey)) || { rewards: [] };
    const reward = walletData.rewards.find(r => r.id === rewardId);
    
    if (!reward) {
        alert('Reward not found');
        return;
    }
    
    // Get user data
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found');
        return;
    }
    
    // Format expiry date
    let expiryText = 'No expiry date';
    if (reward.expiryDate) {
        const expiry = new Date(reward.expiryDate);
        expiryText = expiry.toLocaleDateString();
    }
    
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="rewardDetailsModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">Reward Details</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="d-flex align-items-center mb-3">
                            <div class="flex-shrink-0">
                                <div class="rounded-circle bg-light p-3">
                                    <i class="fas fa-gift fa-2x text-primary"></i>
                                </div>
                            </div>
                            <div class="ms-3">
                                <h4>${reward.title}</h4>
                                <p class="text-muted mb-0">Added on ${new Date(reward.date).toLocaleString()}</p>
                            </div>
                        </div>
                        
                        <div class="alert ${reward.isUsed ? 'alert-secondary' : 'alert-success'} d-flex align-items-center">
                            <i class="fas ${reward.isUsed ? 'fa-check-circle' : 'fa-gift'} me-2"></i>
                            <div>Status: <strong>${reward.isUsed ? 'Completed' : 'Available'}</strong></div>
                        </div>
                        
                        <!-- Enhanced Reward Amount Display -->
                        <div class="card mb-3 border-success">
                            <div class="card-header bg-success text-white">
                                <h5 class="mb-0"><i class="fas fa-coins me-2"></i> Reward Amount</h5>
                            </div>
                            <div class="card-body">
                                <div class="d-flex align-items-center">
                                    <div class="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                                        <i class="fas fa-money-bill-wave fa-2x text-success"></i>
                                    </div>
                                    <div>
                                        <div class="fs-2 fw-bold text-success">PKR ${reward.amount.toFixed(2)}</div>
                                        <div class="text-muted">Reward value</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Enhanced Expiry Date Display -->
                        <div class="card mb-3 ${reward.expiryDate ? 'border-warning' : 'border-secondary'}">
                            <div class="card-header ${reward.expiryDate ? 'bg-warning' : 'bg-secondary'} ${reward.expiryDate ? 'text-dark' : 'text-white'}">
                                <h5 class="mb-0"><i class="fas fa-clock me-2"></i> Expiry Information</h5>
                            </div>
                            <div class="card-body">
                                <div class="d-flex align-items-center">
                                    <div class="rounded-circle ${reward.expiryDate ? 'bg-warning bg-opacity-10' : 'bg-secondary bg-opacity-10'} p-3 me-3">
                                        <i class="fas ${reward.expiryDate ? 'fa-calendar-alt' : 'fa-infinity'} fa-2x ${reward.expiryDate ? 'text-warning' : 'text-secondary'}"></i>
                                    </div>
                                    <div>
                                        <div class="fs-5 fw-bold">${expiryText}</div>
                                        <div class="text-muted">${reward.expiryDate ? 'Reward must be used by this date' : 'This reward does not expire'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="fw-bold">Description:</div>
                            <p>${reward.description || 'No description provided'}</p>
                        </div>
                        
                        <div class="mb-3">
                            <div class="fw-bold">User Information:</div>
                            <div class="d-flex align-items-center mt-2">
                                <img src="${user.avatar}" alt="${user.name}" class="rounded-circle me-2" width="40" height="40">
                                <div>
                                    <div>${user.name}</div>
                                    <div class="small text-muted">${user.email}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        ${!reward.isUsed ? 
                            `<div class="d-flex gap-2 me-auto">
                                <button type="button" class="btn btn-danger" onclick="deleteReward('${rewardId}', '${userId}')">
                                    <i class="fas fa-trash me-1"></i> Delete Reward
                                </button>
                                <button type="button" class="btn btn-warning" onclick="markRewardExpired('${rewardId}', '${userId}')">
                                    <i class="fas fa-calendar-times me-1"></i> Mark as Expired
                                </button>
                            </div>` : 
                            ''
                        }
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to document
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    // Show modal
    const modalElement = document.getElementById('rewardDetailsModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    
    // Remove modal from DOM when hidden
    modalElement.addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(modalContainer);
    });
}

/**
 * Mark a reward as expired
 * @param {string} rewardId - Reward ID
 * @param {string} userId - User ID
 */
function markRewardExpired(rewardId, userId) {
    if (!confirm('Are you sure you want to mark this reward as expired? This action cannot be undone.')) {
        return;
    }
    
    try {
        // Get wallet data
        const walletKey = `wallet_${userId}`;
        const walletData = JSON.parse(localStorage.getItem(walletKey)) || { rewards: [] };
        
        // Find the reward
        const rewardIndex = walletData.rewards.findIndex(r => r.id === rewardId);
        
        if (rewardIndex === -1) {
            alert('Reward not found');
            return;
        }
        
        // Set expiry date to yesterday (to ensure it's expired)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        // Set both expiry fields to ensure compatibility across the app
        walletData.rewards[rewardIndex].expiryDate = yesterday.toISOString();
        walletData.rewards[rewardIndex].expires = yesterday.toISOString();
        
        // Save updated wallet data
        localStorage.setItem(walletKey, JSON.stringify(walletData));
        
        // Add admin notification
        const adminNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
        adminNotifications.unshift({
            message: `Reward "${walletData.rewards[rewardIndex].title}" for user ${userId} was manually marked as expired`,
            timestamp: new Date().toISOString(),
            type: 'reward_expired',
            icon: 'fa-calendar-times'
        });
        localStorage.setItem('notifications', JSON.stringify(adminNotifications));
        
        // Add user notification
        const userNotificationsKey = `notifications_${userId}`;
        const userNotifications = JSON.parse(localStorage.getItem(userNotificationsKey)) || [];
        userNotifications.unshift({
            id: `notif_reward_expired_${Date.now()}`,
            title: 'Reward Expired',
            message: `Your reward "${walletData.rewards[rewardIndex].title}" has expired and is no longer available for redemption.`,
            timestamp: new Date().toISOString(),
            status: 'unread',
            type: 'reward',
            fromAdmin: true
        });
        localStorage.setItem(userNotificationsKey, JSON.stringify(userNotifications));
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('rewardDetailsModal'));
        if (modal) {
            modal.hide();
        }
        
        // Show success message
        alert('Reward has been marked as expired successfully');
        
        // Refresh rewards list
        loadAllRewards();
    } catch (error) {
        console.error('Error marking reward as expired:', error);
        alert('An error occurred while marking the reward as expired');
    }
}

/**
 * Delete a reward
 * @param {string} rewardId - Reward ID
 * @param {string} userId - User ID
 */
function deleteReward(rewardId, userId) {
    if (!confirm('Are you sure you want to delete this reward?')) {
        return;
    }
    
    // Get user data
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found');
        return;
    }
    
    // Get wallet data
    const walletKey = `wallet_${userId}`;
    const walletData = JSON.parse(localStorage.getItem(walletKey)) || { rewards: [] };
    
    // Find reward
    const rewardIndex = walletData.rewards.findIndex(r => r.id === rewardId);
    
    if (rewardIndex === -1) {
        alert('Reward not found');
        return;
    }
    
    // Get reward info for notification
    const reward = walletData.rewards[rewardIndex];
    
    // Remove reward
    walletData.rewards.splice(rewardIndex, 1);
    localStorage.setItem(walletKey, JSON.stringify(walletData));
    
    // Send notification to user
    const notification = {
        id: 'notif_reward_deleted_' + Date.now(),
        title: 'Reward Removed',
        message: `Your reward "${reward.title}" worth PKR ${reward.amount.toFixed(2)} has been removed by an administrator.`,
        timestamp: new Date().toISOString(),
        status: 'unread',
        type: 'reward',
        fromAdmin: true
    };
    
    // Add notification to user's notifications
    const notificationsKey = `notifications_${userId}`;
    const notifications = JSON.parse(localStorage.getItem(notificationsKey)) || [];
    notifications.unshift(notification);
    localStorage.setItem(notificationsKey, JSON.stringify(notifications));
    
    // Add to admin notifications
    const adminNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
    adminNotifications.unshift({
        message: `Reward '${reward.title}' (PKR ${reward.amount.toFixed(2)}) removed from user ${user.name}`,
        timestamp: new Date().toISOString(),
        type: 'reward',
        icon: 'fa-trash',
        admin: sessionStorage.getItem('adminName') || 'Admin'
    });
    localStorage.setItem('notifications', JSON.stringify(adminNotifications));
    
    // Close modal if open
    const modalElement = document.getElementById('rewardDetailsModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
    }
    
    // Show success message
    alert('Reward deleted successfully');
    
    // Refresh rewards list and summary
    loadAllRewards();
    refreshRewardsSummary();
}

/**
 * Confirm and mark all rewards as expired
 */
function confirmMarkAllRewardsExpired() {
    if (!confirm('WARNING: This will mark ALL active rewards for ALL users as expired. This action cannot be undone. Are you sure you want to continue?')) {
        return;
    }
    
    try {
        // Get all users
        const users = JSON.parse(localStorage.getItem('users')) || [];
        let totalMarked = 0;
        let affectedUsers = 0;
        
        // Set yesterday's date for expiry
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Process each user's wallet
        users.forEach(user => {
            const walletKey = `wallet_${user.id}`;
            const walletData = JSON.parse(localStorage.getItem(walletKey)) || { rewards: [] };
            
            if (!walletData.rewards || walletData.rewards.length === 0) {
                return; // Skip users with no rewards
            }
            
            let userAffected = false;
            
            // Mark all active, non-used rewards as expired
            walletData.rewards.forEach(reward => {
                if (!reward.isUsed && !reward.isPending) {
                    // Set both fields for compatibility
                    reward.expiryDate = yesterday.toISOString();
                    reward.expires = yesterday.toISOString();
                    totalMarked++;
                    userAffected = true;
                }
            });
            
            // Save updated wallet data if user was affected
            if (userAffected) {
                localStorage.setItem(walletKey, JSON.stringify(walletData));
                affectedUsers++;
                
                // Add notification for the user
                const userNotificationsKey = `notifications_${user.id}`;
                const userNotifications = JSON.parse(localStorage.getItem(userNotificationsKey)) || [];
                userNotifications.unshift({
                    id: `notif_rewards_expired_${Date.now()}_${user.id}`,
                    title: 'Rewards Expired',
                    message: 'Your active rewards have expired and are no longer available for redemption.',
                    timestamp: new Date().toISOString(),
                    status: 'unread',
                    type: 'reward',
                    fromAdmin: true
                });
                localStorage.setItem(userNotificationsKey, JSON.stringify(userNotifications));
            }
        });
        
        // Add admin notification
        const adminNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
        adminNotifications.unshift({
            message: `Bulk action: Marked ${totalMarked} rewards as expired across ${affectedUsers} users`,
            timestamp: new Date().toISOString(),
            type: 'reward_expired',
            icon: 'fa-calendar-times',
            admin: sessionStorage.getItem('adminName') || 'Admin'
        });
        localStorage.setItem('notifications', JSON.stringify(adminNotifications));
        
        // Show success message
        alert(`Successfully marked ${totalMarked} rewards as expired for ${affectedUsers} users.`);
        
        // Refresh rewards list
        loadAllRewards();
        
    } catch (error) {
        console.error('Error marking all rewards as expired:', error);
        alert('An error occurred while marking rewards as expired. Please check the console for details.');
    }
}

// Add event listener for admin menu
document.addEventListener('DOMContentLoaded', function() {
    const rewardsMenuItem = document.querySelector('.sidebar nav a[href="#user-rewards"]');
    
    if (rewardsMenuItem) {
        rewardsMenuItem.addEventListener('click', function(e) {
            e.preventDefault();
            loadUserRewards();
        });
    }
});
