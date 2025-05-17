// Order detail view functions with proper error handling

// Fix for viewOrderDetails function
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

// Fix for viewOrderItems function
function viewOrderItems(index) {
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
            alert('Please reload the page. An error occurred loading the order items.');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'orderItemsModal';
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
                        <button type="button" class="btn btn-primary" onclick="printOrderInvoice('${typeof index === 'string' ? index : order.orderId}')"><i class="fas fa-print me-1"></i> Print Invoice</button>
                    </div>
                </div>
            </div>
        `;
        
        // Remove any existing modals first
        const existingModal = document.getElementById('orderItemsModal');
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
        console.error('Error viewing order items:', error);
        alert('An error occurred while trying to view order items: ' + error.message);
    }
}
