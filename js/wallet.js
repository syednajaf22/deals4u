// Global variables for wallet
let userEarnings = {
    balance: 0,
    transactions: [],
    rewards: [],
    notifications: []
};

// Function to load wallet data from localStorage
function loadWalletData() {
    if (!authState || !authState.isAuthenticated || !authState.currentUser) {
        console.error('User not authenticated');
        return;
    }

    try {
        // Get wallet data from localStorage
        const userId = authState.currentUser.id;
        const walletKey = `wallet_${userId}`;
        const walletData = JSON.parse(localStorage.getItem(walletKey));
        
        if (walletData) {
            userEarnings = walletData;
            console.log('Wallet data loaded:', userEarnings);
            
            // Ensure all required wallet structure properties exist
            if (!userEarnings.notifications) {
                userEarnings.notifications = [];
            }
            
            // CRITICAL FIX: Ensure rewards array exists and is properly initialized
            if (!userEarnings.rewards) {
                userEarnings.rewards = [];
            }
            
            // Log the number of rewards found for debugging
            console.log(`Found ${userEarnings.rewards.length} rewards in user wallet`);
        } else {
            // Initialize with empty wallet if not found
            userEarnings = {
                balance: 0,
                transactions: [],
                rewards: [],
                notifications: []
            };
            console.log('No wallet data found, initialized new wallet');
        }
        
        // CRITICAL: Check for notifications from admin in the separate notifications storage
        // This MUST happen regardless of whether wallet data was found or not
        const userNotificationsKey = `notifications_${userId}`;
        const adminNotifications = JSON.parse(localStorage.getItem(userNotificationsKey)) || [];
        
        // EXTREMELY IMPORTANT: Log complete admin notifications for debugging
        if (adminNotifications && adminNotifications.length > 0) {
            console.log('FOUND ADMIN NOTIFICATIONS:', JSON.stringify(adminNotifications));
            
            // Add ALL admin notifications to the wallet notifications regardless of duplicates
            let hasNewNotifications = false;
            
            for (const notification of adminNotifications) {
                // Create a unique ID for this notification if it doesn't have one
                const notificationId = notification.id || `admin_notif_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
                
                // Format to match the wallet notification structure
                const walletNotification = {
                    id: notificationId,
                    title: notification.title || 'Notification',
                    message: notification.message || '',
                    timestamp: notification.timestamp || new Date().toISOString(),
                    isRead: false, // Always set as unread to make it visible
                    type: notification.type || 'wallet',
                    fromAdmin: true,
                    permanent: true
                };
                
                // ALWAYS ADD the notification to ensure it's not missed
                userEarnings.notifications.unshift(walletNotification);
                hasNewNotifications = true;
                
                console.log('Added admin notification to wallet:', walletNotification);
            }
            
            if (hasNewNotifications) {
                // Save the updated notifications to the wallet
                saveWalletData();
                console.log('Saved updated wallet with admin notifications');
            }
        }
        
        // Deduplicate notifications in the wallet
        if (userEarnings.notifications.length > 0) {
            const uniqueNotifications = [];
            const seenIds = new Set();
            const seenContents = new Set();
            
            for (const notification of userEarnings.notifications) {
                // Create a content key for deduplication
                const contentKey = `${notification.title}|${notification.message}`;
                
                // Only add if we haven't seen this ID or content before
                if (!seenIds.has(notification.id) && !seenContents.has(contentKey)) {
                    uniqueNotifications.push(notification);
                    seenIds.add(notification.id);
                    seenContents.add(contentKey);
                }
            }
            
            // Replace with deduplicated list
            if (uniqueNotifications.length !== userEarnings.notifications.length) {
                userEarnings.notifications = uniqueNotifications;
                saveWalletData();
                console.log('Deduplicated notifications:', uniqueNotifications.length);
            }
        }
    } catch (error) {
        console.error('Error loading wallet data:', error);
    }
}

// Function to check if a reward has expired
function isExpired(expiryDate) {
    if (!expiryDate) return false;
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    return now > expiry;
}

// Function to save wallet data to localStorage
function saveWalletData() {
    if (!authState || !authState.isAuthenticated || !authState.currentUser) {
        console.error('User not authenticated');
        return;
    }

    try {
        const userId = authState.currentUser.id;
        const walletKey = `wallet_${userId}`;
        localStorage.setItem(walletKey, JSON.stringify(userEarnings));
        console.log('Wallet data saved successfully');
        
        // Update the UI immediately if the wallet balance element exists
        const balanceElement = document.getElementById('wallet-balance');
        if (balanceElement) {
            balanceElement.textContent = `PKR ${userEarnings.balance.toFixed(2)}`;
        }
        
        // Refresh notifications if on the notifications tab
        const notificationsTab = document.getElementById('tab-notifications');
        if (notificationsTab && notificationsTab.classList.contains('active')) {
            renderWalletNotifications();
        }
    } catch (error) {
        console.error('Error saving wallet data:', error);
    }
}

// Load wallet balance (used in other parts of the app)
function loadWalletBalance() {
    loadWalletData();
    const balanceElement = document.getElementById('wallet-balance');
    if (balanceElement) {
        balanceElement.textContent = `PKR ${userEarnings.balance.toFixed(2)}`;
    }
}

// Format date for wallet page
function formatWalletDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Function to check if a reward has expired
function isExpired(expiryDate) {
    if (!expiryDate) return false;
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    return now > expiry;
}

// Handle wallet deposit
function showDepositModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-full max-w-md max-h-90vh overflow-y-auto">
            <h3 class="text-lg font-semibold mb-4">Deposit Funds</h3>
            <form id="deposit-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Amount (PKR)</label>
                    <input type="number" id="deposit-amount" required min="100" step="100"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                    <p class="text-xs text-gray-500 mt-1">Minimum deposit: PKR 100</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Payment Method</label>
                    <select id="deposit-method" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                        <option value="bank">Bank Transfer</option>
                        <option value="easypaisa">Easypaisa</option>
                        <option value="jazzcash">Jazzcash</option>
                        <option value="sadapay">Sadapay</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Account Holder Name</label>
                    <input type="text" id="deposit-account-name" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Account Number</label>
                    <input type="text" id="deposit-account-number" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        placeholder="Enter account number, IBAN, or mobile number">
                </div>
                <div class="flex justify-end space-x-4 mt-6">
                    <button type="button" onclick="this.closest('.fixed').remove()"
                        class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500">
                        Cancel
                    </button>
                    <button type="submit"
                        class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                        Submit Request
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('deposit-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('deposit-amount').value);
        const method = document.getElementById('deposit-method').value;
        const accountName = document.getElementById('deposit-account-name').value;
        const accountNumber = document.getElementById('deposit-account-number').value;
        
        // Create deposit request
        const depositRequest = {
            id: `dep_${Date.now()}`,
            userId: authState.currentUser.id,
            userName: authState.currentUser.name,
            amount: amount,
            method: method,
            accountName: accountName,
            accountNumber: accountNumber,
            status: 'pending',
            timestamp: new Date().toISOString()
        };
        
        // Save to localStorage
        const depositRequests = JSON.parse(localStorage.getItem('depositRequests')) || [];
        depositRequests.push(depositRequest);
        localStorage.setItem('depositRequests', JSON.stringify(depositRequests));
        
        // Add notification
        const walletNotification = {
            id: `notif_${Date.now()}`,
            title: 'Deposit Request Submitted',
            message: `Your deposit request for PKR ${amount.toFixed(2)} has been submitted and is pending approval.`,
            timestamp: new Date().toISOString(),
            isRead: false,
            type: 'deposit'
        };
        
        userEarnings.notifications.unshift(walletNotification);
        saveWalletData();
        
        // Close modal and show confirmation
        modal.remove();
        showToast('Deposit request submitted successfully!');
        
        // Refresh wallet page
        renderWallet();
    });
}

// Handle wallet withdrawal
function showWithdrawModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-full max-w-md max-h-90vh overflow-y-auto">
            <h3 class="text-lg font-semibold mb-4">Withdraw Funds</h3>
            <form id="withdraw-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Amount (PKR)</label>
                    <input type="number" id="withdraw-amount" required min="100" max="${userEarnings.balance}" step="100"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                    <p class="text-xs text-gray-500 mt-1">Available balance: PKR ${userEarnings.balance.toFixed(2)}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Withdrawal Method</label>
                    <select id="withdraw-method" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                        <option value="bank">Bank Transfer</option>
                        <option value="easypaisa">Easypaisa</option>
                        <option value="jazzcash">Jazzcash</option>
                        <option value="sadapay">Sadapay</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Account Holder Name</label>
                    <input type="text" id="withdraw-account-name" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Account Number</label>
                    <input type="text" id="withdraw-account-number" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        placeholder="Enter account number, IBAN, or mobile number">
                </div>
                <div class="flex justify-end space-x-4 mt-6">
                    <button type="button" onclick="this.closest('.fixed').remove()"
                        class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500">
                        Cancel
                    </button>
                    <button type="submit"
                        class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                        Submit Request
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('withdraw-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('withdraw-amount').value);
        const method = document.getElementById('withdraw-method').value;
        const accountName = document.getElementById('withdraw-account-name').value;
        const accountNumber = document.getElementById('withdraw-account-number').value;
        
        // Validate amount
        if (amount > userEarnings.balance) {
            showToast('Insufficient balance');
            return;
        }
        
        // Create withdrawal request
        const withdrawalRequest = {
            id: `with_${Date.now()}`,
            userId: authState.currentUser.id,
            userName: authState.currentUser.name,
            amount: amount,
            method: method,
            accountName: accountName,
            accountNumber: accountNumber,
            status: 'pending',
            timestamp: new Date().toISOString()
        };
        
        // Save to localStorage
        const withdrawalRequests = JSON.parse(localStorage.getItem('withdrawalRequests')) || [];
        withdrawalRequests.push(withdrawalRequest);
        localStorage.setItem('withdrawalRequests', JSON.stringify(withdrawalRequests));
        
        // Add notification
        const walletNotification = {
            id: `notif_${Date.now()}`,
            title: 'Withdrawal Request Submitted',
            message: `Your withdrawal request for PKR ${amount.toFixed(2)} has been submitted and is pending approval.`,
            timestamp: new Date().toISOString(),
            isRead: false,
            type: 'withdrawal'
        };
        
        userEarnings.notifications.unshift(walletNotification);
        saveWalletData();
        
        // Close modal and show confirmation
        modal.remove();
        showToast('Withdrawal request submitted successfully!');
        
        // Refresh wallet page
        renderWallet();
    });
}

// Render wallet transactions list
function renderTransactionsList() {
    if (!userEarnings.transactions || userEarnings.transactions.length === 0) {
        return `
            <div class="text-center py-6">
                <i class="fas fa-exchange-alt text-gray-300 text-4xl mb-3"></i>
                <p class="text-gray-500">No transactions yet</p>
            </div>
        `;
    }
    
    return `
        <div class="divide-y">
            ${userEarnings.transactions.map(transaction => `
                <div class="py-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center mr-3 ${transaction.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}">
                                <i class="fas ${transaction.type === 'credit' ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                            </div>
                            <div>
                                <div class="font-medium">${transaction.description}</div>
                                <p class="text-xs text-gray-500">${formatWalletDate(transaction.date)}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="font-bold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}">
                                ${transaction.type === 'credit' ? '+' : '-'} PKR ${transaction.amount.toFixed(2)}
                            </div>
                            <p class="text-xs text-gray-500">${transaction.status}</p>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Render wallet rewards list
function renderRewardsList() {
    if (!userEarnings.rewards || userEarnings.rewards.length === 0) {
        return `
            <div class="text-center py-6">
                <i class="fas fa-gift text-gray-300 text-4xl mb-3"></i>
                <p class="text-gray-500">No rewards yet</p>
            </div>
        `;
    }
    
    // Add this logging to help debug
    console.log('Rendering rewards list with', userEarnings.rewards.length, 'rewards');
    
    // Ensure this function runs after the rewards are rendered
    setTimeout(() => {
        console.log('Setting up redeem buttons after rendering');
        const redeemButtons = document.querySelectorAll('.redeem-btn');
        redeemButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const rewardId = this.getAttribute('data-reward-id');
                console.log('Redeem button clicked for reward ID:', rewardId);
                directRedemption(rewardId);
            });
        });
    }, 100);
    
    // Sort rewards: active first, then by date (newest first)
    const sortedRewards = [...userEarnings.rewards].sort((a, b) => {
        // Active rewards first
        if (!a.isUsed && b.isUsed) return -1;
        if (a.isUsed && !b.isUsed) return 1;
        // Then sort by date (newest first)
        return new Date(b.date) - new Date(a.date);
    });
    
    return `
        <div class="grid grid-cols-1 gap-4">
            ${sortedRewards.map(reward => `
                <div class="border ${!reward.isUsed ? 'border-green-300 bg-green-50' : 'border-gray-200'} rounded-lg p-4 ${reward.isUsed ? 'opacity-75' : ''}">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center justify-between mb-2">
                                <span class="inline-block px-2 py-1 ${reward.isPending ? 'bg-yellow-100 text-yellow-800' : !reward.isUsed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} rounded-md text-xs font-medium">
                                    ${reward.isPending ? 'Pending Approval' : reward.isUsed ? 'Completed' : 'Available'}
                                </span>
                            </div>
                            
                            <h4 class="font-medium text-lg">${reward.title}</h4>
                            <p class="text-sm text-gray-600 mt-1">${reward.description || 'Reward from admin'}</p>
                            
                            <!-- Enhanced Reward Amount Display -->
                            <div class="flex items-center mt-3 p-2 bg-green-100 rounded-md">
                                <i class="fas fa-coins text-green-600 mr-2"></i>
                                <div>
                                    <span class="font-semibold text-green-800">Reward Amount:</span>
                                    <span class="text-lg font-bold text-green-700 ml-1">PKR ${reward.amount ? reward.amount.toFixed(2) : '0.00'}</span>
                                </div>
                            </div>
                            
                            <p class="text-xs text-gray-500 mt-3">Added: ${formatWalletDate(reward.date || new Date().toISOString())}</p>
                            
                            <!-- Enhanced Expiry Date Display -->
                            ${reward.expiryDate ? `
                            <div class="flex items-center mt-2 p-2 ${isExpired(reward.expiryDate) ? 'bg-red-50 border-red-400' : 'bg-amber-50 border-amber-400'} rounded-md border-l-4">
                                <i class="fas fa-clock ${isExpired(reward.expiryDate) ? 'text-red-600' : 'text-amber-600'} mr-2"></i>
                                <div>
                                    <span class="font-semibold ${isExpired(reward.expiryDate) ? 'text-red-800' : 'text-amber-800'}">${isExpired(reward.expiryDate) ? 'Expired on:' : 'Expires on:'}</span>
                                    <span class="${isExpired(reward.expiryDate) ? 'text-red-700' : 'text-amber-700'} ml-1">${formatWalletDate(reward.expiryDate)}</span>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    ${!reward.isUsed && !reward.isPending ? `
                    <div class="mt-3 pt-3 border-t border-gray-200">
                        ${isExpired(reward.expiryDate) ? `
                        <div class="w-full py-2 bg-gray-400 text-white rounded-md text-sm font-medium text-center cursor-not-allowed">
                            <i class="fas fa-ban mr-1"></i> Expired
                        </div>
                        ` : `
                        <button class="redeem-btn w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition duration-200" data-reward-id="${reward.id}">
                            <i class="fas fa-gift mr-1"></i> Redeem Now
                        </button>
                        `}
                    </div>
                    ` : reward.isPending ? `
                    <div class="mt-3 pt-3 border-t border-gray-200">
                        <div class="w-full py-2 bg-yellow-100 text-yellow-700 rounded-md text-sm font-medium text-center">
                            <i class="fas fa-clock mr-1"></i> Redemption Request Pending
                        </div>
                    </div>
                    ` : `
                    <div class="mt-3 pt-3 border-t border-gray-200">
                        <div class="w-full py-2 bg-blue-500 text-white rounded-md text-sm font-medium text-center">
                            <i class="fas fa-check-circle mr-1"></i> Redeemed
                        </div>
                    </div>
                    `}
                </div>
            `).join('')}
        </div>
    `;
}

// Switch between wallet tabs
function switchWalletTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Deactivate all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Activate selected tab
    document.getElementById(`tab-${tabName}`).classList.add('active');
    document.getElementById(`tab-content-${tabName}`).classList.remove('hidden');
    
    // Load wallet notifications if necessary
    if (tabName === 'notifications') {
        renderWalletNotifications();
    }
}

// Render wallet notifications
function renderWalletNotifications() {
    const container = document.getElementById('notifications-container');
    if (!container) {
        console.error('Notifications container not found');
        return;
    }
    
    // Make sure we have the current user ID
    if (!authState || !authState.isAuthenticated || !authState.currentUser) {
        console.error('User not authenticated');
        return;
    }
    
    const userId = authState.currentUser.id;
    
    // Display a loading message while we process
    container.innerHTML = `
        <div class="text-center p-5 text-gray-500">
            <i class="fas fa-spinner fa-spin text-3xl mb-2"></i>
            <p>Loading notifications...</p>
        </div>
    `;
    
    // Step 1: EXPLICITLY check for admin notifications - DO NOT CLEAR THEM
    const notificationsKey = `notifications_${userId}`;
    const adminNotifications = JSON.parse(localStorage.getItem(notificationsKey)) || [];
    
    console.log(`Found ${adminNotifications.length} admin notifications`);
    
    // Step 2: Add admin notifications to the wallet data if they're not already there
    if (adminNotifications.length > 0) {
        let updated = false;
        
        for (const notification of adminNotifications) {
            // Create a unique ID if not present
            const notificationId = notification.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            
            // Create wallet notification format
            const walletNotification = {
                id: notificationId,
                title: notification.title || 'Notification',
                message: notification.message || '',
                timestamp: notification.timestamp || new Date().toISOString(),
                isRead: false, // Always set as unread to ensure visibility
                type: notification.type || 'wallet',
                fromAdmin: true,
                permanent: true // Mark as permanent so it's never deleted
            };
            
            // Check if it's already in the wallet notifications by comparing essential content
            const exists = userEarnings.notifications.some(n => 
                (n.id === notificationId) || 
                (n.message === notification.message && n.title === notification.title) ||
                (n.timestamp === notification.timestamp && n.message === notification.message)
            );
            
            if (!exists) {
                console.log('Adding new permanent notification to wallet:', walletNotification);
                userEarnings.notifications.unshift(walletNotification);
                updated = true;
            }
        }
        
        if (updated) {
            // Save updates to wallet
            console.log('Saving updated notifications to wallet');
            saveWalletData();
            
            // IMPORTANT: We no longer clear admin notifications to ensure they're not lost
            // This is a safety measure to keep notifications persistent
        }
    }
    
    // Step 3: Create a combined list of all notifications (wallet + admin)
    let allNotifications = [...userEarnings.notifications];
    
    // Add any admin notifications that might not be in the wallet yet (belt and suspenders approach)
    adminNotifications.forEach(notification => {
        const exists = allNotifications.some(n => 
            (n.message === notification.message && n.title === notification.title) ||
            (n.timestamp === notification.timestamp && n.message === notification.message)
        );
        
        if (!exists) {
            allNotifications.push({
                id: notification.id || `notif_temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                title: notification.title || 'Notification',
                message: notification.message || '',
                timestamp: notification.timestamp || new Date().toISOString(),
                isRead: false,
                type: notification.type || 'wallet',
                fromAdmin: true,
                temporary: true // Mark as temporary so we know it needs to be saved to wallet later
            });
        }
    });
    
    // Ensure we have notifications to display
    if (!allNotifications || allNotifications.length === 0) {
        container.innerHTML = `
            <div class="text-center py-6">
                <i class="fas fa-bell text-gray-300 text-4xl mb-3"></i>
                <p class="text-gray-500">No notifications yet</p>
            </div>
        `;
        return;
    }
    
    // Sort notifications by timestamp (newest first)
    allNotifications.sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    console.log('Rendering notifications:', allNotifications.length);
    
    // Group notifications by date (today, yesterday, older)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayNotifications = [];
    const yesterdayNotifications = [];
    const olderNotifications = [];
    const readNotifications = [];
    
    // Categorize notifications
    allNotifications.forEach(notification => {
        const notifDate = new Date(notification.timestamp);
        notifDate.setHours(0, 0, 0, 0);
        
        if (notification.isRead) {
            readNotifications.push(notification);
        } else if (notifDate.getTime() === today.getTime()) {
            todayNotifications.push(notification);
        } else if (notifDate.getTime() === yesterday.getTime()) {
            yesterdayNotifications.push(notification);
        } else {
            olderNotifications.push(notification);
        }
    });
    
    // Add notification header with action buttons
    let headerHTML = `
        <div class="flex items-center justify-between mb-3 px-2">
            <h2 class="text-lg font-bold">Notifications</h2>
            <div class="flex space-x-2">
                ${allNotifications.length > 0 ? 
                    `<button onclick="markAllNotificationsAsRead()" class="px-3 py-1 text-sm bg-green-500 text-white rounded-md shadow-sm">
                        Mark All Read
                    </button>` : ''}
            </div>
        </div>
    `;
    
    // Render notifications with sections
    let notificationsHTML = headerHTML;
    const unreadCount = todayNotifications.length + yesterdayNotifications.length + olderNotifications.length;
    
    // Unread notifications first - organized by date
    if (todayNotifications.length > 0) {
        notificationsHTML += `
            <div class="mb-4">
                <div class="flex items-center justify-between px-3 py-2 bg-gray-50">
                    <h3 class="text-sm font-medium text-gray-500">Today</h3>
                    <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-green-600 bg-green-100 rounded-full">
                        ${todayNotifications.length}
                    </span>
                </div>
                <div class="divide-y">
                    ${renderNotificationGroup(todayNotifications)}
                </div>
            </div>
        `;
    }
    
    if (yesterdayNotifications.length > 0) {
        notificationsHTML += `
            <div class="mb-4">
                <div class="flex items-center justify-between px-3 py-2 bg-gray-50">
                    <h3 class="text-sm font-medium text-gray-500">Yesterday</h3>
                    <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-green-600 bg-green-100 rounded-full">
                        ${yesterdayNotifications.length}
                    </span>
                </div>
                <div class="divide-y">
                    ${renderNotificationGroup(yesterdayNotifications)}
                </div>
            </div>
        `;
    }
    
    if (olderNotifications.length > 0) {
        notificationsHTML += `
            <div class="mb-4">
                <div class="flex items-center justify-between px-3 py-2 bg-gray-50">
                    <h3 class="text-sm font-medium text-gray-500">Older</h3>
                    <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-green-600 bg-green-100 rounded-full">
                        ${olderNotifications.length}
                    </span>
                </div>
                <div class="divide-y">
                    ${renderNotificationGroup(olderNotifications)}
                </div>
            </div>
        `;
    }
    
    // Add read notifications at the bottom if there are any
    if (readNotifications.length > 0) {
        notificationsHTML += `
            <div class="mb-4">
                <div class="flex items-center justify-between px-3 py-2 bg-gray-50">
                    <h3 class="text-sm font-medium text-gray-500">Read</h3>
                    <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-gray-500 bg-gray-200 rounded-full">
                        ${readNotifications.length}
                    </span>
                </div>
                <div class="divide-y">
                    ${renderNotificationGroup(readNotifications)}
                </div>
            </div>
        `;
    }
    
    // If no notifications in any category, show empty state
    if (notificationsHTML === '') {
        notificationsHTML = `
            <div class="text-center py-6">
                <i class="fas fa-bell text-gray-300 text-4xl mb-3"></i>
                <p class="text-gray-500">No notifications yet</p>
            </div>
        `;
    }
    
    container.innerHTML = notificationsHTML;
    
    // Save any temporary notifications to make them permanent
    const tempNotifications = allNotifications.filter(n => n.temporary);
    if (tempNotifications.length > 0) {
        console.log('Saving temporary notifications to make them permanent:', tempNotifications.length);
        
        tempNotifications.forEach(notification => {
            // Remove the temporary flag and add to wallet
            delete notification.temporary;
            notification.permanent = true;
            
            // Add to wallet notifications if not already present
            const exists = userEarnings.notifications.some(n => n.id === notification.id);
            if (!exists) {
                userEarnings.notifications.unshift(notification);
            }
        });
        
        // Save the updated wallet data
        saveWalletData();
    }
}

// Helper function to render a group of notifications
function renderNotificationGroup(notifications) {
    return notifications.map(notification => `
        <div class="py-3 ${notification.isRead ? '' : 'bg-green-50'} ${notification.fromAdmin ? 'border-l-4 border-green-500' : ''}">
            <div class="flex items-start">
                <div class="w-10 h-10 rounded-full flex items-center justify-center mr-3 ${notification.fromAdmin ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}">
                    <i class="fas ${getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="flex-1">
                    <div class="flex justify-between">
                        <div class="font-medium">${notification.title || 'Notification'}</div>
                        <button onclick="markNotificationAsRead('${notification.id}')" class="text-sm text-gray-500">
                            ${notification.isRead ? '' : 'Mark as read'}
                        </button>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">${notification.message}</p>
                    <p class="text-xs text-gray-500 mt-1">${formatWalletDate(notification.timestamp)}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// Get icon based on notification type
function getNotificationIcon(type) {
    switch (type) {
        case 'deposit':
            return 'fa-money-bill-wave';
        case 'withdrawal':
            return 'fa-wallet';
        case 'reward':
            return 'fa-gift';
        case 'transaction':
            return 'fa-exchange-alt';
        case 'wallet':
            return 'fa-wallet';
        default:
            return 'fa-bell';
    }
}

// Mark a notification as read
function markNotificationAsRead(notificationId) {
    const notification = userEarnings.notifications.find(n => n.id === notificationId);
    if (notification) {
        notification.isRead = true;
        saveWalletData();
        renderWalletNotifications();
    }
}

// Mark all notifications as read
function markAllNotificationsAsRead() {
    let updated = false;
    
    // Mark all notifications as read
    userEarnings.notifications.forEach(notification => {
        if (!notification.isRead) {
            notification.isRead = true;
            updated = true;
        }
    });
    
    if (updated) {
        // Save the updates
        saveWalletData();
        
        // Re-render the notifications section
        renderWalletNotifications();
        
        // Show confirmation
        const container = document.getElementById('notifications-container');
        if (container) {
            const confirmationToast = document.createElement('div');
            confirmationToast.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
            confirmationToast.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-check-circle mr-2"></i>
                    <span>All notifications marked as read</span>
                </div>
            `;
            document.body.appendChild(confirmationToast);
            
            // Remove the toast after 3 seconds
            setTimeout(() => {
                document.body.removeChild(confirmationToast);
            }, 3000);
        }
    }
}

// Use a reward (mark as completed)
function useReward(rewardId) {
    const reward = userEarnings.rewards.find(r => r.id === rewardId);
    if (reward) {
        // Mark as used and record completion date
        reward.isUsed = true;
        reward.usedDate = new Date().toISOString();
        
        // Create a notification about the completed reward
        const notification = {
            id: 'notif_reward_completed_' + Date.now(),
            title: 'Reward Completed',
            message: `You've completed a reward: ${reward.title} worth PKR ${reward.amount ? reward.amount.toFixed(2) : '0.00'}`,
            timestamp: new Date().toISOString(),
            status: 'unread',
            type: 'reward',
            fromAdmin: false,
            permanent: true
        };
        
        // Add to wallet notifications
        if (!userEarnings.notifications) {
            userEarnings.notifications = [];
        }
        userEarnings.notifications.unshift(notification);
        
        // Also add to user notifications
        if (authState && authState.currentUser) {
            const userId = authState.currentUser.id;
            const notificationsKey = `notifications_${userId}`;
            const notifications = JSON.parse(localStorage.getItem(notificationsKey)) || [];
            notifications.unshift(notification);
            localStorage.setItem(notificationsKey, JSON.stringify(notifications));
        }
        
        // Save changes
        saveWalletData();
        renderWallet();
        
        // Show success message
        showToast('Reward completed successfully!', 'success');
    }
}

// Start real-time updates for the wallet
function startRealTimeUpdates() {
    // Only initialize real-time updates if not already running
    if (window.walletUpdateInterval) {
        clearInterval(window.walletUpdateInterval);
    }
    
    // Initial update
    loadWalletData();
    
    // Load notifications immediately if the notifications tab exists
    if (document.getElementById('notifications-container')) {
        console.log('Initial rendering of notifications');
        renderWalletNotifications();
    }
    
    // Set interval for updates
    window.walletUpdateInterval = setInterval(() => {
        console.log('Updating wallet data...');
        loadWalletData();
        
        // Update UI based on the active tab
        const activeTabId = document.querySelector('.tab-button.active')?.id;
        if (activeTabId) {
            const tabName = activeTabId.replace('tab-', '');
            if (tabName === 'transactions') {
                renderTransactionsList();
            } else if (tabName === 'rewards') {
                renderRewardsList();
            } else if (tabName === 'notifications') {
                renderWalletNotifications();
            }
        }
    }, 5000); // Update every 5 seconds for quicker response
}

// Stop real-time updates
function stopRealTimeUpdates() {
    if (window.walletUpdateInterval) {
        clearInterval(window.walletUpdateInterval);
    }
}

// Initialize wallet - call this when the app loads
function initializeWallet() {
    // Load wallet data
    loadWalletData();
    
    // Start real-time updates
    startRealTimeUpdates();
    
    // Force refresh notifications and rewards in the background when wallet page is loaded
    setTimeout(() => {
        forceRefreshNotifications();
        refreshRewardsData(); // Explicitly refresh rewards data
    }, 500);
    
    // Ensure the transactions tab is selected by default
    setTimeout(() => {
        // If there's a tab system, make sure transactions tab is active
        const transactionsTab = document.getElementById('tab-transactions');
        const transactionsContent = document.getElementById('tab-content-transactions');
        
        if (transactionsTab && transactionsContent) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.add('hidden');
            });
            
            // Deactivate all tab buttons
            document.querySelectorAll('.tab-button').forEach(button => {
                button.classList.remove('active');
            });
            
            // Show only transactions tab
            transactionsTab.classList.add('active');
            transactionsContent.classList.remove('hidden');
        }
    }, 100);
}

// Force refresh notifications from all sources and sync rewards
function forceRefreshNotifications() {
    if (!authState || !authState.isAuthenticated || !authState.currentUser) {
        console.error('User not authenticated');
        return;
    }

    try {
        const userId = authState.currentUser.id;
        
        // Get the current wallet data first to ensure we have the latest
        const walletKey = `wallet_${userId}`;
        const latestWalletData = JSON.parse(localStorage.getItem(walletKey)) || {
            balance: 0,
            transactions: [],
            rewards: [],
            notifications: []
        };
        
        // Update userEarnings with latest wallet data
        userEarnings = latestWalletData;
        
        // Check for new notifications in the user's notifications store
        const userNotificationsKey = `notifications_${userId}`;
        const adminNotifications = JSON.parse(localStorage.getItem(userNotificationsKey)) || [];
        
        // Log found notifications for debugging
        if (adminNotifications && adminNotifications.length > 0) {
            console.log(`Found ${adminNotifications.length} admin notifications to sync`);
            
            // Process each notification
            let hasNewNotifications = false;
            for (const notification of adminNotifications) {
                // Create a proper notification object
                const walletNotification = {
                    id: notification.id || `admin_notif_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
                    title: notification.title || 'Notification',
                    message: notification.message || '',
                    timestamp: notification.timestamp || new Date().toISOString(),
                    isRead: false,
                    type: notification.type || 'wallet',
                    fromAdmin: true
                };
                
                // Add to userEarnings notifications
                userEarnings.notifications.unshift(walletNotification);
                hasNewNotifications = true;
            }
            
            if (hasNewNotifications) {
                // Save wallet data
                saveWalletData();
                
                // Clear the original notifications to prevent duplication
                localStorage.setItem(userNotificationsKey, JSON.stringify([]));
                
                // Update the UI if needed
                const notificationsContainer = document.getElementById('notifications-container');
                if (notificationsContainer) {
                    renderWalletNotifications();
                }
                
                // Update notification badge if it exists
                updateNotificationBadge();
            }
        }
        
        // CRITICAL FIX: Check if we need to reload the rewards tab to display latest rewards
        const rewardsTabContent = document.getElementById('tab-content-rewards');
        if (rewardsTabContent) {
            console.log('Refreshing rewards tab with latest data');
            rewardsTabContent.innerHTML = renderRewardsList();
        }
    } catch (error) {
        console.error('Error refreshing notifications and rewards:', error);
    }
}

// Function to specifically refresh rewards data
function refreshRewardsData() {
    if (!authState || !authState.isAuthenticated || !authState.currentUser) {
        console.error('User not authenticated');
        return;
    }
    
    try {
        const userId = authState.currentUser.id;
        const walletKey = `wallet_${userId}`;
        
        // Get latest wallet data from localStorage
        const walletData = JSON.parse(localStorage.getItem(walletKey)) || {
            balance: 0,
            transactions: [],
            rewards: [],
            notifications: []
        };
        
        // Check if rewards array exists and update userEarnings with it
        if (walletData.rewards && Array.isArray(walletData.rewards)) {
            userEarnings.rewards = walletData.rewards;
            console.log(`Refreshed rewards data: found ${userEarnings.rewards.length} rewards`);
        } else {
            // Ensure rewards array exists
            userEarnings.rewards = [];
        }
        
        // Save updated wallet data back to localStorage
        saveWalletData();
        
        // Update the rewards UI if rewards tab content exists
        const rewardsTabContent = document.getElementById('tab-content-rewards');
        if (rewardsTabContent) {
            console.log('Updating rewards tab content with latest data');
            rewardsTabContent.innerHTML = renderRewardsList();
            
            // Add event listeners to the newly rendered redeem buttons
            setTimeout(() => attachRewardButtonListeners(), 100);
        }
    } catch (error) {
        console.error('Error refreshing rewards data:', error);
    }
}

// Use a reward - opens redemption form with WhatsApp number
// Make this function accessible globally to ensure the button's onclick works
window.useReward = function(rewardId) {
    console.log('useReward called with reward ID:', rewardId);
    if (!authState || !authState.isAuthenticated || !authState.currentUser) {
        alert('You must be logged in to redeem this reward');
        return;
    }
    
    try {
        // Find the reward in userEarnings
        const reward = userEarnings.rewards.find(r => r.id === rewardId);
        
        if (!reward) {
            alert('Reward not found');
            return;
        }
        
        if (reward.isUsed) {
            alert('This reward has already been redeemed');
            return;
        }
        
        if (reward.isPending) {
            alert('This reward redemption is already pending approval');
            return;
        }
        
        // Create modal for WhatsApp number input
        const modalContainer = document.createElement('div');
        modalContainer.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
        
        modalContainer.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Redeem Reward</h3>
                    <button type="button" onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="mb-4">
                    <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                        <div class="flex items-start">
                            <div class="flex-shrink-0 mt-0.5">
                                <i class="fas fa-gift text-green-600"></i>
                            </div>
                            <div class="ml-3">
                                <h4 class="font-medium text-green-800">${reward.title}</h4>
                                <p class="text-sm text-green-700">${reward.description || 'Reward from Emomer'}</p>
                                <p class="text-sm font-bold text-green-800 mt-1">PKR ${reward.amount ? reward.amount.toFixed(2) : '0.00'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <p class="text-sm text-gray-600 mb-4">Please provide your WhatsApp number to receive this reward.</p>
                    
                    <form id="redeem-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                            <input type="text" id="whatsapp-number" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="e.g. +923001234567">
                            <p class="text-xs text-gray-500 mt-1">Please include country code (e.g. +92 for Pakistan)</p>
                        </div>
                        
                        <div class="mt-5">
                            <button type="button" onclick="submitRewardRedemption('${rewardId}')" 
                                class="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-200">
                                Submit Redemption Request
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalContainer);
    } catch (error) {
        console.error('Error preparing reward redemption:', error);
        alert('There was an error preparing this reward for redemption');
    }
}

// Submit reward redemption request
// Make this function accessible globally to ensure the form submission works
window.submitRewardRedemption = function(rewardId) {
    console.log('submitRewardRedemption called with reward ID:', rewardId);
    if (!authState || !authState.isAuthenticated || !authState.currentUser) {
        alert('You must be logged in to redeem this reward');
        return;
    }
    
    const whatsappNumber = document.getElementById('whatsapp-number').value.trim();
    if (!whatsappNumber) {
        alert('Please enter your WhatsApp number');
        return;
    }
    
    try {
        // Find the reward in userEarnings
        const reward = userEarnings.rewards.find(r => r.id === rewardId);
        
        if (!reward) {
            alert('Reward not found');
            return;
        }
        
        if (reward.isUsed) {
            alert('This reward has already been redeemed');
            return;
        }
        
        if (reward.isPending) {
            alert('This reward redemption is already pending approval');
            return;
        }
        
        // Get current user information
        const userId = authState.currentUser.id;
        const userName = authState.currentUser.name;
        const userEmail = authState.currentUser.email;
        
        // Create reward redemption request
        const redemptionRequest = {
            id: `redeem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: userId,
            userName: userName,
            userEmail: userEmail,
            rewardId: rewardId,
            rewardTitle: reward.title,
            rewardAmount: reward.amount,
            rewardDescription: reward.description || 'Reward from Emomer',
            whatsappNumber: whatsappNumber,
            date: new Date().toISOString(),
            status: 'pending'
        };
        
        // Add request to rewardRedemptionRequests in localStorage
        const requests = JSON.parse(localStorage.getItem('rewardRedemptionRequests')) || [];
        requests.unshift(redemptionRequest);
        console.log('Submitting reward redemption request:', redemptionRequest);
        console.log('Total redemption requests after adding:', requests.length);
        
        try {
            localStorage.setItem('rewardRedemptionRequests', JSON.stringify(requests));
            console.log('Successfully saved rewardRedemptionRequests to localStorage');
        } catch (storageError) {
            console.error('Error saving redemption request to localStorage:', storageError);
            alert('There was an error saving your redemption request. Please try again.');
            return;
        }
        
        // Mark reward as pending and redeemed in user's wallet
        reward.isPending = true;
        reward.isRedeemed = true; // Set redeemed flag to true permanently
        reward.redemptionRequestId = redemptionRequest.id;
        
        // Update local storage
        saveWalletData();
        
        // Add notification to user
        const notification = {
            id: `notif_redeem_${Date.now()}`,
            title: 'Reward Redemption Requested',
            message: `Your request to redeem ${reward.title} has been submitted and is pending approval.`,
            timestamp: new Date().toISOString(),
            isRead: false,
            type: 'reward'
        };
        
        if (!userEarnings.notifications) {
            userEarnings.notifications = [];
        }
        
        userEarnings.notifications.unshift(notification);
        saveWalletData();
        
        // Add to admin notifications
        const adminNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
        adminNotifications.unshift({
            message: `New reward redemption request from ${userName} for ${reward.title} (PKR ${reward.amount.toFixed(2)})`,
            timestamp: new Date().toISOString(),
            type: 'reward_redemption',
            icon: 'fa-gift',
            user: userName
        });
        localStorage.setItem('notifications', JSON.stringify(adminNotifications));
        
        // Close the modal
        document.querySelector('.fixed').remove();
        
        // Show success message
        showToast('Redemption request submitted successfully');
        
        // Refresh rewards list
        const rewardsTabContent = document.getElementById('tab-content-rewards');
        if (rewardsTabContent) {
            rewardsTabContent.innerHTML = renderRewardsList();
        }
    } catch (error) {
        console.error('Error submitting redemption request:', error);
        alert('There was an error submitting your redemption request');
    }
}

// Ensure we have a showToast function available
if (typeof window.showToast !== 'function') {
    // Define a fallback if the function doesn't exist in the global scope
    window.showToast = function(message) {
        console.log('Toast message:', message);
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg shadow-lg z-50';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    };
}

// Add event delegation for reward redemption buttons
function attachRewardButtonListeners() {
    console.log('Setting up reward button event listeners');
    
    // Get the rewards container
    const rewardsContainer = document.getElementById('tab-content-rewards');
    if (!rewardsContainer) {
        console.log('Rewards container not found, will try again later');
        return;
    }
    
    // Remove any existing listeners to prevent duplicates
    rewardsContainer.removeEventListener('click', handleRewardButtonClick);
    
    // Add the event listener for all reward buttons using delegation
    rewardsContainer.addEventListener('click', handleRewardButtonClick);
    console.log('Reward button listeners attached');
}

// Handle clicks on redeem buttons via delegation
function handleRewardButtonClick(event) {
    // Check if the clicked element is a redeem button or its child
    const button = event.target.closest('.redeem-reward-btn');
    if (!button) return; // Not a redeem button
    
    // Get the reward ID from the data attribute
    const rewardId = button.getAttribute('data-reward-id');
    if (!rewardId) {
        console.error('No reward ID found on button');
        return;
    }
    
    console.log('Redeem button clicked for reward ID:', rewardId);
    // Call the useReward function with the reward ID
    useReward(rewardId);
}

// Direct redemption function - simplified approach for one-click redemption
function directRedemption(rewardId) {
    console.log('Direct redemption initiated for reward ID:', rewardId);
    
    if (!authState || !authState.isAuthenticated || !authState.currentUser) {
        alert('You must be logged in to redeem this reward');
        return;
    }
    
    try {
        // Find the reward in userEarnings
        const reward = userEarnings.rewards.find(r => r.id === rewardId);
        
        if (!reward) {
            alert('Reward not found');
            return;
        }
        
        if (reward.isUsed) {
            alert('This reward has already been redeemed');
            return;
        }
        
        if (reward.isPending) {
            alert('This reward redemption is already pending approval');
            return;
        }
        
        // Show simple prompt for WhatsApp number
        const whatsappNumber = prompt('Please enter your WhatsApp number (with country code):', '');
        
        if (!whatsappNumber || whatsappNumber.trim() === '') {
            alert('WhatsApp number is required to process your redemption');
            return;
        }
        
        // Get current user information
        const userId = authState.currentUser.id;
        const userName = authState.currentUser.name || authState.currentUser.email;
        const userEmail = authState.currentUser.email;
        
        // Create reward redemption request
        const redemptionRequest = {
            id: `redeem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: userId,
            userName: userName,
            userEmail: userEmail,
            rewardId: rewardId,
            rewardTitle: reward.title,
            rewardAmount: reward.amount,
            rewardDescription: reward.description || 'Reward from Emomer',
            whatsappNumber: whatsappNumber,
            date: new Date().toISOString(),
            status: 'pending'
        };
        
        // Get existing requests or initialize empty array
        const existingRequestsString = localStorage.getItem('rewardRedemptionRequests');
        console.log('Existing requests string:', existingRequestsString);
        
        let requests = [];
        try {
            if (existingRequestsString) {
                requests = JSON.parse(existingRequestsString);
                if (!Array.isArray(requests)) {
                    console.warn('rewardRedemptionRequests is not an array, initializing new array');
                    requests = [];
                }
            }
        } catch (parseError) {
            console.error('Error parsing existing redemption requests:', parseError);
            requests = [];
        }
        
        // Add new request to the beginning of the array
        requests.unshift(redemptionRequest);
        console.log('Submitting redemption request:', redemptionRequest);
        console.log('Total redemption requests after adding:', requests.length);
        
        // Save back to localStorage
        try {
            localStorage.setItem('rewardRedemptionRequests', JSON.stringify(requests));
            console.log('Successfully saved rewardRedemptionRequests to localStorage');
        } catch (storageError) {
            console.error('Error saving redemption request to localStorage:', storageError);
            alert('Error saving your redemption request. Please try again.');
            return;
        }
        
        // Mark reward as pending and redeemed in user's wallet
        reward.isPending = true;
        reward.isRedeemed = true; // Set redeemed flag to true permanently
        reward.redemptionRequestId = redemptionRequest.id;
        
        // Update local wallet data
        saveWalletData();
        
        // Add notification to user
        const notification = {
            id: `notif_redeem_${Date.now()}`,
            title: 'Reward Redemption Requested',
            message: `Your request to redeem ${reward.title} has been submitted and is pending approval.`,
            timestamp: new Date().toISOString(),
            isRead: false,
            type: 'reward'
        };
        
        if (!userEarnings.notifications) {
            userEarnings.notifications = [];
        }
        
        userEarnings.notifications.unshift(notification);
        saveWalletData();
        
        // Add to admin notifications
        const adminNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
        adminNotifications.unshift({
            message: `New reward redemption request from ${userName} for ${reward.title} (PKR ${reward.amount.toFixed(2)})`,
            timestamp: new Date().toISOString(),
            type: 'reward_redemption',
            icon: 'fa-gift',
            user: userName
        });
        localStorage.setItem('notifications', JSON.stringify(adminNotifications));
        
        // Update UI elements across the application
        refreshRewardsData();
        
        // Force a refresh of the admin panel data using a custom event
        try {
            // This event will be picked up by the admin panel if it's open in another tab
            localStorage.setItem('lastRedemptionRequest', Date.now().toString());
            
            // Log so we can confirm this is happening
            console.log('Dispatched redemption request update signal');
        } catch (e) {
            console.error('Could not dispatch admin update signal:', e);
        }
        
        // Show better success notification using toast and alert
        showToast('Redemption request submitted successfully!');
        alert('Your reward redemption request has been submitted successfully! The admin will review your request shortly.');
        
        // Update wallet.js UI - Change Redeem Now button to Redeemed
        const rewardElement = document.querySelector(`[data-reward-id="${rewardId}"]`)?.closest('.bg-white');
        if (rewardElement) {
            // Find and replace the Redeem Now button
            const redeemButton = rewardElement.querySelector('.redeem-btn');
            if (redeemButton) {
                // Replace with a Redeemed indicator
                const redeemContainer = redeemButton.parentNode;
                redeemContainer.innerHTML = `
                    <div class="w-full py-2 bg-blue-500 text-white rounded-md text-sm font-medium text-center">
                        <i class="fas fa-check-circle mr-1"></i> Redeemed
                    </div>
                `;
            }
            
            // Add a pending status indicator
            const statusIndicator = document.createElement('div');
            statusIndicator.className = 'bg-yellow-100 text-yellow-800 rounded-md p-2 mt-2 text-center text-sm';
            statusIndicator.innerHTML = '<i class="fas fa-clock mr-1"></i> Request Submitted - Waiting for Approval';
            rewardElement.appendChild(statusIndicator);
        }
        
        // Update app.js UI - Find and update any instances in the main app
        try {
            // Use a custom event to notify app.js to update its UI
            window.dispatchEvent(new CustomEvent('reward:redeemed', { detail: { rewardId } }));
        } catch (e) {
            console.error('Could not dispatch reward:redeemed event:', e);
        }
        
    } catch (error) {
        console.error('Error processing direct redemption:', error);
        alert('There was an error processing your redemption request. Please try again.');
    }
}

// Add document ready event to ensure proper initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded, initializing wallet components');
    
    // Add a click event listener to the document for handling reward button clicks
    document.addEventListener('click', function(event) {
        const button = event.target.closest('.redeem-reward-btn');
        if (button) {
            const rewardId = button.getAttribute('data-reward-id');
            if (rewardId) {
                console.log('Redeem button clicked via global handler, reward ID:', rewardId);
                useReward(rewardId);
            }
        }
    });
    
    // Load wallet immediately if auth state is available
    if (typeof authState !== 'undefined') {
        console.log('Auth state available, loading wallet');
        loadWalletData();
        // Check for rewards tab and attach listeners if it exists
        const rewardsTabContent = document.getElementById('tab-content-rewards');
        if (rewardsTabContent) {
            console.log('Rewards tab found, attaching listeners');
            attachRewardButtonListeners();
        }
    }
});

// Legacy wallet loader - keep for compatibility
if (typeof authState !== 'undefined') {
    loadWalletData();
}
