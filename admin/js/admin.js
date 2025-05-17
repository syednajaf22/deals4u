// Admin credentials
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// Check if admin is logged in
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');

    if (isLoggedIn === 'true') {
        loginContainer.style.display = 'none';
        dashboardContainer.style.display = 'flex';
        loadDashboardMetrics();
        loadNotifications(); // Load notifications when dashboard is shown
    } else {
        loginContainer.style.display = 'flex';
        dashboardContainer.style.display = 'none';
    }
}

// Handle admin login
function handleAdminLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        checkAuth();
    } else {
        alert('Invalid credentials! Please use admin/admin123');
    }
}

// Logout function
function handleLogout() {
    sessionStorage.removeItem('adminLoggedIn');
    checkAuth();
}

console.log(JSON.parse(localStorage.getItem('products')));

// Initialize local storage with sample data if empty
function initializeLocalStorage() {
    // Initialize products from data.js if not available
    if (!localStorage.getItem('products') || JSON.parse(localStorage.getItem('products')).length === 0) {
        // Try to fetch products data from data.js
        fetch('../js/data.js')
            .then(response => response.text())
            .then(data => {
                try {
                    // Extract products array declaration from the file
                    const productsMatch = data.match(/const\s+products\s*=\s*(\[\s*\{[\s\S]*?\}\s*\])\s*;/);
                    if (productsMatch && productsMatch[1]) {
                        // Use eval in a controlled manner to parse the products array
                        // This is generally not recommended but is acceptable in this admin context
                        // for parsing static product data
                        const productData = eval('(' + productsMatch[1] + ')');
                        localStorage.setItem('products', JSON.stringify(productData));
                        console.log('Loaded products from data.js:', productData.length);
                        // Refresh any product-dependent displays
                        loadDashboardMetrics();
                        if (document.querySelector('#orders').classList.contains('active')) {
                            loadOrders();
                        }
                    }
                } catch (error) {
                    console.error('Error parsing products from data.js:', error);
                    // Fallback: create sample products
                    const sampleProducts = [
                        {
                            id: 1,
                            name: 'Premium Smartphone',
                            price: 799,
                            category: 'Electronics',
                            image: 'https://placehold.co/400x500?text=Smartphone'
                        },
                        {
                            id: 2,
                            name: 'Designer Watch',
                            price: 299,
                            category: 'Accessories',
                            image: 'https://placehold.co/400x500?text=Watch'
                        },
                        {
                            id: 7,
                            name: 'Luxury Perfume',
                            price: 1799,
                            category: 'Beauty',
                            image: 'https://placehold.co/400x500?text=Perfume'
                        }
                    ];
                    localStorage.setItem('products', JSON.stringify(sampleProducts));
                }
            })
            .catch(error => {
                console.error('Error loading data.js:', error);
                // Fallback if fetch fails
                const sampleProducts = [
                    {
                        id: 1,
                        name: 'Premium Smartphone',
                        price: 799,
                        category: 'Electronics',
                        image: 'https://placehold.co/400x500?text=Smartphone'
                    },
                    {
                        id: 2,
                        name: 'Designer Watch',
                        price: 299,
                        category: 'Accessories',
                        image: 'https://placehold.co/400x500?text=Watch'
                    },
                    {
                        id: 7,
                        name: 'Luxury Perfume',
                        price: 1799,
                        category: 'Beauty',
                        image: 'https://placehold.co/400x500?text=Perfume'
                    }
                ];
                localStorage.setItem('products', JSON.stringify(sampleProducts));
            });
    }
    
    if (!localStorage.getItem('orders')) {
        localStorage.setItem('orders', JSON.stringify([]));
    }
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    if (!localStorage.getItem('notifications')) {
        localStorage.setItem('notifications', JSON.stringify([]));
    }
}

// DOM Elements
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.sidebar nav a');

// Define active modules
const activeModules = ['dashboard', 'products', 'orders', 'users', 'wallets', 'wallet-requests', 'user-rewards', 'user-notifications'];

// Navigation
navLinks.forEach(link => {
    link.addEventListener('click', e => {
        if (link.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);

            // Update active section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) {
                    section.classList.add('active');
                }
            });

            // Update active link
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            link.classList.add('active');

            // Load section data
            loadSectionData(targetId);
        }
    });
});

// Load section data
function loadSectionData(section) {
    switch (section) {
        case 'dashboard':
            loadDashboardMetrics();
            loadNotifications();
            break;
        case 'products':
            loadProducts();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'users':
            loadUsers();
            break;
        case 'wallets':
            loadWalletManagement();
            break;
        case 'wallet-requests':
            loadWalletRequests();
            break;
        default:
            // Default view
            break;
    }
}

// Dashboard Functions
function loadDashboardMetrics() {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const depositRequests = JSON.parse(localStorage.getItem('depositRequests')) || [];
    const withdrawalRequests = JSON.parse(localStorage.getItem('withdrawalRequests')) || [];

    // Basic metrics
    document.getElementById('total-products').textContent = products.length;
    document.getElementById('active-orders').textContent = orders.filter(
        order => ['pending', 'processing', 'shipped'].includes(order.status)
    ).length;
    document.getElementById('registered-users').textContent = users.length;
    
    // Product Statistics
    try {
        // 1. Calculate number of unique product categories
        const categories = new Set(products.map(product => product.category));
        const categoryCount = categories.size;
        
        // 2. Calculate total inventory value
        const inventoryValue = products.reduce((total, product) => {
            const price = parseFloat(product.price) || 0;
            return total + price;
        }, 0);
        
        // 3. Calculate average product price
        const avgProductPrice = products.length > 0 ? inventoryValue / products.length : 0;
        
        // Update product statistics in UI
        document.getElementById('product-categories').textContent = categoryCount;
        document.getElementById('inventory-value').textContent = `PKR ${inventoryValue.toFixed(2)}`;
        document.getElementById('avg-product-price').textContent = `PKR ${avgProductPrice.toFixed(2)}`;
        
        console.log('Product statistics updated:', {
            categories: categoryCount,
            inventoryValue,
            avgPrice: avgProductPrice
        });
    } catch (error) {
        console.error('Error updating product statistics:', error);
    }
    
    // User Statistics
    try {
        // 1. Calculate new users in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const newUsers = users.filter(user => {
            const createdAt = new Date(user.createdAt);
            return createdAt > thirtyDaysAgo;
        }).length;
        
        // 2. Calculate active users (those with at least one order)
        const userIdsWithOrders = new Set(orders.map(order => order.userId));
        const activeUsers = userIdsWithOrders.size;
        
        // 3. Calculate average orders per user
        const avgOrdersPerUser = users.length > 0 ? orders.length / users.length : 0;
        
        // Update user statistics in UI
        document.getElementById('new-users').textContent = newUsers;
        document.getElementById('active-users').textContent = activeUsers;
        document.getElementById('avg-orders-per-user').textContent = avgOrdersPerUser.toFixed(1);
        
        console.log('User statistics updated:', {
            newUsers,
            activeUsers,
            avgOrdersPerUser
        });
    } catch (error) {
        console.error('Error updating user statistics:', error);
    }
    
    // Total orders calculation (all orders regardless of status)
    const totalOrders = orders.length;
    document.getElementById('total-orders').textContent = totalOrders;
    
    // Order metrics by status
    const ordersByStatus = {
        delivered: orders.filter(order => order.status === 'delivered').length,
        processing: orders.filter(order => order.status === 'processing').length,
        pending: orders.filter(order => order.status === 'pending').length,
        shipped: orders.filter(order => order.status === 'shipped').length,
        cancelled: orders.filter(order => order.status === 'cancelled').length
    };
    
    // Update order status cards
    document.getElementById('delivered-orders').textContent = ordersByStatus.delivered;
    document.getElementById('processing-orders').textContent = ordersByStatus.processing;
    document.getElementById('pending-orders').textContent = ordersByStatus.pending;
    document.getElementById('shipped-orders').textContent = ordersByStatus.shipped;
    document.getElementById('cancelled-orders').textContent = ordersByStatus.cancelled;
    
    // Wallet Statistics
    try {
        // 1. Calculate total wallet balance across all users
        let totalWalletBalance = 0;
        let walletUsers = 0;
        let totalTransactions = 0;
        
        // Loop through all users and gather wallet data
        users.forEach(user => {
            const userId = user.id;
            const walletKey = `wallet_${userId}`;
            const walletData = JSON.parse(localStorage.getItem(walletKey));
            
            if (walletData) {
                totalWalletBalance += walletData.balance || 0;
                totalTransactions += (walletData.transactions?.length || 0);
                walletUsers++;
            }
        });
        
        // Calculate average wallet balance
        const avgWalletBalance = walletUsers > 0 ? totalWalletBalance / walletUsers : 0;
        
        // 2. Count pending deposit and withdrawal requests
        const pendingDeposits = depositRequests.filter(req => req.status === 'pending').length;
        const pendingWithdrawals = withdrawalRequests.filter(req => req.status === 'pending').length;
        
        // 3. Update the wallet metric cards
        document.getElementById('total-wallet-balance').textContent = `PKR ${totalWalletBalance.toFixed(2)}`;
        document.getElementById('pending-deposits').textContent = pendingDeposits;
        document.getElementById('pending-withdrawals').textContent = pendingWithdrawals;
        document.getElementById('total-transactions').textContent = totalTransactions;
        document.getElementById('users-with-wallets').textContent = walletUsers;
        document.getElementById('avg-wallet-balance').textContent = `PKR ${avgWalletBalance.toFixed(2)}`;
        
        console.log('Wallet statistics updated:', {
            totalBalance: totalWalletBalance,
            pendingDeposits,
            pendingWithdrawals,
            totalTransactions,
            walletUsers,
            avgBalance: avgWalletBalance
        });
    } catch (error) {
        console.error('Error updating wallet statistics:', error);
    }
}

/**
 * Calculate total amount of an order including all items
 * @param {Object} order - Order object with items array
 * @returns {number} - Total order amount
 */
function calculateOrderTotal(order) {
    if (!order || !order.items) return 0;
    
    return order.items.reduce((total, item) => {
        const itemPrice = parseFloat(item.price) || 0;
        const itemQuantity = parseInt(item.quantity) || 1;
        return total + (itemPrice * itemQuantity);
    }, 0);
}

function loadNotifications() {
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    const notificationsList = document.getElementById('notifications-list');
    
    // If there are no notifications, create some sample ones
    if (notifications.length === 0) {
        // Add some sample notifications if none exist
        const sampleNotifications = [
            {
                message: 'Welcome to Admin Dashboard!',
                icon: 'fa-bell',
                timestamp: new Date().toISOString(),
                type: 'info'
            },
            {
                message: 'New order received from customer',
                icon: 'fa-shopping-cart',
                timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
                type: 'order'
            },
            {
                message: 'Product inventory updated',
                icon: 'fa-box',
                timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
                type: 'product'
            }
        ];
        
        localStorage.setItem('notifications', JSON.stringify(sampleNotifications));
        notifications.push(...sampleNotifications);
    }

    // Clear the list before adding elements
    notificationsList.innerHTML = '';
    
    // Create heading with count
    const heading = document.createElement('div');
    heading.className = 'notification-heading';
    heading.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="mb-0"><i class="fas fa-bell me-2"></i> Recent Notifications</h5>
            <span class="badge bg-primary rounded-pill">${notifications.length}</span>
        </div>
    `;
    notificationsList.appendChild(heading);
    
    // Add notifications (limit to 5)
    if (notifications.length > 0) {
        notifications.slice(0, 5).forEach(notification => {
            const div = document.createElement('div');
            div.className = 'notification-item';
            
            // Determine notification type color
            const typeColor = getNotificationTypeColor(notification.type || 'info');
            
            div.innerHTML = `
                <div class="d-flex p-2 border-start border-4 mb-2" style="border-color: ${typeColor} !important; background-color: rgba(0,0,0,0.02);">
                    <div class="flex-shrink-0">
                        <i class="fas ${notification.icon || 'fa-bell'} text-${getBootstrapColorClass(notification.type || 'info')} fs-5"></i>
                    </div>
                    <div class="ms-3 flex-grow-1">
                        <div class="fw-medium">${notification.message}</div>
                        <small class="text-muted">${formatTimeAgo(new Date(notification.timestamp))}</small>
                    </div>
                </div>
            `;
            notificationsList.appendChild(div);
        });
        
        // Add 'View All' button if there are more than 5 notifications
        if (notifications.length > 5) {
            const viewAllBtn = document.createElement('div');
            viewAllBtn.className = 'text-center mt-2';
            viewAllBtn.innerHTML = `
                <button class="btn btn-sm btn-outline-primary" onclick="showAllNotifications()">View All (${notifications.length})</button>
            `;
            notificationsList.appendChild(viewAllBtn);
        }
    } else {
        // Show empty state
        const emptyState = document.createElement('div');
        emptyState.className = 'text-center py-4';
        emptyState.innerHTML = `
            <i class="fas fa-bell-slash text-muted" style="font-size: 2rem;"></i>
            <p class="mt-2 text-muted">No notifications yet</p>
        `;
        notificationsList.appendChild(emptyState);
    }
}

// Notification helper functions
function getNotificationTypeColor(type) {
    const colors = {
        'info': '#4cc9f0',
        'success': '#2ecc71',
        'warning': '#f4a261',
        'danger': '#ef233c',
        'order': '#1abc9c',
        'product': '#3498db',
        'user': '#9b59b6'
    };
    return colors[type] || colors['info'];
}

function getBootstrapColorClass(type) {
    const classes = {
        'info': 'info',
        'success': 'success',
        'warning': 'warning',
        'danger': 'danger',
        'order': 'primary',
        'product': 'primary',
        'user': 'secondary'
    };
    return classes[type] || 'info';
}

function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + ' year' + (interval === 1 ? '' : 's') + ' ago';
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + ' month' + (interval === 1 ? '' : 's') + ' ago';
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + ' day' + (interval === 1 ? '' : 's') + ' ago';
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + ' hour' + (interval === 1 ? '' : 's') + ' ago';
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + ' minute' + (interval === 1 ? '' : 's') + ' ago';
    
    return 'just now';
}

function showAllNotifications() {
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    
    // Create modal for displaying all notifications
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'allNotificationsModal';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-labelledby', 'allNotificationsModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    
    // Sort notifications by timestamp (newest first)
    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Generate notification items
    let notificationItems = '';
    notifications.forEach(notification => {
        const typeColor = getNotificationTypeColor(notification.type || 'info');
        notificationItems += `
            <div class="d-flex p-2 border-start border-4 mb-2" style="border-color: ${typeColor} !important; background-color: rgba(0,0,0,0.02);">
                <div class="flex-shrink-0">
                    <i class="fas ${notification.icon || 'fa-bell'} text-${getBootstrapColorClass(notification.type || 'info')} fs-5"></i>
                </div>
                <div class="ms-3 flex-grow-1">
                    <div class="fw-medium">${notification.message}</div>
                    <small class="text-muted">${formatTimeAgo(new Date(notification.timestamp))}</small>
                </div>
                <div class="ms-auto">
                    <button class="btn btn-sm btn-link text-danger" onclick="deleteNotification('${notification.timestamp}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    
    // Create modal with notifications
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="allNotificationsModalLabel">
                        <i class="fas fa-bell me-2"></i> All Notifications (${notifications.length})
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    ${notifications.length > 0 ? notificationItems : '<div class="text-center py-4"><i class="fas fa-bell-slash text-muted" style="font-size: 2rem;"></i><p class="mt-2 text-muted">No notifications</p></div>'}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    ${notifications.length > 0 ? '<button type="button" class="btn btn-danger" onclick="clearAllNotifications()">Clear All</button>' : ''}
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.appendChild(modal);
    
    // Initialize and show modal
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    // Add event listener for when modal is hidden
    modal.addEventListener('hidden.bs.modal', function () {
        document.body.removeChild(modal);
    });
}

function deleteNotification(timestamp) {
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    const updatedNotifications = notifications.filter(n => n.timestamp !== timestamp);
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    loadNotifications();
    
    // Close and reopen the modal to refresh the list
    const modalElement = document.getElementById('allNotificationsModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    modalInstance.hide();
    setTimeout(() => showAllNotifications(), 300);
}

function clearAllNotifications() {
    localStorage.setItem('notifications', JSON.stringify([]));
    loadNotifications();
    
    // Close the modal
    const modalElement = document.getElementById('allNotificationsModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    modalInstance.hide();
}

function addNotification(message, type = 'info', icon = null) {
    // Default icons based on type
    const defaultIcons = {
        'info': 'fa-info-circle',
        'success': 'fa-check-circle',
        'warning': 'fa-exclamation-triangle',
        'danger': 'fa-times-circle',
        'order': 'fa-shopping-cart',
        'product': 'fa-box',
        'user': 'fa-user'
    };
    
    // Create notification object
    const notification = {
        message: message,
        icon: icon || defaultIcons[type] || 'fa-bell',
        timestamp: new Date().toISOString(),
        type: type
    };
    
    // Get existing notifications and add new one
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    notifications.unshift(notification); // Add to beginning of array
    
    // Limit to 50 notifications to avoid storage issues
    if (notifications.length > 50) {
        notifications.pop();
    }
    
    // Save to localStorage
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    // Refresh the notifications display if on admin panel
    if (document.getElementById('notifications-list')) {
        loadNotifications();
    }
}

// Product Management Functions
function loadProducts() {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    const productsContainer = document.getElementById('products-container');

    productsContainer.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Category</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="products-table-body"></tbody>
        </table>
    `;

    const tableBody = document.getElementById('products-table-body');
    products.forEach((product, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${product.name}</td>
            <td>PKR ${product.price}</td>
            <td>${product.stock}</td>
            <td>${product.category || 'N/A'}</td>
            <td>
                <button onclick="editProduct(${index})" class="btn btn-primary btn-sm">View Details</button>
                
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function openAddProductModal() {
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

function editProduct(index) {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    const product = products[index];
    
    if (!product) {
        alert('Product not found!');
        return;
    }

    document.getElementById('product-id').value = index;
    document.getElementById('product-name').value = product.name || '';
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-price').value = product.price || 0;
    document.getElementById('product-stock').value = product.stock || 0;
    document.getElementById('product-category').value = product.category || '';
    document.getElementById('product-image').value = product.image || product.imageUrl || '';

    // Make sure modal exists before showing
    const modalElement = document.getElementById('productModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } else {
        console.error('Product modal not found in the DOM');
    }
}

function saveProduct() {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    const productId = document.getElementById('product-id').value;

    // Validate inputs before saving
    const name = document.getElementById('product-name').value;
    const price = parseFloat(document.getElementById('product-price').value);
    
    if (!name || isNaN(price)) {
        alert('Please enter valid product name and price');
        return;
    }

    const productData = {
        id: productId === '' ? (products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1) : products[parseInt(productId)].id,
        name: name,
        description: document.getElementById('product-description').value,
        price: price,
        stock: parseInt(document.getElementById('product-stock').value) || 0,
        category: document.getElementById('product-category').value,
        rating: products[parseInt(productId)]?.rating || 4.5,
        available: true,
        image: document.getElementById('product-image').value,
        colors: products[parseInt(productId)]?.colors || ['Default'],
        reviews: products[parseInt(productId)]?.reviews || []
    };

    if (productId === '') {
        products.push(productData);
        addNotification('New product added: ' + productData.name, 'fa-box');
    } else {
        products[parseInt(productId)] = productData;
        addNotification('Product updated: ' + productData.name, 'fa-box');
    }

    localStorage.setItem('products', JSON.stringify(products));
    
    try {
        const modalInstance = bootstrap.Modal.getInstance(document.getElementById('productModal'));
        if (modalInstance) {
            modalInstance.hide();
        }
    } catch (e) {
        console.error('Error closing modal:', e);
    }
    
    loadProducts();
    loadDashboardMetrics();
}

function deleteProduct(index) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            const products = JSON.parse(localStorage.getItem('products')) || [];
            
            if (index < 0 || index >= products.length) {
                alert('Invalid product index');
                return;
            }
            
            const productName = products[index].name;
            products.splice(index, 1);
            
            // Update localStorage
            localStorage.setItem('products', JSON.stringify(products));
            
            // Show notification
            addNotification('Product deleted: ' + productName, 'fa-trash');
            
            // Refresh UI
            loadProducts();
            loadDashboardMetrics();
            
            // Log success for debugging
            console.log(`Product ${productName} successfully deleted`);
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Failed to delete product. See console for details.');
        }
    }
}

// Order Management Functions
function loadOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const ordersContainer = document.getElementById('orders-container');

    ordersContainer.innerHTML = '';

    if (orders.length === 0) {
        ordersContainer.innerHTML = '<div class="alert alert-info shadow-sm rounded">No orders found.</div>';
        return;
    }

    // Add controls and filters
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'd-flex justify-content-between align-items-center mb-3';
    controlsDiv.innerHTML = `
        <div>
            <h5 class="mb-0">Total Orders: <span class="badge bg-primary">${orders.length}</span></h5>
        </div>
        <div class="d-flex gap-2">
            <div class="input-group input-group-sm">
                <input type="text" class="form-control" placeholder="Search orders..." id="order-search">
                <button class="btn btn-outline-primary" type="button">
                    <i class="fas fa-search"></i>
                </button>
            </div>
            <select class="form-select form-select-sm" id="order-status-filter">
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
            </select>
        </div>
    `;
    ordersContainer.appendChild(controlsDiv);

    // Create the orders container with card-table hybrid approach
    const ordersTableContainer = document.createElement('div');
    ordersTableContainer.className = 'card shadow-sm';
    ordersTableContainer.innerHTML = `
        <div class="card-header bg-white">
            <div class="row align-items-center">
                <div class="col-md-2">Order ID</div>
                <div class="col-md-3">Customer</div>
                <div class="col-md-2">Date</div>
                <div class="col-md-1">Total</div>
                <div class="col-md-2">Status</div>
                <div class="col-md-2">Actions</div>
            </div>
        </div>
        <div class="list-group list-group-flush" id="orders-list"></div>
    `;
    ordersContainer.appendChild(ordersTableContainer);

    const ordersList = document.getElementById('orders-list');

    orders.forEach((order, index) => {
        const orderItem = document.createElement('div');
        orderItem.className = 'list-group-item list-group-item-action border-0 border-bottom';
        
        const statusClass = order.status === 'delivered' ? 'success' : 
                           order.status === 'shipped' ? 'primary' : 
                           order.status === 'cancelled' ? 'danger' : 'warning';
                           
        orderItem.innerHTML = `
            <div class="row align-items-center">
                <div class="col-md-2">
                    <span class="fw-bold">${order.orderId || `Order #${index + 1}`}</span>
                </div>
                <div class="col-md-3">
                    <div class="d-flex align-items-center">
                        <div class="bg-light rounded-circle p-2 me-2">
                            <i class="fas fa-user text-primary"></i>
                        </div>
                        <div>
                            <div class="fw-medium">${order.shipping ? order.shipping.fullName : 'N/A'}</div>
                            <div class="text-muted small">${order.shipping ? order.shipping.email : 'N/A'}</div>
                            <div class="text-muted small">${order.shipping ? order.shipping.phone : 'N/A'}</div>
                            <div class="text-muted small mt-1 text-truncate" style="max-width: 220px;">
                                ${order.shipping && order.shipping.address ? 
                                  `<i class="fas fa-map-marker-alt me-1"></i>${order.shipping.address}, ${order.shipping.city || ''} ${order.shipping.state || ''} ${order.shipping.postalCode || ''}` : 'No address provided'}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="d-flex align-items-center">
                        <i class="far fa-calendar-alt text-muted me-2"></i>
                        <span>${new Date(order.orderDate).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="col-md-1">
                    <span class="fw-bold">PKR ${order.payment ? order.payment.total.toFixed(2) : '0.00'}</span>
                </div>
                <div class="col-md-2">
                    <span class="badge bg-${statusClass} py-2 px-3 rounded-pill">
                        ${(order.status || 'pending').toUpperCase()}
                    </span>
                </div>
                <div class="col-md-2">
                    <div class="d-flex gap-2">
                        <button class="btn btn-primary btn-sm rounded-circle" onclick="viewOrderDetails(${index})" title="View Details">
                            <i class="fas fa-info"></i>
                        </button>
                        <button class="btn btn-info btn-sm rounded-circle" onclick="viewOrderItems(${index})" title="View Items">
                            <i class="fas fa-box"></i>
                        </button>
                        <button class="btn btn-success btn-sm rounded-circle" onclick="updateOrderStatus(${index}, 'delivered')" title="Mark Delivered">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-danger btn-sm rounded-circle" onclick="cancelOrder(${index})" title="Cancel Order">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        ordersList.appendChild(orderItem);
    });
    
    // Add pagination 
    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'd-flex justify-content-between align-items-center mt-3';
    paginationDiv.innerHTML = `
        <div class="text-muted small">Showing 1-${Math.min(orders.length, 10)} of ${orders.length} orders</div>
        <nav aria-label="Page navigation">
            <ul class="pagination pagination-sm mb-0">
                <li class="page-item disabled"><a class="page-link" href="#">Previous</a></li>
                <li class="page-item active"><a class="page-link" href="#">1</a></li>
                <li class="page-item"><a class="page-link" href="#">2</a></li>
                <li class="page-item"><a class="page-link" href="#">3</a></li>
                <li class="page-item"><a class="page-link" href="#">Next</a></li>
            </ul>
        </nav>
    `;
    ordersContainer.appendChild(paginationDiv);
}



function getStatusColor(status) {
    const colors = {
        'pending': 'warning',
        'processing': 'info',
        'shipped': 'primary',
        'delivered': 'success',
        'cancelled': 'danger'
    };
    return colors[status] || 'secondary';
}



function getProductName(order) {
    if (Array.isArray(order.items) && order.items.length > 0 && order.items[0].name) {
        return order.items[0].name;
    }
    return 'Product Name Not Available';
}

function viewOrderItems(index) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders[index];
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Order Items</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Price</th>
                                    <th>Quantity</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.items.map(item => `
                                    <tr>
                                        <td>
                                            <div class="d-flex align-items-center">
                                                ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px;">` : ''}
                                                <div>${item.name}</div>
                                            </div>
                                        </td>
                                        <td>PKR ${item.price.toFixed(2)}</td>
                                        <td>${item.quantity}</td>
                                        <td>PKR ${(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="3" class="text-end"><strong>Total:</strong></td>
                                    <td><strong>PKR ${order.payment.total.toFixed(2)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

function viewOrderDetails(index) {
    try {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        if (!orders.length) {
            console.error('No orders found');
            alert('No orders found in the system');
            return;
        }
        
        // Handle both string and numeric indices
        const order = typeof index === 'string' ? orders.find(o => o.orderId === index) : orders[index];
        if (!order) {
            console.error('Order not found with identifier:', index);
            alert('Error: Order not found');
            return;
        }
        
        // Make sure Bootstrap is available
        if (typeof bootstrap === 'undefined') {
            console.error('Bootstrap is not loaded');
            alert('Please reload the page. An error occurred loading the order details.');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'orderDetailsModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Order Details - ${order.orderId}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="fw-bold">Customer Information</h6>
                                <p><strong>Name:</strong> ${order.shipping.fullName}</p>
                                <p><strong>Email:</strong> ${order.shipping.email}</p>
                                <p><strong>Phone:</strong> ${order.shipping.phone}</p>
                                <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
                            </div>
                            <div class="col-md-6">
                                <h6 class="fw-bold">Shipping Address</h6>
                                <p>${order.shipping.address}</p>
                                <p>${order.shipping.city}, ${order.shipping.state} ${order.shipping.postalCode}</p>
                                <p><strong>Delivery Option:</strong> ${order.shipping.deliveryOption}</p>
                            </div>
                        </div>
                        
                        <h6 class="fw-bold mt-4">Order Items</h6>
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Product</th>
                                        <th>Price</th>
                                        <th>Quantity</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${order.items.map(item => `
                                        <tr>
                                            <td><img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover"></td>
                                            <td>${item.name}</td>
                                            <td>PKR ${item.price.toFixed(2)}</td>
                                            <td>${item.quantity}</td>
                                            <td>PKR ${item.subtotal.toFixed(2)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="row mt-4">
                            <div class="col-md-6">
                                <h6 class="fw-bold">Order Status</h6>
                                <span class="badge bg-${getStatusColor(order.status)}">
                                    ${order.status.toUpperCase()}
                                </span>
                            </div>
                            <div class="col-md-6">
                                <h6 class="fw-bold">Payment Summary</h6>
                                <p><strong>Payment Method:</strong> <span class="badge ${order.payment.method === 'wallet' ? 'bg-success' : 'bg-primary'}">${order.payment.method === 'wallet' ? 'Wallet Payment' : 'Cash on Delivery'}</span></p>
                                <p><strong>Subtotal:</strong> PKR ${order.payment.subtotal.toFixed(2)}</p>
                                <p><strong>Shipping:</strong> PKR ${order.payment.shipping.toFixed(2)}</p>
                                <p><strong>Total:</strong> PKR ${order.payment.total.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove any existing modals first
        const existingModal = document.getElementById('orderDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    } catch (error) {
        console.error('Error viewing order details:', error);
        alert('An error occurred while trying to view order details: ' + error.message);
    }
}

function viewOrderItems(index) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders[index];
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-light">
                    <h5 class="modal-title">
                        <i class="fas fa-shopping-bag me-2 text-primary"></i>
                        Order #${order.orderId} Details
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <!-- Customer Info -->
                    <div class="card mb-3">
                        <div class="card-header bg-light">
                            <h6 class="mb-0">Customer Information</h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <p class="mb-1"><strong>Name:</strong> ${order.shipping.fullName}</p>
                                    <p class="mb-1"><strong>Email:</strong> ${order.shipping.email}</p>
                                    <p class="mb-1"><strong>Phone:</strong> ${order.shipping.phone}</p>
                                </div>
                                <div class="col-md-6">
                                    <p class="mb-1"><strong>Address:</strong> ${order.shipping.address}</p>
                                    <p class="mb-1"><strong>City:</strong> ${order.shipping.city}, ${order.shipping.state}</p>
                                    <p class="mb-1"><strong>Postal Code:</strong> ${order.shipping.postalCode}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Order Products -->
                    <div class="card mb-3">
                        <div class="card-header bg-light">
                            <h6 class="mb-0">Ordered Products</h6>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th style="width: 80px">Image</th>
                                            <th>Product Details</th>
                                            <th class="text-center" style="width: 100px">Price</th>
                                            <th class="text-center" style="width: 80px">Qty</th>
                                            <th class="text-end" style="width: 120px">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${order.items.map(item => `
                                            <tr>
                                                <td>
                                                    <img src="${item.image}" alt="${item.name}" 
                                                        class="rounded" style="width: 60px; height: 60px; object-fit: contain;">
                                                </td>
                                                <td>
                                                    <div class="fw-medium">${item.name}</div>
                                                    ${item.color ? `<small class="text-muted">Color: ${item.color}</small>` : ''}
                                                    ${item.size ? `<small class="text-muted d-block">Size: ${item.size}</small>` : ''}
                                                </td>
                                                <td class="text-center">PKR ${item.price.toFixed(2)}</td>
                                                <td class="text-center">${item.quantity}</td>
                                                <td class="text-end">PKR ${item.subtotal.toFixed(2)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Order Summary -->
                    <div class="card">
                        <div class="card-header bg-light">
                            <h6 class="mb-0">Order Summary</h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <p class="mb-1"><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
                                    <p class="mb-1"><strong>Status:</strong> <span class="badge bg-${getStatusColor(order.status)}">${order.status.toUpperCase()}</span></p>
                                    <p class="mb-1"><strong>Payment Method:</strong> 
                                        <span class="badge ${order.payment.method === 'wallet' ? 'bg-success' : 'bg-primary'}">
                                            ${order.payment.method === 'wallet' ? 'Wallet Payment' : 'Cash on Delivery'}
                                        </span>
                                    </p>
                                    <p class="mb-1"><strong>Shipping Method:</strong> ${order.shipping.deliveryOption === 'express' ? 'Express Delivery' : 'Standard Delivery'}</p>
                                </div>
                                <div class="col-md-6">
                                    <div class="bg-light p-3 rounded">
                                        <div class="d-flex justify-content-between mb-2">
                                            <span>Subtotal:</span>
                                            <span>PKR ${order.payment.subtotal.toFixed(2)}</span>
                                        </div>
                                        <div class="d-flex justify-content-between mb-2">
                                            <span>Shipping:</span>
                                            <span>PKR ${order.payment.shipping.toFixed(2)}</span>
                                        </div>
                                        <hr>
                                        <div class="d-flex justify-content-between fw-bold">
                                            <span>Total:</span>
                                            <span>PKR ${order.payment.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" onclick="printOrderInvoice(${index})"><i class="fas fa-print me-1"></i> Print Invoice</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

function printOrderInvoice(index) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders[index];
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice - ${order.orderId}</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                body { padding: 20px; }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="row mb-4">
                    <div class="col">
                        <h2>INVOICE</h2>
                        <p class="mb-0">Order ID: ${order.orderId}</p>
                        <p>Date: ${new Date(order.orderDate).toLocaleDateString()}</p>
                    </div>
                    <div class="col text-end">
                        <button onclick="window.print()" class="btn btn-primary no-print">Print Invoice</button>
                    </div>
                </div>

                <div class="row mb-4">
                    <div class="col-md-6">
                        <h6 class="fw-bold">Customer Information</h6>
                        <p><strong>Name:</strong> ${order.shipping.fullName}</p>
                        <p><strong>Email:</strong> ${order.shipping.email}</p>
                        <p><strong>Phone:</strong> ${order.shipping.phone}</p>
                        <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
                    </div>
                    <div class="col-md-6 text-end">
                        <h6 class="fw-bold">Shipping Method:</h6>
                        <p>${order.shipping.deliveryOption === 'express' ? 'Express Delivery' : 'Standard Delivery'}</p>
                    </div>
                </div>

                <table class="table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th class="text-end">Price</th>
                            <th class="text-end">Quantity</th>
                            <th class="text-end">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td class="text-end">$${item.price.toFixed(2)}</td>
                                <td class="text-end">${item.quantity}</td>
                                <td class="text-end">$${item.subtotal.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" class="text-end fw-bold">Subtotal:</td>
                            <td class="text-end">$${order.payment.subtotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colspan="3" class="text-end fw-bold">Shipping:</td>
                            <td class="text-end">$${order.payment.shipping.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colspan="3" class="text-end fw-bold">Total:</td>
                            <td class="text-end fw-bold">$${order.payment.total.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>

                <div class="row mt-4">
                    <div class="col">
                        <h6 class="fw-bold">Notes:</h6>
                        <p>Thank you for your business!</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function filterOrders(status) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const filteredOrders = status === 'all' ? orders : orders.filter(order => order.status === status);
    renderOrdersTable(filteredOrders);
}

function renderOrdersTable(orders) {
    const tableBody = document.getElementById('orders-table-body');
    tableBody.innerHTML = '';
    
    orders.forEach((order, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <span class="fw-medium">${order.orderId}</span>
                <br>
                <small class="text-muted">${new Date(order.orderDate).toLocaleDateString()}</small>
            </td>
            <td>
                <div class="d-flex align-items-center">
                    <div>
                        <div class="fw-medium">${order.shipping.fullName}</div>
                        <div class="text-muted small">${order.shipping.address}</div>
                        <div class="text-muted small">${order.shipping.city}, ${order.shipping.state} ${order.shipping.postalCode}</div>
                    </div>
                </div>
            </td>
            <td>
                <div class="text-muted small">
                    <div><i class="fas fa-envelope me-1"></i>${order.shipping.email}</div>
                    <div><i class="fas fa-phone me-1"></i>${order.shipping.phone}</div>
                </div>
            </td>
            <td>
                <div class="d-flex flex-column">
                    <div class="fw-medium text-truncate">
                        ${getProductName(order)}
                    </div>
                    <div class="d-flex align-items-center mt-1">
                        <span class="badge bg-light text-dark">
                            ${Array.isArray(order.items) ? 
                                (order.items.length > 1 ? `+${order.items.length - 1} more` : '1 item') : 
                                'N/A'}
                        </span>
                        <button class="btn btn-link btn-sm p-0 ms-2" onclick="viewOrderItems(${index})">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </div>
            </td>
            <td>
                <div class="fw-medium">PKR ${order.payment.total.toFixed(2)}</div>
                <small class="text-muted">
                    ${order.shipping.deliveryOption === 'express' ? 'Express Delivery' : 'Standard Delivery'}
                </small>
                <span class="badge ${order.payment.method === 'wallet' ? 'bg-success' : 'bg-primary'} mt-1">
                    ${order.payment.method === 'wallet' ? 'Wallet' : 'COD'}
                </span>
            </td>
            <td>
                <span class="badge bg-${getStatusColor(order.status)}">
                    ${order.status.toUpperCase()}
                </span>
            </td>
            <td>
                <div class="text-muted small">
                    <div>Ordered: ${new Date(order.orderDate).toLocaleString()}</div>
                    ${order.lastUpdated ? `<div>Updated: ${new Date(order.lastUpdated).toLocaleString()}</div>` : ''}
                </div>
            </td>
            <td>
                <div class="btn-group">
                    <button onclick="viewOrderDetails(${index})" class="btn btn-info btn-sm" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="updateOrderStatus(${index})" class="btn btn-primary btn-sm" title="Update Status">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="printOrderInvoice(${index})" class="btn btn-secondary btn-sm" title="Print Invoice">
                        <i class="fas fa-print"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function updateOrderStatus(index) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders[index];
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Update Order Status - ${order.orderId}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Order Status</label>
                        <select class="form-select" id="orderStatus">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" onclick="saveOrderStatus(${index})">Save Changes</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

function saveOrderStatus(index) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const newStatus = document.getElementById('orderStatus').value;
    const previousStatus = orders[index].status;
    
    orders[index].status = newStatus;
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Add notification
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    notifications.unshift({
        message: `Order ${orders[index].orderId} status updated to ${newStatus}`,
        icon: 'fa-truck',
        timestamp: new Date().toISOString(),
        type: 'order'
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    // Add user notification if order is delivered
    if (newStatus === 'delivered' && orders[index].userId) {
        const userNotificationsKey = `notifications_${orders[index].userId}`;
        const userNotifications = JSON.parse(localStorage.getItem(userNotificationsKey)) || [];
        const orderTotal = calculateOrderTotal(orders[index]);
        
        userNotifications.unshift({
            title: 'Order Delivered',
            message: `Your order #${orders[index].orderId} has been delivered successfully.`,
            timestamp: new Date().toISOString(),
            read: false,
            type: 'success'
        });
        localStorage.setItem(userNotificationsKey, JSON.stringify(userNotifications));
    }
    
    // Close modal and refresh
    const modal = bootstrap.Modal.getInstance(document.querySelector('.modal'));
    modal.hide();
    
    // Update the dashboard metrics if order status changes to/from delivered
    if (newStatus === 'delivered' || previousStatus === 'delivered') {
        loadDashboardMetrics();
    }
    
    loadOrders();
    loadNotifications();
}

// User Management Functions
function loadUsers() {
    // Get and log users data for debugging
    const users = JSON.parse(localStorage.getItem('users')) || [];
    console.log('Loading users data:', users);
    
    // Debug phone numbers specifically
    users.forEach(user => {
        console.log(`User ${user.name} phone data:`, {
            phone: user.phone,
            phoneNumber: user.phoneNumber,
            mobile: user.mobile,
            contact: user.contact
        });
    });
    
    // Clear and prepare the container
    const usersContainer = document.getElementById('users-container');

    usersContainer.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Avatar</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="users-table-body"></tbody>
        </table>
    `;

    const tableBody = document.getElementById('users-table-body');
    // Process each user and ensure properties exist
    users.forEach((user, index) => {
        // Get the phone value - prioritize the admin-specific phone field
        const phoneValue = user.phone_admin || user.phone || user.phoneNumber || user.mobile || user.contact || '';
        
        // Create a clean copy of user data with fallbacks for missing properties
        const safeUser = {
            id: user.id || `user_${index}`,
            name: user.name || 'Unknown User',
            email: user.email || 'No Email',
            // Use the same phone value consistently across all phone-related fields
            phone: phoneValue,
            phoneNumber: phoneValue,
            mobile: phoneValue,
            contact: phoneValue,
            phone_admin: phoneValue,
            avatar: user.avatar || 'https://via.placeholder.com/50',
            status: user.status || 'active',
            createdAt: user.createdAt || new Date().toISOString()
        };
        
        // Log phone data for debugging
        console.log(`User table row ${safeUser.name} phone:`, safeUser.phone);
        
        // Create table row with user data
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <img src="${safeUser.avatar}" alt="${safeUser.name}" class="w-8 h-8 rounded-full">
            </td>
            <td>${safeUser.name}</td>
            <td>${safeUser.email}</td>
            <td>
                ${(() => {
                    // Debug log for the users table phone field
                    console.log(`User ${safeUser.name} phone in table:`, safeUser.phone);
                    
                    // Directly use safeUser.phone which already has all the fallbacks
                    if (safeUser.phone && safeUser.phone.trim() !== '') {
                        return `<span class="badge bg-info text-dark"><i class="fas fa-phone-alt me-1"></i>${safeUser.phone}</span>`;
                    } else {
                        return '<span class="badge bg-warning text-dark">Not provided</span>';
                    }
                })()
                }
            </td>
            <td>
                <span class="badge ${user.status === 'active' ? 'bg-success' : 'bg-danger'}">
                    ${user.status || 'active'}
                </span>
            </td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td>
                <button onclick="viewUserDetailsModal(${index})" class="btn btn-info btn-sm" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="toggleUserStatus(${index})" class="btn ${user.status === 'active' ? 'btn-warning' : 'btn-success'} btn-sm" title="${user.status === 'active' ? 'Disable' : 'Enable'} User">
                    <i class="fas ${user.status === 'active' ? 'fa-ban' : 'fa-check'}"></i>
                </button>
                <button onclick="sendNotificationToUser('${user.id}')" class="btn btn-primary btn-sm" title="Send Notification">
                    <i class="fas fa-bell"></i>
                </button>
                <button onclick="deleteUser(${index})" class="btn btn-danger btn-sm" title="Delete User">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// Ensure this function is globally accessible
window.viewUserDetailsModal = function(index) {
    // Get users data and log for debugging
    console.log('viewUserDetailsModal called with index:', index);
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Safety check in case the index is invalid
    if (!users[index]) {
        console.error('User not found at index:', index);
        alert('User not found!');
        return;
    }
    
    let user = users[index];
    console.log('User details for index', index, ':', user);
    console.log('Phone number:', user.phone);
    
    // Log raw user data for debugging
    console.log('Raw user data from localStorage:', user);
    console.log('Raw phone data:', {
        phone: user.phone,
        phoneNumber: user.phoneNumber,
        mobile: user.mobile,
        contact: user.contact,
        phone_admin: user.phone_admin
    });
    
    // Try to retrieve phone number from multiple locations for backward compatibility
    // This ensures existing users and newly created users both work
    
    // Prioritize the phone_admin field that was added specifically for admin visibility
    const phoneValue = user.phone_admin || user.phone || user.phoneNumber || user.mobile || user.contact || '';
    
    // Create a safe user object with defaults for missing properties
    user = {
        ...user,
        id: user.id || `user_${index}`,
        name: user.name || 'Unknown User',
        email: user.email || 'No Email',
        // Use the same phone value consistently across all phone-related fields
        phone: phoneValue,
        phoneNumber: phoneValue,
        mobile: phoneValue,
        contact: phoneValue,
        phone_admin: phoneValue,
        avatar: user.avatar || 'https://via.placeholder.com/50',
        status: user.status || 'active',
        createdAt: user.createdAt || new Date().toISOString(),
        addresses: user.addresses || []
    };
    
    // Log confirmation of phone value being used
    console.log('Final phone value selected for display:', phoneValue);
    
    // Explicitly log all phone-related fields to verify they're being processed correctly
    console.log('Enhanced user for admin view:', user);
    console.log('Phone value being used:', user.phone);
    
    // Get user wallet data
    const walletData = getUserWallet(user.id);
    console.log('Retrieved wallet data for user:', walletData);
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'userDetailsModal';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">User Details</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <!-- User Info Section -->
                    <div class="row">
                        <div class="col-md-4 text-center">
                            <img src="${user.avatar}" alt="${user.name}" class="rounded-circle mb-3" style="width: 100px; height: 100px;">
                            <h5>${user.name}</h5>
                            <p class="text-muted small">${user.email}</p>
                        </div>
                        <div class="col-md-8">
                            <div class="card mb-4">
                                <div class="card-header">Personal Information</div>
                                <div class="card-body">
                                    <div class="row mb-2">
                                        <div class="col-sm-4 text-muted">Phone:</div>
                                        <div class="col-sm-8">
                                            ${(() => {
                                                // Get phone value - explicitly log it for debugging
                                                console.log('Phone value in modal template:', user.phone);
                                                
                                                // Simple direct display to avoid any potential issues with the IIFE
                                                if (user.phone && user.phone.trim() !== '') {
                                                    return `
                                                    <div class="alert alert-info p-2 mb-0">
                                                        <div class="d-flex align-items-center">
                                                            <i class="fas fa-phone-alt me-2 text-primary"></i>
                                                            <strong class="me-2">${user.phone}</strong>
                                                            <a href="tel:${user.phone}" class="btn btn-sm btn-primary ms-auto">Call</a>
                                                        </div>
                                                    </div>`;
                                                } else {
                                                    return `
                                                    <div class="alert alert-warning p-2 mb-0">
                                                        <i class="fas fa-exclamation-triangle me-2"></i>
                                                        <span>No phone number provided</span>
                                                    </div>`;
                                                }
                                            })()}
                                        </div>
                                    </div>
                                    <div class="row mb-2">
                                        <div class="col-sm-4 text-muted">Address:</div>
                                        <div class="col-sm-8">${user.address || 'Not provided'}</div>
                                    </div>
                                    <div class="row mb-2">
                                        <div class="col-sm-4 text-muted">Status:</div>
                                        <div class="col-sm-8">
                                            <span class="badge ${user.status === 'blocked' ? 'bg-danger' : 'bg-success'}">
                                                ${user.status || 'active'}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="row mb-2">
                                        <div class="col-sm-4 text-muted">Joined:</div>
                                        <div class="col-sm-8">${new Date(user.createdAt).toLocaleString()}</div>
                                    </div>
                                    ${user.updatedAt ? `
                                        <div class="row mb-2">
                                            <div class="col-sm-4 text-muted">Last Updated:</div>
                                            <div class="col-sm-8">${new Date(user.updatedAt).toLocaleString()}</div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Wallet Section -->
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <span>Wallet Information</span>
                            <button class="btn btn-sm btn-outline-primary" onclick="viewUserWalletTransactions('${user.id}')">View Transactions</button>
                        </div>
                        <div class="card-body">
                            <div class="row align-items-center">
                                <div class="col-md-6">
                                    <h4 class="mb-3">Current Balance: <span class="text-success">PKR ${walletData.balance.toFixed(2)}</span></h4>
                                    <p class="text-muted">Last transaction: ${walletData.transactions.length > 0 ? new Date(walletData.transactions[0].date).toLocaleString() : 'No transactions yet'}</p>
                                </div>
                                <div class="col-md-6">
                                    <form id="update-wallet-form" class="row g-3">
                                        <div class="col-md-6">
                                            <input type="number" class="form-control" id="wallet-amount" placeholder="Amount" step="0.01" required>
                                        </div>
                                        <div class="col-md-6">
                                            <select class="form-select" id="transaction-type">
                                                <option value="adjustment">Adjustment</option>
                                                <option value="cashback">Cashback</option>
                                                <option value="reward">Reward</option>
                                                <option value="referral">Referral</option>
                                            </select>
                                        </div>
                                        <div class="col-md-12">
                                            <input type="text" class="form-control" id="transaction-description" placeholder="Description" required>
                                        </div>
                                        <div class="col-12">
                                            <button type="button" class="btn btn-success" onclick="updateUserWallet('${user.id}')">Add Funds</button>
                                            <button type="button" class="btn btn-danger" onclick="deductUserWallet('${user.id}')">Deduct Funds</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Actions Section -->
                    <div class="d-flex justify-content-between">
                        <div>
                            <button class="btn btn-warning" onclick="toggleUserStatus(${index}); modalInstance.hide();">
                                ${user.status === 'blocked' ? 'Unblock User' : 'Block User'}
                            </button>
                            <button class="btn btn-danger" onclick="deleteUser(${index}); modalInstance.hide();">
                                Delete User
                            </button>
                            <button class="btn btn-primary" onclick="sendNotificationToUser('${user.id}')">
                                <i class="fas fa-bell me-1"></i> Send Notification
                            </button>
                        </div>
                        <div>
                            <button class="btn btn-info" onclick="viewUserNotifications('${user.id}')">
                                <i class="fas fa-history me-1"></i> View Notifications
                            </button>
                            <button class="btn btn-primary" onclick="viewUserOrders('${user.id}')">
                                <i class="fas fa-shopping-cart me-1"></i> View Orders
                            </button>
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
    
    modal.addEventListener('hidden.bs.modal', function() {
        modal.remove();
    });
}

// Function to get user wallet data
window.getUserWallet = function(userId) {
    try {
        console.log('Getting wallet data for user ID:', userId);
        
        // Get wallet data from localStorage using the wallet key format
        const walletKey = `wallet_${userId}`;
        const walletData = JSON.parse(localStorage.getItem(walletKey));
        
        // If wallet data exists, return it
        if (walletData) {
            return walletData;
        }
        
        // If no wallet data found, return a default wallet object
        console.log('No wallet data found for user, creating default wallet');
        return {
            balance: 0,
            transactions: [],
            rewards: []
        };
    } catch (error) {
        console.error('Error getting wallet data:', error);
        
        // Return a default wallet object in case of error
        return {
            balance: 0,
            transactions: [],
            rewards: []
        };
    }
}

// Function to view user wallet transactions
window.viewUserWalletTransactions = function(userId) {
    try {
        // Get the user's wallet data
        const walletData = getUserWallet(userId);
        
        // Get the user's info for the modal title
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.id === userId) || { name: 'User' };
        
        // Create modal for transaction history
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'walletTransactionsModal';
        
        // Sort transactions by date (newest first)
        const sortedTransactions = [...walletData.transactions].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        // Generate transaction rows
        let transactionRows = '';
        if (sortedTransactions.length > 0) {
            transactionRows = sortedTransactions.map(transaction => {
                const date = new Date(transaction.date).toLocaleString();
                const amountClass = transaction.type === 'credit' ? 'text-success' : 'text-danger';
                const amountPrefix = transaction.type === 'credit' ? '+' : '-';
                
                return `
                    <tr>
                        <td>${date}</td>
                        <td>${transaction.description}</td>
                        <td class="${amountClass}">${amountPrefix}PKR ${Math.abs(transaction.amount).toFixed(2)}</td>
                        <td><span class="badge bg-${transaction.type === 'credit' ? 'success' : 'danger'}">${transaction.type}</span></td>
                    </tr>
                `;
            }).join('');
        } else {
            transactionRows = `
                <tr>
                    <td colspan="4" class="text-center py-4">
                        <div class="text-muted">
                            <i class="fas fa-info-circle me-2"></i>
                            No transactions found for this user
                        </div>
                    </td>
                </tr>
            `;
        }
        
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-history me-2"></i>
                            Wallet Transactions: ${user.name}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-wallet me-3 fs-3"></i>
                                <div>
                                    <h5 class="mb-1">Current Balance: <span class="fw-bold">PKR ${walletData.balance.toFixed(2)}</span></h5>
                                    <div class="text-muted small">Total Transactions: ${walletData.transactions.length}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>Date & Time</th>
                                        <th>Description</th>
                                        <th>Amount</th>
                                        <th>Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${transactionRows}
                                </tbody>
                            </table>
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
        
        modal.addEventListener('hidden.bs.modal', function() {
            modal.remove();
        });
    } catch (error) {
        console.error('Error viewing wallet transactions:', error);
        alert('Error loading wallet transactions. Please try again.');
    }
}

window.toggleUserStatus = function(index) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users[index];
    
    user.status = user.status === 'active' ? 'suspended' : 'active';
    user.updatedAt = new Date().toISOString();
    
    localStorage.setItem('users', JSON.stringify(users));
    
    // Add notification
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    notifications.unshift({
        message: `User ${user.name} ${user.status === 'active' ? 'activated' : 'suspended'}`,
        icon: user.status === 'active' ? 'fa-check-circle' : 'fa-ban',
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    loadUsers();
    loadNotifications();
}

function deleteUser(index) {
    if (confirm('Are you sure you want to delete this user?')) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userName = users[index].name;
        users.splice(index, 1);
        localStorage.setItem('users', JSON.stringify(users));
        addNotification('User deleted: ' + userName, 'fa-user-times');
        loadUsers();
        loadDashboardMetrics();
    }
}

function viewUserOrders(userId) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const userOrders = orders.filter(order => order.userId === userId);
    // You can implement a modal to show user orders here
    alert('User orders: ' + JSON.stringify(userOrders, null, 2));
}

/**
 * Navigate to the user notifications section and pre-select a specific user
 * @param {string} userId - User ID to pre-select for notification
 */
function sendNotificationToUser(userId) {
    // Navigate to the user notifications section
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('user-notifications').classList.add('active');
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar nav a').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector('.sidebar nav a[href="#user-notifications"]').classList.add('active');
    
    // Load the user notifications section
    loadUserNotifications();
    
    // Wait for user list to load then select the user
    setTimeout(() => {
        // Select this user's checkbox
        const userCheckbox = document.getElementById(`user-${userId}`);
        if (userCheckbox) {
            userCheckbox.checked = true;
            toggleUserSelection(userId); // This will add the user to selectedUsers array
            
            // Scroll to the user in the list
            userCheckbox.closest('.list-group-item').scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Flash highlight the user row
            const userRow = userCheckbox.closest('.list-group-item');
            userRow.classList.add('bg-primary', 'bg-opacity-10');
            setTimeout(() => {
                userRow.classList.remove('bg-primary', 'bg-opacity-10');
            }, 1500);
            
            // Focus on notification title field
            document.getElementById('notification-title').focus();
        }
    }, 300); // Give time for the user list to populate
}

// User Management Section
function renderUsers() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    const authNotifications = notifications.filter(n => n.type === 'auth');

    return `
        <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold">User Management</h2>
                <div class="text-sm text-gray-500">Total Users: ${users.length}</div>
            </div>

            <!-- User Activity -->
            <div class="mb-8">
                <h3 class="text-lg font-semibold mb-4">Recent User Activity</h3>
                <div class="space-y-4">
                    ${authNotifications.slice(0, 5).map(notification => `
                        <div class="flex items-center p-3 bg-gray-50 rounded-lg">
                            <i class="fas ${notification.icon} text-green-500 mr-3"></i>
                            <div class="flex-1">
                                <p class="text-sm font-medium">${notification.message}</p>
                                <p class="text-xs text-gray-500">${new Date(notification.timestamp).toLocaleString()}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- User List -->
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${users.map(user => {
                            const orders = JSON.parse(localStorage.getItem('orders')) || [];
                            const userOrders = orders.filter(order => order.userId === user.id);
                            return `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex items-center">
                                            <img class="h-10 w-10 rounded-full" src="${user.avatar}" alt="">
                                            <div class="ml-4">
                                                <div class="text-sm font-medium text-gray-900">${user.name}</div>
                                                <div class="text-sm text-gray-500">${user.phone || 'No phone'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-900">${user.email}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-900">
                                            ${new Date(user.createdAt).toLocaleDateString()}
                                        </div>
                                        <div class="text-sm text-gray-500">
                                            ${new Date(user.createdAt).toLocaleTimeString()}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            ${userOrders.length} orders
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onclick="viewUserDetails('${user.id}')" class="text-green-600 hover:text-green-900">
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function viewUserDetails(userId) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const userOrders = orders.filter(order => order.userId === userId);

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-start mb-6">
                    <div class="flex items-center">
                        <img class="h-16 w-16 rounded-full" src="${user.avatar}" alt="">
                        <div class="ml-4">
                            <h2 class="text-2xl font-bold">${user.name}</h2>
                            <p class="text-gray-500">${user.email}</p>
                        </div>
                    </div>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- User Stats -->
                <div class="grid grid-cols-3 gap-4 mb-6">
                    <div class="bg-gray-50 p-4 rounded-lg text-center">
                        <div class="text-2xl font-bold text-green-600">${userOrders.length}</div>
                        <div class="text-sm text-gray-600">Total Orders</div>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg text-center">
                        <div class="text-2xl font-bold text-green-600">
                            ${userOrders.reduce((total, order) => total + order.payment.total, 0).toFixed(2)}
                        </div>
                        <div class="text-sm text-gray-600">Total Spent</div>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg text-center">
                        <div class="text-2xl font-bold text-green-600">
                            ${new Date(user.createdAt).toLocaleDateString()}
                        </div>
                        <div class="text-sm text-gray-600">Member Since</div>
                    </div>
                </div>

                <!-- Contact Information -->
                <div class="mb-6">
                    <h3 class="text-lg font-semibold mb-4">Contact Information</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Phone</label>
                            <p class="mt-1">${user.phone || 'Not provided'}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Email</label>
                            <p class="mt-1">${user.email}</p>
                        </div>
                    </div>
                </div>

                <!-- Addresses -->
                <div class="mb-6">
                    <h3 class="text-lg font-semibold mb-4">Saved Addresses</h3>
                    <div class="space-y-4">
                        ${(user.addresses || []).map((address, index) => `
                            <div class="border rounded-lg p-4">
                                <h4 class="font-medium">${address.type || `Address ${index + 1}`}</h4>
                                <p class="text-sm text-gray-600 mt-1">${address.street}</p>
                                <p class="text-sm text-gray-600">${address.city}, ${address.state} ${address.postalCode}</p>
                            </div>
                        `).join('') || '<p class="text-gray-500">No saved addresses</p>'}
                    </div>
                </div>

                <!-- Order History -->
                <div>
                    <h3 class="text-lg font-semibold mb-4">Order History</h3>
                    ${userOrders.length > 0 ? `
                        <div class="space-y-4">
                            ${userOrders.map(order => `
                                <div class="border rounded-lg p-4">
                                    <div class="flex justify-between items-center mb-2">
                                        <span class="font-medium">${order.orderId}</span>
                                        <span class="badge bg-${getOrderStatusColor(order.status)} text-white px-2 py-1 rounded-full text-sm">
                                            ${order.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div class="text-sm text-gray-600">
                                        <p>Date: ${new Date(order.orderDate).toLocaleDateString()}</p>
                                        <p>Items: ${order.items.length}</p>
                                        <p>Total: $${order.payment.total.toFixed(2)}</p>
                                    </div>
                                    <button onclick="viewOrderDetails('${order.orderId}')" 
                                        class="mt-2 text-green-600 hover:text-green-700 text-sm font-medium">
                                        View Details
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <p class="text-gray-500">No orders yet</p>
                    `}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Add users section to admin navigation
function renderAdminNav() {
    return `
        <div class="bg-white shadow-sm">
            <div class="container mx-auto px-4">
                <div class="flex space-x-8">
                    <button onclick="renderOrders()" class="px-3 py-4 text-sm font-medium text-gray-700 border-b-2 hover:text-gray-900 hover:border-gray-300">
                        Orders
                    </button>
                    <button onclick="renderUsers()" class="px-3 py-4 text-sm font-medium text-gray-700 border-b-2 hover:text-gray-900 hover:border-gray-300">
                        Users
                    </button>
                    <button onclick="renderProducts()" class="px-3 py-4 text-sm font-medium text-gray-700 border-b-2 hover:text-gray-900 hover:border-gray-300">
                        Products
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Update main render function
function renderAdmin() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        ${renderAdminNav()}
        <div class="container mx-auto px-4 py-8">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <!-- Stats Cards -->
                ${renderStatsCards()}
            </div>
            
            <!-- Notifications -->
            ${renderNotifications()}
            
            <!-- Content Sections -->
            <div class="mt-8">
                ${renderOrders()}
            </div>
        </div>
    `;
}

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Initialize login form
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleAdminLogin);
    }
    
    // Add logout functionality to the "Back to Store" button
    const logoutBtn = document.querySelector('a[href="../index.html"]');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
            window.location.href = '../index.html';
        });
    }
    
    // Add specific product data for the admin panel
    // This ensures we always have the correct products for order display
    const requiredProducts = [
        {
            id: 7,
            name: 'Luxury Perfume',
            price: 1799,
            category: 'Beauty',
            image: 'https://perfumegallery.ae/cdn/shop/files/Untitleddesign-2024-08-10T105210.629.png?v=1723272747'
        }
    ];
    
    // Store this specifically for the admin panel
    localStorage.setItem('adminProducts', JSON.stringify(requiredProducts));
    
    // Check authentication status
    checkAuth();
    
    // Initialize dashboard if logged in
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        initializeLocalStorage();
        renderAdmin();
    }
});

// Mobile menu toggle
function initializeMobileMenu() {
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });

        // Close sidebar when clicking outside
        mainContent.addEventListener('click', () => {
            if (sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        });

        // Close sidebar when clicking a link (mobile)
        const sidebarLinks = document.querySelectorAll('.sidebar nav a');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                }
            });
        });
    }
}

// Utility Functions
function addNotification(message, icon) {
    const notifications =
        JSON.parse(localStorage.getItem('notifications')) || [];
    notifications.unshift({
        message,
        icon: icon || 'fa-info-circle',
        timestamp: new Date().toISOString()
    });

    // Keep only last 20 notifications
    if (notifications.length > 20) {
        notifications.pop();
    }

    localStorage.setItem('notifications', JSON.stringify(notifications));
    loadNotifications();
}

// Add sample data for testing
function addSampleData() {
    const products = [
        {
            name: 'Sample Product 1',
            description: 'This is a sample product',
            price: 99.99,
            stock: 50,
            category: 'Electronics',
            imageUrl: 'https://via.placeholder.com/150'
        },
        {
            name: 'Sample Product 2',
            description: 'Another sample product',
            price: 149.99,
            stock: 30,
            category: 'Clothing',
            imageUrl: 'https://via.placeholder.com/150'
        }
    ];

    const orders = [
        {
            id: 1,
            customerName: 'John Doe',
            total: 99.99,
            status: 'pending',
            userId: 1
        },
        {
            id: 2,
            customerName: 'Jane Smith',
            total: 149.99,
            status: 'shipped',
            userId: 2
        }
    ];

    const users = [
        {
            name: 'John Doe',
            email: 'john@example.com',
            joinDate: new Date('2024-01-01').toISOString(),
            avatar: 'https://via.placeholder.com/150',
            phone: '1234567890',
            address: '123 Main St',
            status: 'active'
        },
        {
            name: 'Jane Smith',
            email: 'jane@example.com',
            joinDate: new Date('2024-01-15').toISOString(),
            avatar: 'https://via.placeholder.com/150',
            phone: '9876543210',
            address: '456 Elm St',
            status: 'active'
        }
    ];

    if (!localStorage.getItem('products')) {
        localStorage.setItem('products', JSON.stringify(products));
    }
    if (!localStorage.getItem('orders')) {
        localStorage.setItem('orders', JSON.stringify(orders));
    }
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// Add event listener for real-time updates
window.addEventListener('storage', (e) => {
    if (e.key === 'users' || e.key === 'notifications') {
        loadUsers();
        loadNotifications();
        loadDashboardMetrics();
    }
    if (e.key === 'orders' || e.key === 'notifications') {
        loadOrders();
        loadNotifications();
        loadDashboardMetrics();
    }
});

// Stats Cards
function renderStatsCards() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const products = JSON.parse(localStorage.getItem('products')) || [];
    
    // Calculate total revenue
    const totalRevenue = orders.reduce((total, order) => total + order.payment.total, 0);
    
    // Get orders from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrders = orders.filter(order => new Date(order.orderDate) > thirtyDaysAgo);
    const recentRevenue = recentOrders.reduce((total, order) => total + order.payment.total, 0);

    // Calculate pending orders
    const pendingOrders = orders.filter(order => order.status === 'pending').length;

    return `
        <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
                <div class="p-3 rounded-full bg-green-100 text-green-600">
                    <i class="fas fa-shopping-cart text-2xl"></i>
                </div>
                <div class="ml-4">
                    <p class="text-sm text-gray-500">Total Orders</p>
                    <p class="text-2xl font-semibold">${orders.length}</p>
                </div>
            </div>
            <div class="mt-4">
                <p class="text-sm text-gray-500">
                    <span class="text-green-600">
                        <i class="fas fa-arrow-up"></i> ${recentOrders.length}
                    </span>
                    new orders in last 30 days
                </p>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
                <div class="p-3 rounded-full bg-blue-100 text-blue-600">
                    <i class="fas fa-dollar-sign text-2xl"></i>
                </div>
                <div class="ml-4">
                    <p class="text-sm text-gray-500">Total Revenue</p>
                    <p class="text-2xl font-semibold">$${totalRevenue.toFixed(2)}</p>
                </div>
            </div>
            <div class="mt-4">
                <p class="text-sm text-gray-500">
                    <span class="text-blue-600">
                        <i class="fas fa-arrow-up"></i> $${recentRevenue.toFixed(2)}
                    </span>
                    revenue in last 30 days
                </p>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
                <div class="p-3 rounded-full bg-yellow-100 text-yellow-600">
                    <i class="fas fa-users text-2xl"></i>
                </div>
                <div class="ml-4">
                    <p class="text-sm text-gray-500">Total Users</p>
                    <p class="text-2xl font-semibold">${users.length}</p>
                </div>
            </div>
            <div class="mt-4">
                <p class="text-sm text-gray-500">
                    <span class="text-yellow-600">
                        <i class="fas fa-clock"></i> ${pendingOrders}
                    </span>
                    pending orders
                </p>
            </div>
        </div>
    `;
}

// Notifications
function renderNotifications() {
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    
    return `
        <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold">Recent Notifications</h2>
                <button onclick="clearNotifications()" 
                    class="text-sm text-gray-500 hover:text-gray-700">
                    Clear All
                </button>
            </div>
            
            ${notifications.length > 0 ? `
                <div class="space-y-4">
                    ${notifications.slice(0, 10).map(notification => `
                        <div class="flex items-center p-4 bg-gray-50 rounded-lg">
                            <div class="p-2 rounded-full ${getNotificationColor(notification.type)}">
                                <i class="fas ${notification.icon} text-lg"></i>
                            </div>
                            <div class="ml-4 flex-1">
                                <p class="text-sm font-medium">${notification.message}</p>
                                <p class="text-xs text-gray-500">
                                    ${formatTimeAgo(new Date(notification.timestamp))}
                                </p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-bell-slash text-4xl mb-2"></i>
                    <p>No new notifications</p>
                </div>
            `}
        </div>
    `;
}

function clearNotifications() {
    if (confirm('Are you sure you want to clear all notifications?')) {
        localStorage.setItem('notifications', JSON.stringify([]));
        renderAdmin();
    }
}

function getNotificationColor(type) {
    switch (type) {
        case 'order':
            return 'bg-green-100 text-green-600';
        case 'auth':
            return 'bg-blue-100 text-blue-600';
        case 'alert':
            return 'bg-red-100 text-red-600';
        default:
            return 'bg-gray-100 text-gray-600';
    }
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
    
    return date.toLocaleDateString();
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize login form
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleAdminLogin);
    }
    
    // Add logout functionality to the "Back to Store" button
    const logoutBtn = document.querySelector('a[href="../index.html"]');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
            window.location.href = '../index.html';
        });
    }
    
    // Check authentication status
    checkAuth();
    
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Initialize dashboard if logged in
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        initializeLocalStorage();
        renderAdmin();
    }
});