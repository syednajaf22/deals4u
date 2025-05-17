// Enhanced order detail view functions with better error handling
// This script fixes issues with the viewOrderDetails and viewOrderItems functions

// Helper function to find username by userId
function findUsername(userId) {
    try {
        // Get all users from localStorage
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.id === userId);
        
        if (user) {
            return user.username || user.email || userId;
        } else {
            console.log('User not found for ID:', userId);
            return 'Unknown User';
        }
    } catch (error) {
        console.error('Error finding username:', error);
        return 'Error';
    }
}

// Get all available products for lookup
let allProducts = [];

// Function to load all products from multiple possible sources
function loadAllProducts() {
    try {
        // First try to get from localStorage
        const productsFromStorage = JSON.parse(localStorage.getItem('products')) || [];
        
        // Then try to get from window.products if it exists (common in e-commerce sites)
        const windowProducts = window.products || [];
        
        // Combine all products from different sources, removing duplicates
        allProducts = [...productsFromStorage, ...windowProducts];
        
        // Remove duplicates by ID
        const productMap = {};
        allProducts.forEach(product => {
            if (product && product.id) {
                productMap[product.id] = product;
            }
        });
        
        allProducts = Object.values(productMap);
        console.log('Loaded products:', allProducts);
        
        return allProducts;
    } catch (e) {
        console.error('Error loading products:', e);
        return [];
    }
}

// Call loadAllProducts immediately
loadAllProducts();

// Function to view all items in an order using a modal
function viewOrderItems(index) {
    try {
        console.log("Viewing order items for index:", index);
        
        // Get orders from localStorage
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        if (!orders.length) {
            console.error('No orders found');
            alert('No orders found in the system');
            return;
        }
        
        // Find the order in the array
        let order;
        if (typeof index === 'string') {
            order = orders.find(o => o.orderId === index);
        } else {
            order = orders[index];
        }
        
        if (!order) {
            console.error('Order not found with identifier:', index);
            alert('Error: Order not found');
            return;
        }
        
        console.log("Found order for items view:", order);
        
        // Create the modal
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'orderItemsModal';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', 'orderItemsModalLabel');
        modal.setAttribute('aria-hidden', 'true');
        
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-light">
                        <h5 class="modal-title" id="orderItemsModalLabel">
                            <i class="fas fa-shopping-bag me-2 text-primary"></i>
                            Order #${order.orderId || 'Unknown'} Details
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
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
                                        <p class="mb-1"><strong>Name:</strong> ${order.shipping?.fullName || 'N/A'}</p>
                                        <p class="mb-1"><strong>Email:</strong> ${order.shipping?.email || 'N/A'}</p>
                                        <p class="mb-1"><strong>Phone:</strong> ${order.shipping?.phone || 'N/A'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <p class="mb-1"><strong>Address:</strong> ${order.shipping?.address || 'N/A'}</p>
                                        <p class="mb-1"><strong>City:</strong> ${order.shipping?.city || 'N/A'}, ${order.shipping?.state || 'N/A'}</p>
                                        <p class="mb-1"><strong>Postal Code:</strong> ${order.shipping?.postalCode || 'N/A'}</p>
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
                                            ${Array.isArray(order.items) ? order.items.map(item => {
                                                // Print the item object to console for debugging
                                                console.log('Order item (detailed view):', item);
                                                
                                                // Get product details from our enhanced order item structure
                                                // First try product_details (our new structure)
                                                // Then try direct item properties
                                                // Then try nested product
                                                // Finally use fallbacks
                                                const productDetails = item.product_details || {};
                                                const productName = productDetails.name || item.name || (item.product ? item.product.name : '') || 'Product';
                                                const productImage = productDetails.image || item.image || (item.product ? item.product.image : '') || '../img/placeholder.jpg';
                                                const productPrice = item.price || productDetails.price || (item.product ? item.product.price : 0);
                                                const quantity = item.quantity || 1;
                                                const subtotal = item.subtotal || (productPrice * quantity);
                                                
                                                // Get additional details like color and size
                                                const color = item.color || productDetails.color || (item.product ? item.product.color : '');
                                                const size = item.size || productDetails.size || (item.product ? item.product.size : '');
                                                const category = item.category || productDetails.category || (item.product ? item.product.category : '');
                                                const brand = item.brand || productDetails.brand || (item.product ? item.product.brand : '');
                                                
                                                return `
                                                <tr>
                                                    <td>
                                                        <img src="${productImage}" alt="${productName}" 
                                                            class="rounded" style="width: 60px; height: 60px; object-fit: contain;">
                                                    </td>
                                                    <td>
                                                        <div class="fw-medium">${productName}</div>
                                                        ${color ? `<small class="text-muted">Color: ${color}</small>` : ''}
                                                        ${size ? `<small class="text-muted d-block">Size: ${size}</small>` : ''}
                                                        ${category ? `<small class="text-muted d-block">Category: ${category}</small>` : ''}
                                                        ${brand ? `<small class="text-muted d-block">Brand: ${brand}</small>` : ''}
                                                    </td>
                                                    <td class="text-center">PKR ${productPrice.toFixed(2)}</td>
                                                    <td class="text-center">${quantity}</td>
                                                    <td class="text-end">PKR ${subtotal.toFixed(2)}</td>
                                                </tr>
                                                `;
                                            }).join('') : '<tr><td colspan="5" class="text-center">No items found</td></tr>'}
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
                                        <p class="mb-1"><strong>Order Status:</strong> 
                                            <span class="badge bg-${getStatusColor(order.status)}">
                                                ${order.status?.toUpperCase() || 'PENDING'}
                                            </span>
                                        </p>
                                        <p class="mb-1"><strong>Order Date:</strong> ${order.orderDate ? new Date(order.orderDate).toLocaleString() : 'N/A'}</p>
                                        <p class="mb-1"><strong>Payment Method:</strong> ${order.payment?.method === 'wallet' ? 'Wallet Payment' : 'Cash on Delivery'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="text-end">
                                            <p class="mb-1"><strong>Subtotal:</strong> PKR ${order.payment?.subtotal?.toFixed(2) || '0.00'}</p>
                                            <p class="mb-1"><strong>Shipping:</strong> PKR ${order.payment?.shipping?.toFixed(2) || '0.00'}</p>
                                            <p class="mb-0"><strong>Total:</strong> <span class="text-primary fw-bold">PKR ${order.payment?.total?.toFixed(2) || '0.00'}</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-success" onclick="updateOrderStatus('${order.orderId}', 'delivered')">Mark as Delivered</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add the modal to the body
        document.body.appendChild(modal);
        
        // Initialize the Bootstrap modal
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
        
        // Clean up the modal when it's hidden
        modal.addEventListener('hidden.bs.modal', function () {
            document.body.removeChild(modal);
        });
        
    } catch (e) {
        console.error('Error viewing order items:', e);
        alert('There was an error viewing the order items. Please try again.');
    }
}

// Function to look up product details using different methods
function getProductDetails(item) {
    try {
        // If we already have a full product object with both name and price, return it
        if (item && item.name && typeof item.price === 'number') {
            return item;
        }
        
        // Make sure we have loaded products
        if (allProducts.length === 0) {
            loadAllProducts();
        }
        
        // Try to get the product ID from various possible fields
        let productId = null;
        if (item) {
            // Log the item for debugging
            console.log('Looking for product details for item:', item);
            
            // Check various possible ID formats and fields
            if (item.id) productId = item.id;
            else if (item.productId) productId = item.productId;
            else if (item.product_id) productId = item.product_id;
            else if (item.item_id) productId = item.item_id;
            else if (typeof item === 'number') productId = item;
            else if (typeof item === 'string' && !isNaN(parseInt(item))) productId = parseInt(item);
        }
        
        if (productId) {
            // Try to find the product in our loaded products
            const product = allProducts.find(p => {
                return p.id == productId || // Compare with == for type coercion
                       (p.id && p.id.toString() === productId.toString());
            });
            
            if (product) {
                console.log('Found product:', product);
                return product;
            }
        }
        
        // If we can't find the product but have name in the item, use that
        if (item && item.name) {
            // Create a basic product object with what we have
            return {
                name: item.name,
                price: item.price || 0,
                image: item.image || '../img/placeholder.jpg',
                ...item
            };
        }
        
        console.log('Could not find product details for item:', item);
        return item || null;
    } catch (e) {
        console.error('Error getting product details:', e);
        return item || null;
    }
}

// Helper function to get the appropriate status color
function getStatusColor(status) {
    if (!status) return 'secondary';
    
    status = status.toLowerCase();
    switch (status) {
        case 'pending':
            return 'warning';
        case 'shipped':
            return 'info';
        case 'delivered':
            return 'success';
        case 'cancelled':
            return 'danger';
        default:
            return 'secondary';
    }
}

// Fix for viewOrderDetails function
function viewOrderDetails(index) {
    try {
        console.log("Viewing order details for index:", index);
        
        // Get orders from localStorage
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        if (!orders.length) {
            console.error('No orders found');
            alert('No orders found in the system');
            return;
        }
        
        // Find the order in the array
        let order;
        if (typeof index === 'string') {
            order = orders.find(o => o.orderId === index);
        } else {
            order = orders[index];
        }
        
        if (!order) {
            console.error('Order not found with identifier:', index);
            alert('Error: Order not found');
            return;
        }
        
        console.log("Found order:", order);
        
        // Create the modal
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'orderDetailsModal';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', 'orderDetailsModalLabel');
        modal.setAttribute('aria-hidden', 'true');
        
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="orderDetailsModalLabel">Order Details - ${order.orderId || 'Unknown'}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="fw-bold">Customer Information</h6>
                                <div class="alert alert-info p-2 mb-2">
                                    <strong>Username:</strong> ${order.userId ? findUsername(order.userId) : 'Guest Order'}
                                </div>
                                <p><strong>Shipping Name:</strong> ${order.shipping?.fullName || 'N/A'}</p>
                                <p><strong>Email:</strong> ${order.shipping?.email || 'N/A'}</p>
                                <p><strong>Phone:</strong> ${order.shipping?.phone || 'N/A'}</p>
                                <p><strong>Order Date:</strong> ${order.orderDate ? new Date(order.orderDate).toLocaleString() : new Date().toLocaleString()}</p>
                                ${order.paymentMethod ? `<p><strong>Payment Method:</strong> <span class="badge ${order.paymentMethod === 'wallet' ? 'bg-success' : 'bg-primary'}">${order.paymentMethod === 'wallet' ? 'Wallet Payment' : 'Cash on Delivery'}</span></p>` : ''}
                            </div>
                            <div class="col-md-6">
                                <h6 class="fw-bold">Shipping Address</h6>
                                <p>${order.shipping?.address || 'N/A'}</p>
                                <p>${order.shipping?.city || 'N/A'}, ${order.shipping?.state || 'N/A'} ${order.shipping?.postalCode || 'N/A'}</p>
                                <p><strong>Delivery Option:</strong> ${order.shipping?.deliveryOption || 'Standard'}</p>
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
                                    ${Array.isArray(order.items) ? order.items.map(item => {
                                        // Print the item object to console for debugging
                                        console.log('Order item:', item);
                                        
                                        // Get product details from our enhanced order item structure
                                        // First try product_details (our new structure)
                                        // Then try direct item properties
                                        // Then try nested product
                                        // Finally use fallbacks
                                        const productDetails = item.product_details || {};
                                        const productName = productDetails.name || item.name || (item.product ? item.product.name : '') || 'Product';
                                        const productImage = productDetails.image || item.image || (item.product ? item.product.image : '') || '../img/placeholder.jpg';
                                        const productPrice = item.price || productDetails.price || (item.product ? item.product.price : 0);
                                        const quantity = item.quantity || 1;
                                        const subtotal = item.subtotal || (productPrice * quantity);
                                        
                                        return `
                                        <tr>
                                            <td><img src="${productImage}" alt="${productName}" style="width: 50px; height: 50px; object-fit: cover;"></td>
                                            <td>${productName}</td>
                                            <td>PKR ${productPrice.toFixed(2)}</td>
                                            <td>${quantity}</td>
                                            <td>PKR ${subtotal.toFixed(2)}</td>
                                        </tr>
                                        `;
                                    }).join('') : '<tr><td colspan="5" class="text-center">No items found</td></tr>'}
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
                                <p><strong>Payment Method:</strong> <span class="badge ${(order.payment?.method === 'wallet') ? 'bg-success' : 'bg-primary'}">${(order.payment?.method === 'wallet') ? 'Wallet Payment' : 'Cash on Delivery'}</span></p>
                                <p><strong>Subtotal:</strong> PKR ${(order.payment?.subtotal || 0).toFixed(2)}</p>
                                <p><strong>Shipping:</strong> PKR ${(order.payment?.shipping || 0).toFixed(2)}</p>
                                <p><strong>Total:</strong> PKR ${(order.payment?.total || 0).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        // Remove any existing modals
        const existingModal = document.getElementById('orderDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add the modal to the document
        document.body.appendChild(modal);
        
        // Initialize and show the modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        // Remove the modal from the DOM when it's hidden
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    } catch (error) {
        console.error('Error viewing order details:', error);
        alert('An error occurred while trying to view order details: ' + error.message);
    }
}

// Fix for viewOrderItems function
function viewOrderItems(index) {
    try {
        console.log("Viewing order items for index:", index);
        
        // Get orders from localStorage
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        if (!orders.length) {
            console.error('No orders found');
            alert('No orders found in the system');
            return;
        }
        
        // Find the order in the array
        let order;
        if (typeof index === 'string') {
            order = orders.find(o => o.orderId === index);
        } else {
            order = orders[index];
        }
        
        if (!order) {
            console.error('Order not found with identifier:', index);
            alert('Error: Order not found');
            return;
        }
        
        console.log("Found order for items view:", order);
        
        // Create the modal
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'orderItemsModal';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', 'orderItemsModalLabel');
        modal.setAttribute('aria-hidden', 'true');
        
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-light">
                        <h5 class="modal-title" id="orderItemsModalLabel">
                            <i class="fas fa-shopping-bag me-2 text-primary"></i>
                            Order #${order.orderId || 'Unknown'} Details
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
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
                                        <p class="mb-1"><strong>Name:</strong> ${order.shipping?.fullName || 'N/A'}</p>
                                        <p class="mb-1"><strong>Email:</strong> ${order.shipping?.email || 'N/A'}</p>
                                        <p class="mb-1"><strong>Phone:</strong> ${order.shipping?.phone || 'N/A'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <p class="mb-1"><strong>Address:</strong> ${order.shipping?.address || 'N/A'}</p>
                                        <p class="mb-1"><strong>City:</strong> ${order.shipping?.city || 'N/A'}, ${order.shipping?.state || 'N/A'}</p>
                                        <p class="mb-1"><strong>Postal Code:</strong> ${order.shipping?.postalCode || 'N/A'}</p>
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
                                            ${Array.isArray(order.items) ? order.items.map(item => {
                                                // Print the item object to console for debugging
                                                console.log('Order item (detailed view):', item);
                                                
                                                // Get product details from our enhanced order item structure
                                                // First try product_details (our new structure)
                                                // Then try direct item properties
                                                // Then try nested product
                                                // Finally use fallbacks
                                                const productDetails = item.product_details || {};
                                                const productName = productDetails.name || item.name || (item.product ? item.product.name : '') || 'Product';
                                                const productImage = productDetails.image || item.image || (item.product ? item.product.image : '') || '../img/placeholder.jpg';
                                                const productPrice = item.price || productDetails.price || (item.product ? item.product.price : 0);
                                                const quantity = item.quantity || 1;
                                                const subtotal = item.subtotal || (productPrice * quantity);
                                                
                                                // Get additional details like color and size
                                                const color = item.color || productDetails.color || (item.product ? item.product.color : '');
                                                const size = item.size || productDetails.size || (item.product ? item.product.size : '');
                                                const category = item.category || productDetails.category || (item.product ? item.product.category : '');
                                                const brand = item.brand || productDetails.brand || (item.product ? item.product.brand : '');
                                                
                                                return `
                                                <tr>
                                                    <td>
                                                        <img src="${productImage}" alt="${productName}" 
                                                            class="rounded" style="width: 60px; height: 60px; object-fit: contain;">
                                                    </td>
                                                    <td>
                                                        <div class="fw-medium">${productName}</div>
                                                        ${color ? `<small class="text-muted">Color: ${color}</small>` : ''}
                                                        ${size ? `<small class="text-muted d-block">Size: ${size}</small>` : ''}
                                                    </td>
                                                    <td class="text-center">PKR ${productPrice.toFixed(2)}</td>
                                                    <td class="text-center">${quantity}</td>
                                                    <td class="text-end">PKR ${subtotal.toFixed(2)}</td>
                                                </tr>
                                                `;
                                            }).join('') : '<tr><td colspan="5" class="text-center">No items found</td></tr>'}
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
                                        <p class="mb-1"><strong>Order Date:</strong> ${order.orderDate ? new Date(order.orderDate).toLocaleString() : new Date().toLocaleString()}</p>
                                        <p class="mb-1"><strong>Status:</strong> <span class="badge bg-${getStatusColor(order.status)}">${order.status.toUpperCase()}</span></p>
                                        <p class="mb-1"><strong>Payment Method:</strong> 
                                            <span class="badge ${(order.payment?.method === 'wallet') ? 'bg-success' : 'bg-primary'}">
                                                ${(order.payment?.method === 'wallet') ? 'Wallet Payment' : 'Cash on Delivery'}
                                            </span>
                                        </p>
                                        <p class="mb-1"><strong>Shipping Method:</strong> ${(order.shipping?.deliveryOption === 'express') ? 'Express Delivery' : 'Standard Delivery'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="bg-light p-3 rounded">
                                            <div class="d-flex justify-content-between mb-2">
                                                <span>Subtotal:</span>
                                                <span>PKR ${(order.payment?.subtotal || 0).toFixed(2)}</span>
                                            </div>
                                            <div class="d-flex justify-content-between mb-2">
                                                <span>Shipping:</span>
                                                <span>PKR ${(order.payment?.shipping || 0).toFixed(2)}</span>
                                            </div>
                                            <hr>
                                            <div class="d-flex justify-content-between fw-bold">
                                                <span>Total:</span>
                                                <span>PKR ${(order.payment?.total || 0).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="printOrderInvoice('${typeof index === 'string' ? index : order.orderId || 'Unknown'}')">
                            <i class="fas fa-print me-1"></i> Print Invoice
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Remove any existing modals
        const existingModal = document.getElementById('orderItemsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add the modal to the document
        document.body.appendChild(modal);
        
        // Initialize and show the modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        // Remove the modal from the DOM when it's hidden
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    } catch (error) {
        console.error('Error viewing order items:', error);
        alert('An error occurred while trying to view order items: ' + error.message);
    }
}
