/**
 * User Notifications Management for Admin Panel
 */

// Globals for tracking selected users
let selectedUsers = [];

// Load all functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Set up event handlers for the notification section
    const notificationForm = document.getElementById('add-notification-form');
    const searchUserBtn = document.getElementById('search-user-btn');
    const searchUserInput = document.getElementById('notification-search-user');
    const selectAllBtn = document.getElementById('select-all-btn');
    const deselectAllBtn = document.getElementById('deselect-all-btn');
    
    if (notificationForm) {
        notificationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            sendBulkNotifications();
        });
    }
    
    if (searchUserBtn) {
        searchUserBtn.addEventListener('click', function() {
            filterUsers();
        });
    }
    
    if (searchUserInput) {
        searchUserInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                filterUsers();
            }
        });
        
        // Live filtering as user types
        searchUserInput.addEventListener('input', function() {
            filterUsers();
        });
    }
    
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', function() {
            selectAllUsers();
        });
    }
    
    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', function() {
            deselectAllUsers();
        });
    }
});

/**
 * Load user notifications management section
 */
function loadUserNotifications() {
    // Show the section
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('user-notifications').classList.add('active');
    
    // Reset selected users
    selectedUsers = [];
    updateSelectedCount();
    
    // Load all users with checkboxes
    loadAllUsers();
}

/**
 * Load all users with checkboxes for selection
 */
function loadAllUsers() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userListContainer = document.getElementById('user-list');
    
    if (!userListContainer) return;
    
    // Sort users by name
    users.sort((a, b) => a.name.localeCompare(b.name));
    
    if (users.length === 0) {
        userListContainer.innerHTML = `
            <div class="text-center p-5 text-muted">
                <p>No users found</p>
            </div>
        `;
        return;
    }
    
    // Generate user list with checkboxes
    let userListHTML = '';
    
    users.forEach(user => {
        userListHTML += `
            <div class="list-group-item user-item" data-user-id="${user.id}" data-user-name="${user.name}" data-user-email="${user.email}">
                <div class="d-flex align-items-center">
                    <div class="form-check">
                        <input class="form-check-input user-checkbox" type="checkbox" value="${user.id}" id="user-${user.id}" onchange="toggleUserSelection('${user.id}')">
                    </div>
                    <label class="ms-2 d-flex align-items-center user-label" for="user-${user.id}" style="cursor: pointer; flex-grow: 1;">
                        <img src="${user.avatar}" alt="${user.name}" class="rounded-circle me-2" width="40" height="40">
                        <div>
                            <h6 class="mb-0">${user.name}</h6>
                            <small class="text-muted">${user.email}</small>
                        </div>
                    </label>
                    <button class="btn btn-sm btn-outline-info" onclick="viewUserNotifications('${user.id}')">
                        <i class="fas fa-bell"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    userListContainer.innerHTML = userListHTML;
}

/**
 * Filter users by name or email
 */
function filterUsers() {
    const searchTerm = document.getElementById('notification-search-user').value.toLowerCase().trim();
    const userItems = document.querySelectorAll('.user-item');
    
    userItems.forEach(item => {
        const userName = item.getAttribute('data-user-name').toLowerCase();
        const userEmail = item.getAttribute('data-user-email').toLowerCase();
        
        if (userName.includes(searchTerm) || userEmail.includes(searchTerm) || searchTerm === '') {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

/**
 * Toggle selection of a user
 * @param {string} userId - User ID to toggle selection
 */
function toggleUserSelection(userId) {
    const checkbox = document.getElementById(`user-${userId}`);
    if (!checkbox) return;
    
    if (checkbox.checked) {
        // Add to selected users if not already present
        if (!selectedUsers.includes(userId)) {
            selectedUsers.push(userId);
        }
    } else {
        // Remove from selected users
        const index = selectedUsers.indexOf(userId);
        if (index !== -1) {
            selectedUsers.splice(index, 1);
        }
    }
    
    updateSelectedCount();
}

/**
 * Select all visible users
 */
function selectAllUsers() {
    const userCheckboxes = document.querySelectorAll('.user-checkbox');
    
    userCheckboxes.forEach(checkbox => {
        const userItem = checkbox.closest('.user-item');
        // Only select visible users (not filtered out)
        if (userItem.style.display !== 'none') {
            checkbox.checked = true;
            const userId = checkbox.value;
            if (!selectedUsers.includes(userId)) {
                selectedUsers.push(userId);
            }
        }
    });
    
    updateSelectedCount();
}

/**
 * Deselect all users
 */
function deselectAllUsers() {
    const userCheckboxes = document.querySelectorAll('.user-checkbox');
    
    userCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    selectedUsers = [];
    updateSelectedCount();
}

/**
 * Update the selected users count display
 */
function updateSelectedCount() {
    const countElement = document.getElementById('selected-count');
    if (countElement) {
        countElement.textContent = `${selectedUsers.length} Selected`;
        
        // Update badge color based on selection
        if (selectedUsers.length > 0) {
            countElement.classList.remove('bg-secondary');
            countElement.classList.add('bg-primary');
        } else {
            countElement.classList.remove('bg-primary');
            countElement.classList.add('bg-secondary');
        }
    }
}

/**
 * View notifications for a specific user
 * @param {string} userId - User ID
 */
function viewUserNotifications(userId) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found');
        return;
    }
    
    // Set selected user name
    const userNameBadge = document.getElementById('selected-user-name');
    if (userNameBadge) {
        userNameBadge.textContent = user.name;
    }
    
    // Set user in dropdown
    const userSelect = document.getElementById('notification-user');
    if (userSelect) {
        for (let i = 0; i < userSelect.options.length; i++) {
            if (userSelect.options[i].value === userId) {
                userSelect.selectedIndex = i;
                break;
            }
        }
    }
    
    // Get user notifications
    const notificationsKey = `notifications_${userId}`;
    const notifications = JSON.parse(localStorage.getItem(notificationsKey)) || [];
    
    // Display notifications
    const notificationsContainer = document.getElementById('user-notifications-list');
    if (!notificationsContainer) return;
    
    if (notifications.length === 0) {
        notificationsContainer.innerHTML = `
            <div class="text-center p-5 text-muted">
                <i class="fas fa-bell-slash fa-3x mb-3"></i>
                <p>No notifications for ${user.name}</p>
            </div>
        `;
        return;
    }
    
    // Sort notifications by timestamp (newest first)
    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Build notifications list
    let notificationsHTML = '';
    
    notifications.forEach(notification => {
        const date = new Date(notification.timestamp);
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        
        // Determine notification color based on type/isDeduction flag
        let bgColor = 'bg-light';
        let textColor = 'text-dark';
        let borderColor = 'border-start border-4 border-secondary';
        
        if (notification.isDeduction) {
            bgColor = 'bg-danger bg-opacity-10';
            textColor = 'text-danger';
            borderColor = 'border-start border-4 border-danger';
        } else if (notification.type === 'success' || (notification.message && notification.message.includes('approved'))) {
            bgColor = 'bg-success bg-opacity-10';
            textColor = 'text-success';
            borderColor = 'border-start border-4 border-success';
        } else if (notification.type === 'warning' || (notification.message && notification.message.includes('rejected'))) {
            bgColor = 'bg-warning bg-opacity-10';
            textColor = 'text-warning';
            borderColor = 'border-start border-4 border-warning';
        } else if (notification.type === 'danger') {
            bgColor = 'bg-danger bg-opacity-10';
            textColor = 'text-danger';
            borderColor = 'border-start border-4 border-danger';
        }
        
        notificationsHTML += `
            <div class="list-group-item ${bgColor} ${borderColor} position-relative">
                <div class="d-flex justify-content-between align-items-start">
                    <h6 class="mb-1 ${textColor}">
                        <i class="fas ${notification.icon || 'fa-bell'} me-2"></i>
                        ${notification.title || 'Notification'}
                    </h6>
                    <div>
                        <small class="text-muted">${formattedDate}</small>
                        <button class="btn btn-sm btn-danger ms-2" onclick="deleteUserNotification('${userId}', '${notification.id}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                <p class="mb-1 mt-2">${notification.message}</p>
                <small class="text-muted">Status: ${notification.status || 'N/A'}</small>
            </div>
        `;
    });
    
    notificationsContainer.innerHTML = notificationsHTML;
}

/**
 * Send notifications to all selected users
 */
function sendBulkNotifications() {
    const titleInput = document.getElementById('notification-title');
    const messageInput = document.getElementById('notification-message');
    const typeSelect = document.getElementById('notification-type');
    
    if (!titleInput || !messageInput || !typeSelect) {
        alert('Form inputs not found');
        return;
    }
    
    const title = titleInput.value.trim();
    const message = messageInput.value.trim();
    const type = typeSelect.value;
    
    if (selectedUsers.length === 0) {
        alert('Please select at least one user');
        return;
    }
    
    if (!title) {
        alert('Please enter a notification title');
        return;
    }
    
    if (!message) {
        alert('Please enter a notification message');
        return;
    }
    
    // Get users info
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const selectedUserNames = [];
    let successCount = 0;
    
    // Common notification properties
    const notificationBase = {
        id: 'BULK_NOTIF_' + Date.now(),
        title: title,
        message: message,
        type: type,
        icon: getIconForType(type),
        status: 'unread',
        timestamp: new Date().toISOString(),
        fromAdmin: true,
        bulkNotification: true
    };
    
    // Send notification to each selected user
    selectedUsers.forEach(userId => {
        const user = users.find(u => u.id === userId);
        if (!user) return; // Skip if user not found
        
        // Create a unique notification for this user with additional properties for persistence
        const notification = {
            ...notificationBase,
            id: notificationBase.id + '_' + userId, // Ensure unique ID per user
            permanent: true, // Mark as permanent so it's never deleted
            fromAdmin: true, // Explicitly mark as from admin
            fromAdminDate: new Date().toISOString(), // Add date for tracking
            status: 'unread' // Ensure it shows as unread
        };
        
        // Step 1: Add notification to user's notifications list
        const notificationsKey = `notifications_${userId}`;
        const notifications = JSON.parse(localStorage.getItem(notificationsKey)) || [];
        notifications.unshift(notification);
        localStorage.setItem(notificationsKey, JSON.stringify(notifications));
        
        // Step 2: ALSO directly add to the user's wallet to ensure it's definitely saved
        try {
            const walletKey = `wallet_${userId}`;
            const walletData = JSON.parse(localStorage.getItem(walletKey)) || {
                balance: 0,
                transactions: [],
                rewards: [],
                notifications: []
            };
            
            // Create wallet-formatted notification
            const walletNotification = {
                id: notification.id,
                title: notification.title,
                message: notification.message,
                timestamp: notification.timestamp,
                isRead: false,
                type: notification.type,
                fromAdmin: true,
                permanent: true
            };
            
            // Check if this notification already exists in the wallet
            const exists = walletData.notifications.some(n => 
                n.id === notification.id || 
                (n.title === notification.title && n.message === notification.message)
            );
            
            if (!exists) {
                // Add to wallet notifications if not already there
                walletData.notifications.unshift(walletNotification);
                localStorage.setItem(walletKey, JSON.stringify(walletData));
                console.log(`Direct notification added to user ${userId}'s wallet`); 
            }
        } catch (error) {
            console.error(`Error adding notification to wallet for user ${userId}:`, error);
        }
        
        // Track for admin notification
        selectedUserNames.push(user.name);
        successCount++;
    });
    
    // Record admin action
    const adminName = sessionStorage.getItem('adminName') || 'Administrator';
    const adminNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
    
    const recipientText = selectedUserNames.length > 3 
        ? `${selectedUserNames.slice(0, 3).join(', ')} and ${selectedUserNames.length - 3} more users` 
        : selectedUserNames.join(', ');
    
    adminNotifications.unshift({
        message: `Bulk notification "${title}" sent to ${successCount} users: ${recipientText}`,
        timestamp: new Date().toISOString(),
        type: 'notification',
        icon: 'fa-bell',
        admin: adminName
    });
    localStorage.setItem('notifications', JSON.stringify(adminNotifications));
    
    // Show success message
    alert(`Notification sent to ${successCount} users successfully`);
    
    // Reset form
    titleInput.value = '';
    messageInput.value = '';
    
    // Optional: Deselect all users after sending
    if (confirm('Deselect all users?')) {
        deselectAllUsers();
    }
}

/**
 * Add a new notification for a user
 */
function addUserNotification() {
    const userSelect = document.getElementById('notification-user');
    const titleInput = document.getElementById('notification-title');
    const messageInput = document.getElementById('notification-message');
    const typeSelect = document.getElementById('notification-type');
    
    if (!userSelect || !titleInput || !messageInput || !typeSelect) {
        alert('Form elements not found');
        return;
    }
    
    const userId = userSelect.value;
    const title = titleInput.value.trim();
    const message = messageInput.value.trim();
    const type = typeSelect.value;
    
    if (!userId) {
        alert('Please select a user');
        return;
    }
    
    if (!title) {
        alert('Please enter a notification title');
        return;
    }
    
    if (!message) {
        alert('Please enter a notification message');
        return;
    }
    
    // Get user info
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found');
        return;
    }
    
    // Create notification object
    const notification = {
        id: 'NOTIF_' + Date.now(),
        title: title,
        message: message,
        type: type,
        icon: getIconForType(type),
        status: 'unread',
        timestamp: new Date().toISOString(),
        fromAdmin: true
    };
    
    // Add notification to user's notifications
    const notificationsKey = `notifications_${userId}`;
    const notifications = JSON.parse(localStorage.getItem(notificationsKey)) || [];
    notifications.unshift(notification);
    localStorage.setItem(notificationsKey, JSON.stringify(notifications));
    
    // Record admin action
    const adminName = sessionStorage.getItem('adminName') || 'Administrator';
    const adminNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
    adminNotifications.unshift({
        message: `Notification sent to ${user.name}: ${title}`,
        timestamp: new Date().toISOString(),
        type: 'notification',
        icon: 'fa-bell',
        admin: adminName
    });
    localStorage.setItem('notifications', JSON.stringify(adminNotifications));
    
    // Show success message
    alert(`Notification sent to ${user.name} successfully`);
    
    // Reset form
    titleInput.value = '';
    messageInput.value = '';
    
    // Refresh the notifications view
    viewUserNotifications(userId);
}

/**
 * Delete a user notification
 * @param {string} userId - User ID
 * @param {string} notificationId - Notification ID to delete
 */
function deleteUserNotification(userId, notificationId) {
    if (!confirm('Are you sure you want to delete this notification?')) {
        return;
    }
    
    // Get user info
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found');
        return;
    }
    
    // Remove notification
    const notificationsKey = `notifications_${userId}`;
    let notifications = JSON.parse(localStorage.getItem(notificationsKey)) || [];
    
    // Find the notification to delete
    const notificationIndex = notifications.findIndex(n => n.id === notificationId);
    
    if (notificationIndex === -1) {
        alert('Notification not found');
        return;
    }
    
    const deletedNotification = notifications[notificationIndex];
    
    // Remove the notification
    notifications.splice(notificationIndex, 1);
    localStorage.setItem(notificationsKey, JSON.stringify(notifications));
    
    // Record admin action
    const adminName = sessionStorage.getItem('adminName') || 'Administrator';
    const adminNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
    adminNotifications.unshift({
        message: `Deleted notification for ${user.name}: ${deletedNotification.title || 'Notification'}`,
        timestamp: new Date().toISOString(),
        type: 'notification',
        icon: 'fa-trash',
        admin: adminName
    });
    localStorage.setItem('notifications', JSON.stringify(adminNotifications));
    
    // Refresh the notifications view
    viewUserNotifications(userId);
}

/**
 * Get appropriate icon for notification type
 * @param {string} type - Notification type
 * @returns {string} - Font Awesome icon class
 */
function getIconForType(type) {
    switch (type) {
        case 'success':
            return 'fa-check-circle';
        case 'warning':
            return 'fa-exclamation-triangle';
        case 'danger':
            return 'fa-exclamation-circle';
        case 'info':
        default:
            return 'fa-info-circle';
    }
}
