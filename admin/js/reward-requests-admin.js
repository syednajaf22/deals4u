/**
 * Reward Requests Management for Admin Panel
 * Handles approval/rejection of reward redemption requests
 */

// Load reward requests when section is selected
document.addEventListener('DOMContentLoaded', function() {
    // Add click handler for the reward requests navigation link
    const rewardRequestsLink = document.querySelector('.sidebar nav a[href="#reward-requests"]');
    if (rewardRequestsLink) {
        rewardRequestsLink.addEventListener('click', function() {
            loadRewardRequests();
        });
    }
    
    // Search event listener
    const searchInput = document.getElementById('reward-request-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchRewardRequests();
        });
    }
    
    // Initialize reward requests immediately (before user clicks the link)
    // This ensures the section is ready to show requests as soon as they're submitted
    console.log('Initializing reward requests management');
    refreshRewardRequests();
    
    // Set up automatic refresh every 15 seconds (more frequent updates)
    setInterval(function() {
        if (document.getElementById('reward-requests').classList.contains('active')) {
            console.log('Auto-refreshing reward requests');
            refreshRewardRequests();
        }
    }, 15000);
    
    // Listen for localStorage changes that might indicate new redemption requests
    window.addEventListener('storage', function(event) {
        // If rewardRedemptionRequests was modified in another tab/window
        if ((event.key === 'rewardRedemptionRequests' || event.key === 'lastRedemptionRequest') && 
            document.getElementById('reward-requests').classList.contains('active')) {
            console.log('Detected redemption requests update, refreshing...');
            refreshRewardRequests();
        }
    });
    
    // Set up periodic check for lastRedemptionRequest changes
    let lastKnownRedemptionTime = localStorage.getItem('lastRedemptionRequest') || '0';
    setInterval(function() {
        const currentRedemptionTime = localStorage.getItem('lastRedemptionRequest') || '0';
        if (currentRedemptionTime !== lastKnownRedemptionTime) {
            lastKnownRedemptionTime = currentRedemptionTime;
            if (document.getElementById('reward-requests').classList.contains('active')) {
                console.log('New redemption request detected via timestamp check');
                refreshRewardRequests();
            }
        }
    }, 5000); // Check every 5 seconds
});

/**
 * Load reward redemption requests section
 */
function loadRewardRequests() {
    console.log('Loading reward requests section');
    
    // Show the section
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('reward-requests').classList.add('active');
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar nav a').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector('.sidebar nav a[href="#reward-requests"]').classList.add('active');
    
    // Load reward requests list
    refreshRewardRequests();
}

/**
 * Refresh the reward requests list
 */
function refreshRewardRequests() {
    const requestsList = document.getElementById('reward-requests-list');
    if (!requestsList) {
        console.error('Could not find reward-requests-list element');
        return;
    }
    
    console.log('Refreshing reward requests list...');
    
    // Display loading indicator
    requestsList.innerHTML = `
        <tr>
            <td colspan="8" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading reward requests...</p>
            </td>
        </tr>
    `;
    
    // Get reward redemption requests from localStorage
    let requests = [];
    try {
        const requestsData = localStorage.getItem('rewardRedemptionRequests');
        console.log('Raw reward requests data:', requestsData);
        
        if (requestsData) {
            requests = JSON.parse(requestsData);
            console.log(`Found ${requests.length} reward redemption requests`);
        } else {
            console.log('No reward redemption requests found in localStorage');
        }
    } catch (error) {
        console.error('Error loading reward requests:', error);
    }
    
    if (requests.length === 0) {
        requestsList.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <i class="fas fa-gift text-muted fa-2x mb-3"></i>
                    <p>No reward redemption requests found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort requests by date (newest first)
    requests.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Generate HTML for requests list
    let requestsHTML = '';
    
    requests.forEach((request, index) => {
        const formattedDate = new Date(request.date).toLocaleString();
        let statusClass = '';
        
        switch (request.status) {
            case 'pending':
                statusClass = 'bg-warning';
                break;
            case 'approved':
                statusClass = 'bg-success';
                break;
            case 'rejected':
                statusClass = 'bg-danger';
                break;
            default:
                statusClass = 'bg-secondary';
        }
        
        requestsHTML += `
            <tr>
                <td><small class="text-muted">${request.id.substring(0, 10)}...</small></td>
                <td>
                    <div class="d-flex align-items-center">
                        <div>
                            <div class="fw-bold">${request.userName}</div>
                            <div class="small text-muted">${request.userEmail}</div>
                        </div>
                    </div>
                </td>
                <td>${request.rewardTitle}</td>
                <td class="fw-bold text-success">PKR ${request.rewardAmount ? request.rewardAmount.toFixed(2) : '0.00'}</td>
                <td><code>${request.whatsappNumber}</code></td>
                <td>${formattedDate}</td>
                <td><span class="badge ${statusClass}">${request.status.toUpperCase()}</span></td>
                <td>
                    ${request.status === 'pending' ? `
                        <button class="btn btn-sm btn-success me-1" onclick="approveRewardRequest('${request.id}')">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="rejectRewardRequest('${request.id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-info" onclick="viewRewardRequestDetails('${request.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    `}
                </td>
            </tr>
        `;
    });
    
    requestsList.innerHTML = requestsHTML;
}

/**
 * Search reward requests
 */
function searchRewardRequests() {
    const searchTerm = document.getElementById('reward-request-search').value.toLowerCase();
    const requestsList = document.getElementById('reward-requests-list');
    
    if (!requestsList) return;
    
    // Check if we need to load requests first
    if (requestsList.children.length === 1 && requestsList.children[0].cells && requestsList.children[0].cells.length === 1) {
        refreshRewardRequests();
        return;
    }
    
    // Hide/show rows based on search term
    const rows = requestsList.getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const text = row.textContent.toLowerCase();
        
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }
}

/**
 * Approve a reward redemption request
 * @param {string} requestId - Request ID
 */
function approveRewardRequest(requestId) {
    if (!confirm('Are you sure you want to approve this redemption request?')) {
        return;
    }
    
    try {
        // Get the request from localStorage
        const requests = JSON.parse(localStorage.getItem('rewardRedemptionRequests')) || [];
        const requestIndex = requests.findIndex(req => req.id === requestId);
        
        if (requestIndex === -1) {
            alert('Request not found');
            return;
        }
        
        const request = requests[requestIndex];
        
        // Update request status
        request.status = 'approved';
        request.processedDate = new Date().toISOString();
        request.processedBy = sessionStorage.getItem('adminName') || 'Admin';
        
        // Update the request in localStorage
        requests[requestIndex] = request;
        localStorage.setItem('rewardRedemptionRequests', JSON.stringify(requests));
        
        // Update the user's reward status in wallet
        const userId = request.userId;
        const rewardId = request.rewardId;
        const walletKey = `wallet_${userId}`;
        const walletData = JSON.parse(localStorage.getItem(walletKey)) || {
            balance: 0,
            transactions: [],
            rewards: [],
            notifications: []
        };
        
        // Find the reward and mark it as used
        const rewardIndex = walletData.rewards.findIndex(r => r.id === rewardId);
        
        if (rewardIndex !== -1) {
            walletData.rewards[rewardIndex].isUsed = true;
            walletData.rewards[rewardIndex].isPending = false;
            walletData.rewards[rewardIndex].usedDate = new Date().toISOString();
            walletData.rewards[rewardIndex].redemptionApproved = true;
            
            // Add the reward amount to the user's wallet balance
            const rewardAmount = request.rewardAmount || walletData.rewards[rewardIndex].amount || 0;
            
            if (rewardAmount > 0) {
                console.log(`Adding reward amount ${rewardAmount} to user ${userId} wallet balance`);
                
                // Add to wallet balance
                walletData.balance = (parseFloat(walletData.balance) || 0) + parseFloat(rewardAmount);
                
                // Create a transaction record
                const transaction = {
                    id: `trans_reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'credit',
                    amount: rewardAmount,
                    description: `Reward redemption: ${request.rewardTitle}`,
                    date: new Date().toISOString(),
                    status: 'completed',
                    source: 'reward',
                    rewardId: rewardId
                };
                
                // Add transaction to wallet
                if (!walletData.transactions) {
                    walletData.transactions = [];
                }
                walletData.transactions.unshift(transaction);
            }
            
            // Save updated wallet data
            localStorage.setItem(walletKey, JSON.stringify(walletData));
        }
        
        // Add notification for user
        const notification = {
            id: `notif_reward_approved_${Date.now()}`,
            title: 'Reward Redemption Approved',
            message: `Your request to redeem "${request.rewardTitle}" has been approved. PKR ${parseFloat(request.rewardAmount).toFixed(2)} has been added to your wallet balance. Please check your WhatsApp (${request.whatsappNumber}) for further instructions.`,
            timestamp: new Date().toISOString(),
            status: 'unread',
            type: 'reward',
            fromAdmin: true,
            amount: request.rewardAmount
        };
        
        // Save notification
        const notificationsKey = `notifications_${userId}`;
        const notifications = JSON.parse(localStorage.getItem(notificationsKey)) || [];
        notifications.unshift(notification);
        localStorage.setItem(notificationsKey, JSON.stringify(notifications));
        
        // Add to admin notifications
        const adminNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
        adminNotifications.unshift({
            message: `Approved reward redemption for ${request.userName}: ${request.rewardTitle} (PKR ${request.rewardAmount.toFixed(2)})`,
            timestamp: new Date().toISOString(),
            type: 'reward_redemption',
            icon: 'fa-check-circle',
            admin: sessionStorage.getItem('adminName') || 'Admin'
        });
        localStorage.setItem('notifications', JSON.stringify(adminNotifications));
        
        // Show success message
        alert('Reward redemption request approved successfully');
        
        // Refresh the list
        refreshRewardRequests();
    } catch (error) {
        console.error('Error approving reward request:', error);
        alert('There was an error approving the reward request');
    }
}

/**
 * Reject a reward redemption request
 * @param {string} requestId - Request ID
 */
function rejectRewardRequest(requestId) {
    const reason = prompt('Please provide a reason for rejecting this request (will be shown to user):');
    if (reason === null) return; // User canceled
    
    try {
        // Get the request from localStorage
        const requests = JSON.parse(localStorage.getItem('rewardRedemptionRequests')) || [];
        const requestIndex = requests.findIndex(req => req.id === requestId);
        
        if (requestIndex === -1) {
            alert('Request not found');
            return;
        }
        
        const request = requests[requestIndex];
        
        // Update request status
        request.status = 'rejected';
        request.rejectionReason = reason || 'Request rejected by admin';
        request.processedDate = new Date().toISOString();
        request.processedBy = sessionStorage.getItem('adminName') || 'Admin';
        
        // Update the request in localStorage
        requests[requestIndex] = request;
        localStorage.setItem('rewardRedemptionRequests', JSON.stringify(requests));
        
        // Update the user's reward status in wallet
        const userId = request.userId;
        const rewardId = request.rewardId;
        const walletKey = `wallet_${userId}`;
        const walletData = JSON.parse(localStorage.getItem(walletKey)) || {
            balance: 0,
            transactions: [],
            rewards: [],
            notifications: []
        };
        
        // Find the reward and revert it to available (not pending)
        const rewardIndex = walletData.rewards.findIndex(r => r.id === rewardId);
        
        if (rewardIndex !== -1) {
            walletData.rewards[rewardIndex].isPending = false;
            
            // Save updated wallet data
            localStorage.setItem(walletKey, JSON.stringify(walletData));
        }
        
        // Add notification for user
        const notification = {
            id: `notif_reward_rejected_${Date.now()}`,
            title: 'Reward Redemption Rejected',
            message: `Your request to redeem "${request.rewardTitle}" has been rejected. Reason: ${reason || 'Request rejected by admin'}`,
            timestamp: new Date().toISOString(),
            status: 'unread',
            type: 'reward',
            fromAdmin: true
        };
        
        // Save notification
        const notificationsKey = `notifications_${userId}`;
        const notifications = JSON.parse(localStorage.getItem(notificationsKey)) || [];
        notifications.unshift(notification);
        localStorage.setItem(notificationsKey, JSON.stringify(notifications));
        
        // Add to admin notifications
        const adminNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
        adminNotifications.unshift({
            message: `Rejected reward redemption for ${request.userName}: ${request.rewardTitle} (PKR ${request.rewardAmount.toFixed(2)})`,
            timestamp: new Date().toISOString(),
            type: 'reward_redemption',
            icon: 'fa-times-circle',
            admin: sessionStorage.getItem('adminName') || 'Admin'
        });
        localStorage.setItem('notifications', JSON.stringify(adminNotifications));
        
        // Show success message
        alert('Reward redemption request rejected successfully');
        
        // Refresh the list
        refreshRewardRequests();
    } catch (error) {
        console.error('Error rejecting reward request:', error);
        alert('There was an error rejecting the reward request');
    }
}

/**
 * View reward redemption request details
 * @param {string} requestId - Request ID
 */
function viewRewardRequestDetails(requestId) {
    try {
        // Get the request from localStorage
        const requests = JSON.parse(localStorage.getItem('rewardRedemptionRequests')) || [];
        const request = requests.find(req => req.id === requestId);
        
        if (!request) {
            alert('Request not found');
            return;
        }
        
        // Format dates
        const submittedDate = new Date(request.date).toLocaleString();
        const processedDate = request.processedDate ? new Date(request.processedDate).toLocaleString() : 'N/A';
        
        // Create modal for viewing request details
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = `
            <div class="modal fade" id="rewardRequestModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">Reward Redemption Request Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-4">
                                <div class="col-md-6">
                                    <h5 class="border-bottom pb-2">Request Information</h5>
                                    <p><strong>Request ID:</strong> <small class="text-muted">${request.id}</small></p>
                                    <p><strong>Status:</strong> <span class="badge ${request.status === 'approved' ? 'bg-success' : request.status === 'rejected' ? 'bg-danger' : 'bg-warning'}">${request.status.toUpperCase()}</span></p>
                                    <p><strong>Submitted:</strong> ${submittedDate}</p>
                                    <p><strong>Processed:</strong> ${processedDate}</p>
                                    ${request.processedBy ? `<p><strong>Processed By:</strong> ${request.processedBy}</p>` : ''}
                                    ${request.rejectionReason ? `<p><strong>Rejection Reason:</strong> ${request.rejectionReason}</p>` : ''}
                                </div>
                                <div class="col-md-6">
                                    <h5 class="border-bottom pb-2">User Information</h5>
                                    <p><strong>Name:</strong> ${request.userName}</p>
                                    <p><strong>Email:</strong> ${request.userEmail}</p>
                                    <p><strong>WhatsApp:</strong> <code>${request.whatsappNumber}</code></p>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-12">
                                    <h5 class="border-bottom pb-2">Reward Information</h5>
                                    <div class="card bg-light">
                                        <div class="card-body">
                                            <div class="d-flex">
                                                <div class="flex-shrink-0">
                                                    <div class="rounded-circle bg-success text-white p-3">
                                                        <i class="fas fa-gift"></i>
                                                    </div>
                                                </div>
                                                <div class="ms-3">
                                                    <h5>${request.rewardTitle}</h5>
                                                    <p class="text-muted">${request.rewardDescription || 'No description available'}</p>
                                                    <p class="font-weight-bold text-success">PKR ${request.rewardAmount.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            ${request.status === 'pending' ? `
                                <button type="button" class="btn btn-success" onclick="approveRewardRequest('${request.id}')">Approve</button>
                                <button type="button" class="btn btn-danger" onclick="rejectRewardRequest('${request.id}')">Reject</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalContainer);
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('rewardRequestModal'));
        modal.show();
        
        // Remove modal from DOM when hidden
        document.getElementById('rewardRequestModal').addEventListener('hidden.bs.modal', function() {
            document.body.removeChild(modalContainer);
        });
    } catch (error) {
        console.error('Error viewing reward request details:', error);
        alert('There was an error viewing the reward request details');
    }
}
