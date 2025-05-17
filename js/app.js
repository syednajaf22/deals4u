let currentPage = 'home';
let cart = [];
let searchHistory = [];
let wishlist = [];
let selectedProduct = null;
let selectedColor = null;
let selectedSize = null;
let deliveryOption = 'standard';
let searchTerm = '';
let selectedCategory = 'All'; // Default selected category
let profileStats = {
    totalOrders: 0,
    pendingOrders: 0,
    wishlistItems: 0,
    walletBalance: 0
};

// Real-time update interval (in milliseconds)
const UPDATE_INTERVAL = 5000;

// DOM Elements
const app = document.getElementById('app');

// Router
function navigate(page, data = null) {
    // Stop real-time updates when leaving profile page or wallet page
    if (currentPage === 'profile' || currentPage === 'wallet') {
        stopRealTimeUpdates();
    }

    // Add animation class
    app.classList.add('fade-out');

    setTimeout(() => {
        currentPage = page;
        if (data) {
            selectedProduct = data;
            selectedColor = data.colors[0];
            selectedSize = data.sizes ? data.sizes[0] : null;
        }
        renderApp();
        app.classList.remove('fade-out');
        
        // If navigating to delivery page and user is authenticated, load wallet balance
        if (page === 'delivery' && authState && authState.isAuthenticated) {
            setTimeout(() => {
                loadWalletBalance();
            }, 100);
        }
    }, 150);
}

// Render Functions
function renderApp() {
    switch (currentPage) {
        case 'home':
            renderHome();
            break;
        case 'search':
            renderSearch();
            break;
        case 'cart':
            renderCart();
            break;
        case 'profile':
            if (!authState.isAuthenticated) {
                navigate('login');
                return;
            }
            renderProfile();
            break;
        case 'wallet':
            if (!authState.isAuthenticated) {
                navigate('login');
                return;
            }
            renderWallet();
            break;
        case 'notifications':
            renderNotifications();
            break;
        case 'login':
            app.innerHTML = renderLogin();
            break;
        case 'signup':
            app.innerHTML = renderSignup();
            break;
        case 'product':
            renderProductDetail();
            break;
        case 'wishlist':
            renderWishlist();
            break;
        case 'delivery':
            renderDelivery();
            break;
        default:
            renderHome();
    }
    renderBottomNav();
}

function formatTimestamp(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
        return `${diffInHours} hours ago`;
    } else {
        return date.toLocaleDateString();
    }
}

function renderNotifications() {
    const unreadCount = notifications.filter(n => !n.isRead).length;

    app.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10 shadow-sm">
                <div class="flex items-center p-4">
                    <button onclick="navigate('home')" class="mr-4">
                        <i class="fas fa-arrow-left text-gray-600"></i>
                    </button>
                    <h1 class="text-xl font-bold">Notifications</h1>
                    ${
                        unreadCount > 0
                            ? `
                        <button onclick="markAllAsRead()" class="text-green-600 text-sm font-medium">
                            Mark all as read
                        </button>
                    `
                            : ''
                    }
                </div>
            </div>

            <!-- Notification List -->
            <div class="divide-y divide-gray-200">
                ${
                    notifications.length > 0
                        ? notifications
                              .map(
                                  notification => `
                    <div class="p-4 bg-white ${
                        !notification.isRead ? 'bg-green-50' : ''
                    } transition-colors duration-200">
                        <div class="flex items-start">
                            <div class="flex-shrink-0">
                                <div class="w-10 h-10 rounded-full flex items-center justify-center text-white"
                                     style="background-color: ${getNotificationColor(
                                         notification.color
                                     )}">
                                    <i class="fas ${notification.icon}"></i>
                                </div>
                            </div>
                            <div class="ml-4 flex-1">
                                <div class="flex items-center justify-between">
                                    <h3 class="text-sm font-semibold text-gray-900">
                                        ${notification.title}
                                    </h3>
                                    <p class="text-xs text-gray-500">
                                        ${formatTimestamp(
                                            notification.timestamp
                                        )}
                                    </p>
                                </div>
                                <p class="mt-1 text-sm text-gray-600">
                                    ${notification.message}
                                </p>
                            </div>
                        </div>
                    </div>
                `
                              )
                              .join('')
                        : `
                    <div class="flex flex-col items-center justify-center p-8">
                        <i class="fas fa-bell-slash text-gray-300 text-5xl mb-4"></i>
                        <p class="text-gray-500">No notifications yet</p>
                    </div>
                `
                }
            </div>
        </div>
    `;
}

function getNotificationColor(color) {
    const colors = {
        green: '#4CAF50',
        orange: '#FF9800',
        blue: '#2196F3',
        purple: '#9C27B0',
        red: '#F44336'
    };
    return colors[color] || colors.blue;
}

function markAllAsRead() {
    notifications.forEach(notification => {
        notification.isRead = true;
    });
    renderNotifications();
    showToast('All notifications marked as read');
}

function renderHome() {
    app.innerHTML = `
        <div class="pb-16">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10 shadow-sm">
                <div class="flex items-center p-4">
                    <h1 class="text-xl font-bold flex-1">Home</h1>
                    <div class="flex items-center gap-4">
                        <button onclick="navigate('wishlist')" class="relative">
                            <i class="fas fa-heart text-gray-600"></i>
                            ${
                                wishlist.length > 0
                                    ? `
                                <span class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            `
                                    : ''
                            }
                        </button>
                        <button onclick="navigate('notifications')" class="relative">
                            <i class="fas fa-bell text-gray-600"></i>
                            ${
                                notifications.some(n => !n.isRead)
                                    ? `
                                <span class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            `
                                    : ''
                            }
                        </button>
                        <button onclick="navigate('cart')" class="relative">
                            <i class="fas fa-shopping-cart text-gray-600"></i>
                            ${
                                cart.length > 0
                                    ? `
                                <span class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            `
                                    : ''
                            }
                        </button>
                    </div>
                </div>
            </div>

            <!-- Search Bar -->
            <div class="p-4">
                <div class="relative" onclick="navigate('search')">
                    <input type="text" 
                           placeholder="Search products..." 
                           class="w-full p-3 rounded-lg bg-white shadow-md focus:outline-none"
                           readonly>
                    <span class="absolute right-4 top-3">
                        <i class="fas fa-search text-gray-400"></i>
                    </span>
                </div>
            </div>

            <!-- Stylish Product Banner -->
            <div class="px-4 mb-6">
                <div class="w-full overflow-hidden rounded-lg shadow-md relative">
                    <div class="w-full h-56 bg-gradient-to-r from-blue-900 to-gray-900 flex">
                        <div class="w-1/2 p-6 flex flex-col justify-center">
                            <div class="text-white text-xs uppercase tracking-widest mb-1">New Arrival</div>
                            <h2 class="text-white text-2xl font-bold mb-2">Sauvage Dior</h2>
                            <p class="text-gray-300 text-sm mb-4">A luxurious and bold fragrance for men</p>
                            <div class="text-white text-xl font-bold mb-4">PKR 1799</div>
                            <button onclick="navigate('product', products.find(p => p.id === 7))" 
                                    class="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center">
                                Shop Now
                                <i class="fas fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                         
                    </div>
                </div>
            </div>

            <!-- Categories -->
            <div class="px-4 mb-6">
                <div class="flex overflow-x-auto scroll-smooth space-x-4 pb-2">
                    ${categories
                        .map(
                            category => `
                        <button onclick="filterByCategory('${category}')" 
                                class="ripple flex-shrink-0 px-6 py-2 rounded-full ${
                            category === selectedCategory
                                ? 'bg-green-500 text-white'
                                : 'bg-white shadow'
                        } whitespace-nowrap">
                            ${category}
                        </button>
                    `
                        )
                        .join('')}
                </div>
            </div>

            <!-- Products Grid -->
            <div class="grid grid-cols-2 gap-4 px-4">
                ${products
                    .filter(product => selectedCategory === 'All' || product.category.includes(selectedCategory))
                    .map(
                        product => `
                    <div class="product-card bg-white rounded-lg shadow-md overflow-hidden" 
                         onclick="navigate('product', ${JSON.stringify(
                             product
                         )})">
                        <div class="relative">
                            <img src="${product.image}" 
                                 alt="${product.name}" 
                                 class="w-full h-40 object-contain p-4">
                            <button onclick="event.stopPropagation(); toggleWishlist(${
                                product.id
                            })" 
                                    class="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
                                <i class="fas fa-heart ${
                                    wishlist.includes(product.id)
                                        ? 'text-red-500'
                                        : 'text-gray-300'
                                }"></i>
                            </button>
                            <button onclick="event.stopPropagation(); viewProduct(${product.id})" 
                                    class="absolute top-2 left-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <div class="p-4">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-green-500 font-medium">
                                    ${
                                        product.available
                                            ? 'In Stock'
                                            : 'Out of Stock'
                                    }
                                </span>
                                <div class="flex items-center">
                                    <span class="mr-1">${product.rating}</span>
                                    <i class="fas fa-star text-yellow-400"></i>
                                </div>
                            </div>
                            <h3 class="font-medium mb-1 truncate">${
                                product.name
                            }</h3>
                            <div class="flex justify-between items-center">
                                <div>
                                    <div class="text-xl font-bold">PKR ${product.price}</div>
                                    <div class="text-xs text-green-600 font-medium">Profit: PKR ${product.price - product.costPrice}</div>
                                </div>
                                <button onclick="event.stopPropagation(); addToCart(${product.id})" 
                                        class="ripple bg-green-500 text-white px-4 py-2 rounded-lg flex items-center">
                                    <i class="fas fa-cart-plus mr-2"></i>
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                `
                    )
                    .join('')}
            </div>
        </div>

        ${renderBottomNav()}
    `;
}

function filterByCategory(category) {
    selectedCategory = category;
    renderHome();
}

function renderProductDetail() {
    if (!selectedProduct) return navigate('home');

    app.innerHTML = `
        <div class="pb-20">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10 shadow-sm">
                <div class="flex items-center p-4">
                    <button onclick="navigate('home')" class="mr-4">
                        <i class="fas fa-arrow-left text-xl"></i>
                    </button>
                    <h1 class="text-xl font-bold">${selectedProduct.name}</h1>
                    <button onclick="shareProduct(${selectedProduct.id})" class="ml-auto">
                        <i class="fas fa-share-alt text-xl"></i>
                    </button>
                </div>
            </div>

            <!-- Product Images -->
            <div class="bg-white mb-2">
                <div class="relative">
                    <img src="${selectedProduct.image}" 
                         alt="${selectedProduct.name}" 
                         class="w-full h-72 object-contain p-4">
                    <button onclick="toggleWishlist(${selectedProduct.id})" 
                            class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                        <i class="fas fa-heart ${wishlist.includes(selectedProduct.id) ? 'text-red-500' : 'text-gray-300'} text-xl"></i>
                    </button>
                </div>
            </div>

            <!-- Product Info -->
            <div class="bg-white p-4 pb-24">
                <div class="mb-2">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h2 class="text-2xl font-bold mb-2">${selectedProduct.name}</h2>
                            <div class="flex items-center">
                                <div class="flex items-center mr-4">
                                    <span class="mr-1">${selectedProduct.rating}</span>
                                    <i class="fas fa-star text-yellow-400"></i>
                                </div>
                                <span class="text-gray-500">${selectedProduct.reviews ? selectedProduct.reviews.length : '0'} reviews</span>
                            </div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-green-500">PKR ${selectedProduct.price}</div>
                            <div class="text-sm text-green-600 font-medium text-right">Profit: PKR ${selectedProduct.price - selectedProduct.costPrice}</div>
                        </div>
                    </div>
                    
                    <!-- Add to Cart Button -->
                    <button onclick="addToCart(selectedProduct.id)" 
                            class="w-full bg-green-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center mt-3 mb-4">
                        <i class="fas fa-cart-plus mr-2"></i>
                        Add to Cart
                    </button>
                </div>

                <!-- Color Selection -->
                <div class="mb-6">
                    <h3 class="text-base font-semibold mb-3">Select Color</h3>
                    <div class="flex space-x-3">
                        ${selectedProduct.colors.map(color => `
                            <button onclick="selectColor('${color}')" 
                                    class="w-12 h-12 rounded-full border-2 flex items-center justify-center ${selectedColor === color ? 'border-green-500' : 'border-gray-200'}">
                                <div class="w-8 h-8 rounded-full" 
                                     style="background-color: ${color.toLowerCase()}"></div>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Quantity Picker -->
                <div class="mb-6">
                    <h3 class="text-base font-semibold mb-3">Quantity</h3>
                    <div class="flex items-center">
                        <button onclick="updateQuantity(selectedProduct.id, Math.max(1, (selectedProduct.quantity || 1) - 1))"
                                class="w-8 h-8 rounded border border-gray-300 flex items-center justify-center">
                            <i class="fas fa-minus text-sm"></i>
                        </button>
                        <span class="text-base font-semibold mx-5">${selectedProduct.quantity || 1}</span>
                        <button onclick="updateQuantity(selectedProduct.id, (selectedProduct.quantity || 1) + 1)"
                                class="w-8 h-8 rounded border border-gray-300 flex items-center justify-center">
                            <i class="fas fa-plus text-sm"></i>
                        </button>
                    </div>
                </div>

                <!-- Product Description -->
                <div class="mb-6">
                    <h3 class="text-base font-semibold mb-3">Description</h3>
                    <p class="text-gray-600">${selectedProduct.description}</p>
                </div>

                <!-- Tabs Interface -->
                <div class="mb-16">
                    <div class="flex border-b border-gray-200 mb-4">
                        <button id="tab-specs" onclick="switchTab('specs')" 
                                class="flex-1 py-3 font-medium text-center border-b-2 border-green-500 text-green-500">
                            Specifications
                        </button>
                        <button id="tab-reviews" onclick="switchTab('reviews')" 
                                class="flex-1 py-3 font-medium text-center border-b-2 border-transparent text-gray-500">
                            Reviews (${selectedProduct.reviews ? selectedProduct.reviews.length : 0})
                        </button>
                        <button id="tab-payment" onclick="switchTab('payment')" 
                                class="flex-1 py-3 font-medium text-center border-b-2 border-transparent text-gray-500">
                            Payment
                        </button>
                    </div>

                    <!-- Specifications Tab Content -->
                    <div id="content-specs" class="tab-content block">
                        <ul class="space-y-2">
                            ${selectedProduct.specs && selectedProduct.specs.length ? selectedProduct.specs.map(spec => `
                                <li class="flex items-center py-2">
                                    <i class="fas fa-check text-green-500 mr-3"></i>
                                    <span>${spec}</span>
                                </li>
                            `).join('') : `
                                <li class="text-center text-gray-500 py-4">No specifications available</li>
                            `}
                        </ul>
                    </div>
                    
                    <!-- Reviews Tab Content -->
                    <div id="content-reviews" class="tab-content hidden">
                        ${selectedProduct.reviews && selectedProduct.reviews.length ? `
                            <div class="space-y-4">
                                ${selectedProduct.reviews.map(review => `
                                    <div class="bg-gray-50 rounded-lg p-4">
                                        <div class="flex justify-between items-center mb-2">
                                            <div class="font-medium">${review.user}</div>
                                            <div class="flex items-center">
                                                <span class="mr-1">${review.rating}</span>
                                                <i class="fas fa-star text-yellow-400"></i>
                                            </div>
                                        </div>
                                        <p class="text-gray-600">${review.comment}</p>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
                                <i class="fas fa-comment-slash text-gray-300 text-3xl mb-3"></i>
                                <p>No reviews yet for this product</p>
                            </div>
                        `}
                    </div>
                    
                    <!-- Payment Options Tab Content -->
                    <div id="content-payment" class="tab-content hidden">
                        <div class="space-y-4">
                            <div class="border rounded-lg overflow-hidden">
                                <div class="bg-gray-50 p-3 font-medium border-b">Payment Methods</div>
                                <div class="p-4 space-y-3">
                                    <div class="flex items-center">
                                        <input type="radio" id="payment-cod" name="payment-method" checked class="mr-3">
                                        <label for="payment-cod" class="flex items-center">
                                            <i class="fas fa-money-bill-wave text-green-500 mr-2 text-xl"></i>
                                            Cash on Delivery
                                        </label>
                                    </div>
                                    <div class="flex items-center">
                                        <input type="radio" id="payment-card" name="payment-method" class="mr-3">
                                        <label for="payment-card" class="flex items-center">
                                            <i class="fas fa-credit-card text-blue-500 mr-2 text-xl"></i>
                                            Credit/Debit Card
                                        </label>
                                    </div>
                                    <div class="flex items-center">
                                        <input type="radio" id="payment-wallet" name="payment-method" class="mr-3">
                                        <label for="payment-wallet" class="flex items-center">
                                            <i class="fas fa-wallet text-purple-500 mr-2 text-xl"></i>
                                            Digital Wallet
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div class="border rounded-lg overflow-hidden">
                                <div class="bg-gray-50 p-3 font-medium border-b">Delivery Options</div>
                                <div class="p-4 space-y-2">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center">
                                            <input type="radio" id="delivery-standard" name="delivery-option" checked class="mr-3">
                                            <label for="delivery-standard">Standard Delivery (3-5 days)</label>
                                        </div>
                                        <span class="font-medium">PKR 150</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center">
                                            <input type="radio" id="delivery-express" name="delivery-option" class="mr-3">
                                            <label for="delivery-express">Express Delivery (1-2 days)</label>
                                        </div>
                                        <span class="font-medium">PKR 350</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg">
                    <button onclick="buyNow(selectedProduct.id)"
                            class="w-full bg-black text-white py-3 rounded-lg font-semibold">
                        Buy Now
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderWishlist() {
    app.innerHTML = `
        <div class="pb-16">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10">
                <div class="flex items-center p-4">
                    <button onclick="navigate('home')" class="mr-4">
                        <i class="fas fa-arrow-left text-xl"></i>
                    </button>
                    <h1 class="text-xl font-bold">Wishlist</h1>
                </div>
            </div>

            ${
                wishlist.length === 0
                    ? `
                <div class="flex flex-col items-center justify-center p-8">
                    <i class="fas fa-heart text-gray-300 text-5xl mb-4"></i>
                    <p class="text-gray-500">Your wishlist is empty</p>
                    <button onclick="navigate('home')" 
                            class="mt-4 text-green-500 font-semibold">
                        Continue Shopping
                    </button>
                </div>
            `
                    : `
                <div class="grid grid-cols-2 gap-4 p-4">
                    ${products
                        .filter(p => wishlist.includes(p.id))
                        .map(
                            product => `
                        <div class="product-card bg-white rounded-lg shadow-md overflow-hidden" 
                             onclick="navigate('product', ${JSON.stringify(
                                 product
                             )})">
                            <div class="relative">
                                <img src="${product.image}" 
                                     alt="${product.name}" 
                                     class="w-full h-40 object-contain p-4">
                                <button onclick="event.stopPropagation(); toggleWishlist(${
                                    product.id
                                })" 
                                        class="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
                                    <i class="fas fa-heart text-red-500"></i>
                                </button>
                            </div>
                            <div class="p-4">
                                <h3 class="font-medium mb-1 truncate">${
                                    product.name
                                }</h3>
                                <div class="text-xl font-bold">PKR ${
                                    product.price
                                }</div>
                            </div>
                        </div>
                    `
                        )
                        .join('')}
                </div>
            `
            }
        </div>

        ${renderBottomNav()}
    `;
}

function renderBottomNav() {
    // Create the bottom navigation bar using the global currentPage variable
    return `
        <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe-area z-10">
            <div class="flex justify-around items-center py-3">
                <button onclick="navigate('home')" 
                    class="flex flex-col items-center ${currentPage === 'home' ? 'text-green-600 font-medium' : 'text-gray-600'}">
                    <i class="fas fa-home text-xl mb-1"></i>
                    <span class="text-xs">Home</span>
                </button>
                <button onclick="navigate('search')"
                    class="flex flex-col items-center ${currentPage === 'search' ? 'text-green-600 font-medium' : 'text-gray-600'}">
                    <i class="fas fa-search text-xl mb-1"></i>
                    <span class="text-xs">Search</span>
                </button>
                <button onclick="navigate('cart')"
                    class="flex flex-col items-center ${currentPage === 'cart' ? 'text-green-600 font-medium' : 'text-gray-600'}">
                    <div class="relative">
                        <i class="fas fa-shopping-cart text-xl mb-1"></i>
                        ${cart.length > 0 ? `
                            <span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                ${cart.length}
                            </span>
                        ` : ''}
                    </div>
                    <span class="text-xs">Cart</span>
                </button>
                <button onclick="navigate('wallet')"
                    class="flex flex-col items-center ${currentPage === 'wallet' ? 'text-green-600 font-medium' : 'text-gray-600'}">
                    <i class="fas fa-wallet text-xl mb-1"></i>
                    <span class="text-xs">Wallet</span>
                </button>
                <button onclick="navigate('profile')"
                    class="flex flex-col items-center ${currentPage === 'profile' ? 'text-green-600 font-medium' : 'text-gray-600'}">
                    <i class="fas fa-user text-xl mb-1"></i>
                    <span class="text-xs">Profile</span>
                </button>
            </div>
        </div>
    `;
}

function renderProfile() {
    if (!authState.isAuthenticated) {
        navigate('login');
        return;
    }

    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const userOrders = orders.filter(order => order.userId === authState.currentUser.id);
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const userWishlist = wishlist.filter(item => item.userId === authState.currentUser.id);
    
    // Load the wallet data for displaying wallet balance
    let walletBalance = 0;
    try {
        const walletKey = `wallet_${authState.currentUser.id}`;
        const walletData = JSON.parse(localStorage.getItem(walletKey)) || { balance: 0 };
        walletBalance = parseFloat(walletData.balance) || 0;
        console.log('Loaded wallet balance for profile page:', walletBalance);
    } catch (error) {
        console.error('Error loading wallet balance:', error);
    }

    app.innerHTML = `
        <div class="min-h-screen bg-gray-50 pb-20">
            <div class="bg-white sticky top-0 z-10 shadow-sm">
                <div class="flex items-center p-4">
                    <h1 class="text-xl font-bold flex-1">My Profile</h1>
                    <button onclick="logout()" class="text-gray-600">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            </div>

            <!-- My Wallet Button Section -->
            <div class="px-4 pt-4">
                <button onclick="navigate('wallet')" class="w-full flex items-center justify-between bg-gradient-to-r from-blue-500 to-green-500 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-green-600 transition duration-300 shadow-md">
                    <div class="flex items-center">
                        <i class="fas fa-wallet text-xl mr-3"></i>
                        <span class="font-medium text-lg">My Wallet</span>
                    </div>
                    <div class="bg-white text-green-600 px-3 py-1 rounded-full font-bold">
                        PKR ${walletBalance.toFixed(2)}
                    </div>
                </button>
            </div>
            
            <div class="p-4 space-y-4 mb-24">
                <!-- User Info Card -->
                ${renderUserInfo(userOrders, userWishlist, walletBalance)}

                <!-- Recent Orders -->
                ${renderRecentOrders(userOrders)}

                <!-- Saved Addresses -->
                ${renderSavedAddresses()}
            </div>

            <!-- Bottom Navigation -->
            ${renderBottomNav()}
        </div>
    `;
    
    // Start real-time updates when profile is rendered
    startRealTimeUpdates();
}

function updateProfileStats() {
    if (authState.isAuthenticated) {
        // Fetch latest orders and wishlist data
        const userOrders = JSON.parse(localStorage.getItem(`orders_${authState.userId}`)) || [];
        const userWishlist = JSON.parse(localStorage.getItem(`wishlist_${authState.userId}`)) || [];
        
        // Load wallet data
        loadWalletData();
        
        // Update stats
        profileStats.totalOrders = userOrders.length;
        profileStats.pendingOrders = userOrders.filter(order => order.status === 'pending').length;
        profileStats.wishlistItems = userWishlist.length;
        profileStats.walletBalance = userEarnings.balance;

        // Update UI if on profile page
        if (currentPage === 'profile') {
            const statsContainer = document.getElementById('profile-stats');
            if (statsContainer) {
                statsContainer.innerHTML = `
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="bg-white p-4 rounded-lg shadow text-center">
                            <div class="text-2xl font-bold text-gray-800">${profileStats.totalOrders}</div>
                            <div class="text-sm text-gray-600">Total Orders</div>
                        </div>
                        <div class="bg-white p-4 rounded-lg shadow text-center">
                            <div class="text-2xl font-bold text-gray-800">${profileStats.pendingOrders}</div>
                            <div class="text-sm text-gray-600">Pending Orders</div>
                        </div>
                        <div class="bg-white p-4 rounded-lg shadow text-center">
                            <div class="text-2xl font-bold text-gray-800">${profileStats.wishlistItems}</div>
                            <div class="text-sm text-gray-600">Wishlist Items</div>
                        </div>
                        <div onclick="navigate('wallet')" class="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg shadow-lg text-center cursor-pointer hover:shadow-xl transition-all duration-300 border-l-4 border-green-500">
                            <div class="flex items-center justify-center mb-1">
                                <i class="fas fa-wallet text-green-500 mr-2"></i>
                                <div class="text-2xl font-bold text-green-700">PKR ${profileStats.walletBalance.toFixed(2)}</div>
                            </div>
                            <div class="text-sm font-medium text-blue-600">Wallet Balance</div>
                            <div class="mt-1 text-xs text-gray-500">Click to manage</div>
                        </div>
                    </div>
                `;
            }
        }
        
        // Update wallet UI if on wallet page
        if (currentPage === 'wallet') {
            const walletBalanceElement = document.getElementById('wallet-balance');
            if (walletBalanceElement) {
                walletBalanceElement.textContent = `PKR ${userEarnings.balance.toFixed(2)}`;
            }
        }
    }
}

// Start real-time updates
let statsUpdateInterval;

function startRealTimeUpdates() {
    updateProfileStats(); // Initial update
    statsUpdateInterval = setInterval(updateProfileStats, UPDATE_INTERVAL);
}

function stopRealTimeUpdates() {
    if (statsUpdateInterval) {
        clearInterval(statsUpdateInterval);
    }
}

// Render wallet page to display user earnings, transactions and rewards
function renderWallet() {
    if (!authState.isAuthenticated) {
        navigate('login');
        return;
    }
    
    // Load wallet data
    loadWalletData();
    
    app.innerHTML = `
        <div class="min-h-screen bg-gray-50 pb-20">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10 shadow-sm">
                <div class="flex items-center p-4">
                    <button onclick="navigate('profile')" class="mr-4">
                        <i class="fas fa-arrow-left text-gray-600"></i>
                    </button>
                    <h1 class="text-xl font-bold flex-1">My Wallet</h1>
                </div>
            </div>
            
            <!-- Wallet Balance Card -->
            <div class="p-4">
                <div class="bg-gradient-to-r from-green-500 to-teal-500 rounded-lg shadow-lg p-6 text-white">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-wallet text-3xl mr-4"></i>
                        <div>
                            <h3 class="text-lg font-semibold opacity-90">Available Balance</h3>
                            <h2 id="wallet-balance" class="text-3xl font-bold">PKR ${userEarnings.balance.toFixed(2)}</h2>
                        </div>
                    </div>
                    <div class="border-t border-white border-opacity-30 pt-4 mt-2">
                        <h4 class="font-medium mb-2">Quick Actions</h4>
                        <div class="flex flex-wrap space-x-2 gap-y-2">
                            <button onclick="showDepositModal()" class="bg-green-500 hover:bg-green-600 text-white rounded-full px-4 py-2 text-sm flex items-center font-medium shadow-md">
                                <i class="fas fa-plus-circle mr-2"></i>
                                Deposit
                            </button>
                            <button onclick="showWithdrawModal()" class="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 py-2 text-sm flex items-center font-medium shadow-md">
                                <i class="fas fa-money-bill-wave mr-2"></i>
                                Apply for Withdrawal
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Wallet Tabs -->
            <div class="px-4">
                <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div class="flex border-b">
                        <button onclick="switchWalletTab('transactions')" id="tab-transactions" class="tab-button flex-1 py-3 px-4 font-medium text-center active">
                            Transactions
                        </button>
                        <button onclick="switchWalletTab('rewards')" id="tab-rewards" class="tab-button flex-1 py-3 px-4 font-medium text-center">
                            Rewards
                        </button>
                        <button onclick="switchWalletTab('notifications')" id="tab-notifications" class="tab-button flex-1 py-3 px-4 font-medium text-center">
                            Notifications
                        </button>
                    </div>
                    
                    <!-- Transactions Tab -->
                    <div id="tab-content-transactions" class="tab-content p-4">
                        ${renderTransactionsList()}
                    </div>
                    
                    <!-- Rewards Tab -->
                    <div id="tab-content-rewards" class="tab-content p-4 hidden">
                        ${renderRewardsList()}
                    </div>
                    
                    <!-- Notifications Tab -->
                    <div id="tab-content-notifications" class="tab-content p-4 hidden">
                        <div id="notifications-container">
                            <div class="text-center p-5 text-gray-500">
                                <i class="fas fa-spinner fa-spin text-3xl mb-2"></i>
                                <p>Loading notifications...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    renderBottomNav();
    startRealTimeUpdates();
    
    // Force refresh notifications after rendering the page
    setTimeout(() => {
        try {
            // DIRECT ACCESS - Get user's notifications directly from localStorage
            if (authState && authState.isAuthenticated && authState.currentUser) {
                const userId = authState.currentUser.id;
                const notificationsKey = `notifications_${userId}`;
                const adminNotifications = JSON.parse(localStorage.getItem(notificationsKey)) || [];
                
                if (adminNotifications.length > 0) {
                    console.log('Direct check found notifications:', adminNotifications.length);
                    
                    // Add these notifications to the wallet notifications
                    let updated = false;
                    adminNotifications.forEach(notification => {
                        // Create wallet notification format
                        const walletNotification = {
                            id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                            title: notification.title || 'Notification',
                            message: notification.message,
                            timestamp: notification.timestamp || new Date().toISOString(),
                            isRead: notification.status === 'read',
                            type: notification.type || 'wallet'
                        };
                        
                        // Add to userEarnings notifications
                        userEarnings.notifications.unshift(walletNotification);
                        updated = true;
                    });
                    
                    if (updated) {
                        // Save to wallet data
                        saveWalletData();
                        
                        // Clear the admin notifications
                        localStorage.setItem(notificationsKey, JSON.stringify([]));
                    }
                }
            }
            
            // Now try the existing function if available
            if (typeof forceRefreshNotifications === 'function') {
                console.log('Force refreshing notifications after wallet page render');
                forceRefreshNotifications();
            }
            
            // Just load notification data, but don't display the tab
            if (typeof renderWalletNotifications === 'function') {
                // Quietly refresh notifications in the background
                // but don't switch to the notifications tab
                // This ensures notifications are loaded but not automatically displayed
                setTimeout(() => {
                    // Just update the notifications container if it exists
                    const notificationsContainer = document.getElementById('notifications-container');
                    if (notificationsContainer) {
                        renderWalletNotifications();
                    }
                }, 500);
            }
        } catch (error) {
            console.error('Error handling notifications:', error);
        }
    }, 100);
}

// Render transactions list
function renderTransactionsList() {
    if (userEarnings.transactions.length === 0) {
        return `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-exchange-alt text-4xl mb-2"></i>
                <p>No transactions yet</p>
            </div>
        `;
    }
    
    return `
        <div class="space-y-4">
            ${userEarnings.transactions.map(transaction => `
                <div class="flex items-center justify-between p-3 border-b border-gray-100">
                    <div class="flex items-center">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center text-white ${getTransactionIconBackground(transaction.type)}">
                            <i class="fas ${getTransactionIcon(transaction.type)}"></i>
                        </div>
                        <div class="ml-3">
                            <h4 class="font-medium">${transaction.description}</h4>
                            <p class="text-xs text-gray-500">${formatWalletDate(transaction.date)}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-green-600">+PKR ${transaction.amount.toFixed(2)}</p>
                    </div>
                </div>
            `).join('')}
            
            <!-- Clear Transaction History Button -->
            <div class="mt-6 flex justify-center">
                <button onclick="clearTransactionHistory()" class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm flex items-center">
                    <i class="fas fa-trash-alt mr-2"></i>
                    Clear Transaction History
                </button>
            </div>
        </div>
    `;
}

// Render rewards list
function renderRewardsList() {
    if (userEarnings.rewards.length === 0) {
        return `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-gift text-4xl mb-2"></i>
                <p>No rewards available</p>
            </div>
        `;
    }
    
    return `
        <div class="space-y-4">
            ${userEarnings.rewards.map(reward => `
                <div class="border rounded-lg overflow-hidden ${reward.isRedeemed ? 'bg-gray-50' : 'bg-white'}">
                    <div class="p-4">
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="font-bold text-lg">${reward.title}</h3>
                                <!-- Enhanced Reward Amount Display -->
                                <div class="flex items-center mt-3 mb-2 p-2 bg-green-100 rounded-md">
                                    <i class="fas fa-coins text-green-600 mr-2"></i>
                                    <div>
                                        <span class="font-semibold text-green-800">Reward Amount:</span>
                                        <span class="text-lg font-bold text-green-700 ml-1">PKR ${reward.amount ? reward.amount.toFixed(2) : '0.00'}</span>
                                    </div>
                                </div>
                                <p class="text-gray-600">${reward.description}</p>
                                
                                <!-- Enhanced Expiry Date Display -->
                                <div class="flex items-center mt-3 p-2 ${isExpired(reward.expires) ? 'bg-red-100' : 'bg-amber-100'} rounded-md">
                                    <i class="fas fa-clock text-${isExpired(reward.expires) ? 'red' : 'amber'}-600 mr-2"></i>
                                    <div>
                                        <span class="font-semibold text-${isExpired(reward.expires) ? 'red' : 'amber'}-800">${isExpired(reward.expires) ? 'Expired on:' : 'Expires on:'}</span>
                                        <span class="text-${isExpired(reward.expires) ? 'red' : 'amber'}-700 ml-1">${formatWalletDate(reward.expires)}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="${reward.isRedeemed ? 'bg-gray-300' : 'bg-green-100'} rounded-full p-1 text-xs ${reward.isRedeemed ? 'text-gray-600' : 'text-green-600'} font-medium">
                                ${reward.isRedeemed ? 'Redeemed' : 'Available'}
                            </div>
                        </div>
                    </div>
                    <div class="border-t border-gray-100 p-3">
                        ${reward.isRedeemed ? `
                            <div class="w-full bg-blue-500 text-white py-2 rounded-lg text-center font-medium">
                                <i class="fas fa-check-circle mr-1"></i> Redeemed
                            </div>
                        ` : isExpired(reward.expires) ? `
                            <div class="w-full bg-gray-400 text-white py-2 rounded-lg text-center font-medium cursor-not-allowed">
                                <i class="fas fa-ban mr-1"></i> Expired
                            </div>
                        ` : `
                            <button onclick="window.directRedemption('${reward.id}')" class="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium">
                                <i class="fas fa-gift mr-1"></i> Redeem Now
                            </button>
                        `}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Function to check if a reward has expired
function isExpired(expiryDate) {
    if (!expiryDate) return false;
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    return now > expiry;
}

// Listen for reward redemption events from wallet.js
window.addEventListener('reward:redeemed', function(event) {
    const rewardId = event.detail?.rewardId;
    if (!rewardId) return;
    
    console.log('Received reward:redeemed event for reward ID:', rewardId);
    
    // Find all instances of this reward's redemption button in app.js interface
    const rewardButtons = document.querySelectorAll(`button[onclick*="directRedemption('${rewardId}')"]`);
    
    rewardButtons.forEach(button => {
        // Get the parent container
        const container = button.parentNode;
        
        // Replace the button with the Redeemed indicator
        container.innerHTML = `
            <div class="w-full bg-blue-500 text-white py-2 rounded-lg text-center font-medium">
                <i class="fas fa-check-circle mr-1"></i> Redeemed
            </div>
        `;
        
        // Also update any status indicators
        const card = container.closest('.border');
        if (card) {
            const statusBadge = card.querySelector('.rounded-full');
            if (statusBadge) {
                statusBadge.className = 'bg-gray-300 rounded-full p-1 text-xs text-gray-600 font-medium';
                statusBadge.textContent = 'Redeemed';
            }
        }
    });
})

// Get transaction icon based on type
function getTransactionIcon(type) {
    switch (type) {
        case 'cashback':
            return 'fa-money-bill-wave';
        case 'referral':
            return 'fa-user-plus';
        case 'reward':
            return 'fa-gift';
        case 'profit':
            return 'fa-chart-line';
        default:
            return 'fa-exchange-alt';
    }
}

// Get transaction icon background based on type
function getTransactionIconBackground(type) {
    switch (type) {
        case 'cashback':
            return 'bg-green-600';
        case 'referral':
            return 'bg-purple-600';
        case 'reward':
            return 'bg-orange-500';
        case 'profit':
            return 'bg-teal-600';
        default:
            return 'bg-blue-600';
    }
}

// Switch between wallet tabs
function switchWalletTab(tabName) {
    const tabs = ['transactions', 'rewards', 'notifications'];
    const tabButtons = tabs.map(tab => document.getElementById(`tab-${tab}`));
    const tabContents = tabs.map(tab => document.getElementById(`tab-content-${tab}`));
    
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.add('hidden'));
    
    document.getElementById(`tab-${tabName}`).classList.add('active');
    document.getElementById(`tab-content-${tabName}`).classList.remove('hidden');
    
    // Load notifications if that tab is selected
    if (tabName === 'notifications') {
        loadNotificationsPanel();
        // Mark all as read when tab is opened
        markAllNotificationsAsRead();
    }
}

function renderUserInfo(userOrders, userWishlist) {
    return `
        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
            <!-- Cover Photo -->
            <div class="h-32 bg-gradient-to-r from-green-400 to-blue-500"></div>
            
            <!-- Profile Info -->
            <div class="relative px-6 pb-6">
                <div class="flex flex-col items-center -mt-16">
                    <img src="${authState.currentUser.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(authState.currentUser.name)}" 
                        alt="Profile" 
                        class="w-32 h-32 rounded-full border-4 border-white shadow-lg mb-4">
                    <h2 class="text-2xl font-bold">${authState.currentUser.name}</h2>
                    <p class="text-gray-600 mb-4">${authState.currentUser.email}</p>
                </div>

                <!-- Stats Cards -->
                <div id="profile-stats"></div>
                
                <!-- Wallet Button -->
                <div class="mt-6 mb-4">
                    <button onclick="navigate('wallet')" class="w-full flex items-center justify-between bg-gradient-to-r from-blue-500 to-green-500 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-green-600 transition duration-300 shadow-md">
                        <div class="flex items-center">
                            <i class="fas fa-wallet text-xl mr-3"></i>
                            <span class="font-medium text-lg">My Wallet</span>
                        </div>
                        <div class="bg-white text-green-600 px-3 py-1 rounded-full font-bold">
                            PKR ${walletBalance.toFixed(2)}
                        </div>
                    </button>
                </div>
                


                <!-- Profile Form -->
                <form id="profile-form" onsubmit="updateProfile(event)" class="space-y-4 mt-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="form-group">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input type="text" id="profile-name" value="${authState.currentUser.name}" required
                                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        </div>
                        <div class="form-group">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" id="profile-email" value="${authState.currentUser.email}" required
                                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="form-group">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input type="tel" id="profile-phone" value="${authState.currentUser.phone || ''}"
                                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        </div>
                        <div class="form-group">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                            <input type="date" id="profile-dob" value="${authState.currentUser.dob || ''}"
                                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        </div>
                    </div>
                    <button type="submit" 
                        class="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center justify-center">
                        <i class="fas fa-save mr-2"></i>
                        Update Profile
                    </button>
                </form>
            </div>
        </div>
    `;
}

function renderRecentOrders(userOrders) {
    return `
        <div class="bg-white rounded-lg shadow-lg p-6">
            <h3 class="text-lg font-semibold mb-4">Recent Orders</h3>
            ${userOrders.length > 0 ? `
                <div class="space-y-4">
                    ${userOrders.slice(0, 5).map(order => `
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
                                <p>Total: PKR ${order.payment.total.toFixed(2)}</p>
                            </div>
                            
                        </div>
                    `).join('')}
                </div>
                <button onclick="viewAllOrders()" class="mt-4 text-green-600 hover:text-green-700 font-medium">
                    View All Orders
                </button>
            ` : `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-shopping-bag text-4xl mb-2"></i>
                    <p>No orders yet</p>
                    <button onclick="navigate('home')" class="mt-2 text-green-600 hover:text-green-700 font-medium">
                        Start Shopping
                    </button>
                </div>
            `}
        </div>
    `;
}

function getOrderStatusColor(status) {
    switch (status.toLowerCase()) {
        case 'pending':
            return 'yellow-500';
        case 'processing':
            return 'blue-500';
        case 'shipped':
            return 'purple-500';
        case 'delivered':
            return 'green-500';
        case 'cancelled':
            return 'red-500';
        default:
            return 'gray-500';
    }
}

function renderSavedAddresses() {
    return `
        <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold">Saved Addresses</h3>
                <button onclick="addNewAddress()" class="text-green-600 hover:text-green-700">
                    <i class="fas fa-plus mr-1"></i> Add New
                </button>
            </div>
            ${(authState.currentUser.addresses || []).length > 0 ? `
                <div class="space-y-4">
                    ${(authState.currentUser.addresses || []).map((address, index) => `
                        <div class="border rounded-lg p-4">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h4 class="font-medium">${address.type || 'Address'} ${index + 1}</h4>
                                    <p class="text-sm text-gray-600 mt-1">${address.street}</p>
                                    <p class="text-sm text-gray-600">${address.city}, ${address.state} ${address.postalCode}</p>
                                </div>
                                <div class="flex space-x-2">
                                    <button onclick="editAddress(${index})" class="text-blue-600 hover:text-blue-700">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="deleteAddress(${index})" class="text-red-600 hover:text-red-700">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-map-marker-alt text-4xl mb-2"></i>
                    <p>No saved addresses</p>
                </div>
            `}
        </div>
    `;
}

function renderDelivery() {
    // Initialize variables for checkout if not already set
    if (typeof deliveryOption === 'undefined') {
        deliveryOption = 'standard';
    }
    
    const total = calculateSubtotal();
    const deliveryFee = deliveryOption === 'express' ? 50 : 0;
    const finalTotal = total + deliveryFee;

    app.innerHTML = `
        <div class="min-h-screen pb-20">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10">
                <div class="flex items-center p-4">
                    <button onclick="navigate('cart')" class="mr-4">
                        <i class="fas fa-arrow-left text-xl"></i>
                    </button>
                    <h1 class="text-xl font-bold">Delivery Details</h1>
                </div>
                <!-- Progress Steps -->
                <div class="flex justify-between px-8 py-4 border-t">
                    <div class="flex flex-col items-center">
                        <div class="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center mb-1">
                            <i class="fas fa-shopping-cart"></i>
                        </div>
                        <span class="text-xs text-green-500">Cart</span>
                    </div>
                    <div class="flex-1 flex items-center justify-center">
                        <div class="h-1 w-full bg-green-500"></div>
                    </div>
                    <div class="flex flex-col items-center">
                        <div class="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center mb-1">
                            <i class="fas fa-map-marker-alt"></i>
                        </div>
                        <span class="text-xs text-green-500">Delivery</span>
                    </div>
                    <div class="flex-1 flex items-center justify-center">
                        <div class="h-1 w-full bg-gray-300"></div>
                    </div>
                    <div class="flex flex-col items-center">
                        <div class="w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center mb-1">
                            <i class="fas fa-check"></i>
                        </div>
                        <span class="text-xs text-gray-500">Complete</span>
                    </div>
                </div>
            </div>

            <!-- Delivery Form -->
            <form id="deliveryForm" class="p-4 space-y-6" onsubmit="event.preventDefault(); placeOrder();">
            
            
            
            
            
                <!-- Contact Information -->
                <div class="bg-white p-4 rounded-lg shadow-sm">
                    <h2 class="text-lg font-semibold mb-4">Contact Information</h2>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-gray-700 text-sm font-medium mb-2">Full Name</label>
                            <input type="text" id="fullName" required
                                   class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                                   placeholder="Enter your full name">
                        </div>
                        <div>
                            <label class="block text-gray-700 text-sm font-medium mb-2">Phone Number</label>
                            <input type="tel" id="phone" required
                                   class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                                   placeholder="Enter your phone number">
                        </div>
                        <div>
                            <label class="block text-gray-700 text-sm font-medium mb-2">Email</label>
                            <input type="email" id="email" required
                                   class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                                   placeholder="Enter your email">
                        </div>
                    </div>
                </div>

                <!-- Delivery Address -->
                <div class="bg-white p-4 rounded-lg shadow-sm">
                    <h2 class="text-lg font-semibold mb-4">Delivery Address</h2>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-gray-700 text-sm font-medium mb-2">Street Address</label>
                            <input type="text" id="address" required
                                   class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                                   placeholder="Enter street address">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-gray-700 text-sm font-medium mb-2">City</label>
                                <input type="text" id="city" required
                                       class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                                       placeholder="Enter city">
                            </div>
                            <div>
                                <label class="block text-gray-700 text-sm font-medium mb-2">Postal Code</label>
                                <input type="text" id="postalCode" required
                                       class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                                       placeholder="Enter postal code">
                            </div>
                        </div>
                        <div>
                            <label class="block text-gray-700 text-sm font-medium mb-2">State</label>
                            <input type="text" id="state" required
                                   class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                                   placeholder="Enter state">
                        </div>
                    </div>
                </div>

                <!-- Delivery Options -->
                <div class="bg-white p-4 rounded-lg shadow-sm">
                    <h2 class="text-lg font-semibold mb-4">Delivery Method</h2>
                    <div class="space-y-2">
                        <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="radio" name="deliveryOption" value="standard" 
                                   ${
                                       deliveryOption === 'standard'
                                           ? 'checked'
                                           : ''
                                   }
                                   onchange="updateDeliveryOption('standard')"
                                   class="w-4 h-4 text-green-500">
                            <div class="ml-3 flex-1">
                                <div class="font-medium">Standard Delivery</div>
                                <div class="text-sm text-gray-500">7-10 business days</div>
                            </div>
                            <div class="font-medium text-green-500">Free</div>
                        </label>
                        <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="radio" name="deliveryOption" value="express"
                                   ${
                                       deliveryOption === 'express'
                                           ? 'checked'
                                           : ''
                                   }
                                   onchange="updateDeliveryOption('express')"
                                   class="w-4 h-4 text-green-500">
                            <div class="ml-3 flex-1">
                                <div class="font-medium">Express Delivery</div>
                                <div class="text-sm text-gray-500">4-6 business days</div>
                            </div>
                            <div class="font-medium text-green-500">PKR 50</div>
                        </label>
                    </div>
                </div>
                
                <!-- Payment Method -->
                <div class="bg-white p-4 rounded-lg shadow-sm">
                    <h2 class="text-lg font-semibold mb-4">Payment Method</h2>
                    <div class="space-y-2">
                        <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="radio" name="paymentMethod" value="cod" 
                                   checked
                                   onchange="updatePaymentMethod('cod')"
                                   class="w-4 h-4 text-green-500">
                            <div class="ml-3 flex-1">
                                <div class="font-medium">Cash on Delivery</div>
                                <div class="text-sm text-gray-500">Pay when you receive your order</div>
                            </div>
                            <div class="text-2xl text-gray-400"><i class="fas fa-money-bill-wave"></i></div>
                        </label>
                        <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${!authState.isAuthenticated ? 'opacity-50 pointer-events-none' : ''}">
                            <input type="radio" name="paymentMethod" value="wallet"
                                   ${!authState.isAuthenticated ? 'disabled' : ''}
                                   onchange="updatePaymentMethod('wallet')"
                                   class="w-4 h-4 text-green-500">
                            <div class="ml-3 flex-1">
                                <div class="font-medium">Wallet Balance</div>
                                <div class="text-sm text-gray-500">
                                    ${authState.isAuthenticated ? 
                                        `Available balance: PKR <span id="available-wallet-balance">0.00</span>` : 
                                        'Please login to use wallet payment'}
                                </div>
                            </div>
                            <div class="text-2xl text-gray-400"><i class="fas fa-wallet"></i></div>
                        </label>
                    </div>
                </div>

                <!-- Order Summary -->
                <div class="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
                    <div class="flex justify-between items-center mb-4">
                        <div class="text-gray-600">Total Amount</div>
                        <div class="text-xl font-bold">PKR ${finalTotal}</div>
                    </div>
                    <button type="submit"
                            class="w-full bg-green-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center">
                        <i class="fas fa-lock mr-2"></i>
                        Place Order
                    </button>
                </div>
            </form>
        </div>

        <!-- Success Modal -->
        <div id="successModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50">
            <div class="bg-white rounded-lg p-6 w-[90%] max-w-md">
                <div class="text-center">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-check text-3xl text-green-500 success-checkmark"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">Order Placed Successfully!</h3>
                    <p class="text-gray-600 mb-6">Thank you for your order. We'll send you a confirmation email shortly.</p>
                    <button onclick="navigate('home')" 
                            class="w-full bg-green-500 text-white py-3 rounded-lg font-semibold">
                        Continue Shopping
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Payment method variable
let paymentMethod = 'cod'; // Default payment method

function updateDeliveryOption(option) {
    deliveryOption = option;
    updateOrderSummary();
}

function updatePaymentMethod(method) {
    paymentMethod = method;
    console.log(`Payment method updated to: ${method}`);
    
    // If wallet payment method is selected, ensure we show the latest balance
    if (method === 'wallet') {
        loadWalletBalance();
    }
}

function checkout() {
    if (cart.length === 0) {
        showToast('Your cart is empty');
        return;
    }
    
    // Check if user is logged in
    if (!authState.isAuthenticated) {
        // Store a flag to redirect back to checkout after login
        localStorage.setItem('redirectAfterLogin', 'delivery');
        showToast('Please login to continue with checkout');
        navigate('login');
        return;
    }
    
    navigate('delivery');
}

// Function to load wallet balance when checkout page is rendered
function loadWalletBalance() {
    if (!authState.isAuthenticated) return;

    const walletKey = `wallet_${authState.currentUser.id}`;
    const walletData = JSON.parse(localStorage.getItem(walletKey)) || { balance: 0 };
    
    // Update the balance display
    const balanceElement = document.getElementById('available-wallet-balance');
    if (balanceElement) {
        balanceElement.textContent = walletData.balance.toFixed(2);
    }
}

// Function to check if wallet has sufficient funds
function checkWalletBalance(amount) {
    if (!authState.isAuthenticated) return false;
    
    const walletKey = `wallet_${authState.currentUser.id}`;
    const walletData = JSON.parse(localStorage.getItem(walletKey)) || { balance: 0 };
    
    return walletData.balance >= amount;
}

// Function to deduct amount from wallet
function deductFromWallet(amount, orderId) {
    if (!authState.isAuthenticated) return false;
    
    const walletKey = `wallet_${authState.currentUser.id}`;
    const walletData = JSON.parse(localStorage.getItem(walletKey)) || { 
        balance: 0,
        transactions: []
    };
    
    // Check if sufficient balance
    if (walletData.balance < amount) return false;
    
    // Deduct amount and record transaction
    walletData.balance -= amount;
    
    // Add transaction record
    if (!walletData.transactions) walletData.transactions = [];
    
    walletData.transactions.unshift({
        id: Date.now(),
        type: 'deduction',
        amount: amount,
        date: Date.now(),
        description: `Payment for Order ${orderId}`
    });
    
    // Save updated wallet data
    localStorage.setItem(walletKey, JSON.stringify(walletData));
    
    // Add notification for user
    const userNotificationsKey = `notifications_${authState.currentUser.id}`;
    const userNotifications = JSON.parse(localStorage.getItem(userNotificationsKey)) || [];
    
    userNotifications.unshift({
        title: 'Payment Completed',
        message: `PKR ${amount.toFixed(2)} has been deducted from your wallet for Order ${orderId}`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'deduction'
    });
    
    localStorage.setItem(userNotificationsKey, JSON.stringify(userNotifications));
    
    return true;
}

function placeOrder() {
    const form = document.getElementById('deliveryForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const orderTotal = calculateSubtotal() + (deliveryOption === 'express' ? 50 : 0);
    
    // Calculate total profit for this order
    const totalProfit = cart.reduce((sum, item) => {
        const product = products.find(p => p.id === item.id);
        if (product) {
            return sum + ((product.price - product.costPrice) * item.quantity);
        }
        return sum;
    }, 0);
    
    // Check wallet balance if payment method is wallet
    if (paymentMethod === 'wallet') {
        if (!authState.isAuthenticated) {
            showToast('Please login to use wallet payment');
            return;
        }
        
        // Check if wallet has sufficient funds
        if (!checkWalletBalance(orderTotal)) {
            showToast('Insufficient funds in your wallet. Please add funds or choose another payment method.');
            return;
        }
    }

    // Collect form data
    const orderId = `ORD-${Date.now()}`;
    const formData = {
        orderId: orderId,
        userId: authState.currentUser?.id,
        userName: authState.currentUser?.name,
        orderDate: new Date().toISOString(),
        status: 'pending',
        items: cart.map(item => {
            // Find the complete product details from the products array
            const productDetails = products.find(p => p.id === item.id) || {};
            
            // Create a complete item object with all available product details
            return {
                id: item.id,
                name: item.name || productDetails.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image || productDetails.image,
                subtotal: item.price * item.quantity,
                description: productDetails.description,
                category: productDetails.category,
                brand: productDetails.brand,
                color: item.color || productDetails.color,
                size: item.size || productDetails.size,
                // Include a direct reference to the product for easy lookup
                product_id: item.id,
                product_details: {
                    name: productDetails.name,
                    description: productDetails.description,
                    category: productDetails.category,
                    price: productDetails.price,
                    image: productDetails.image
                }
            };
        }),
        shipping: {
            fullName: document.getElementById('fullName').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            postalCode: document.getElementById('postalCode').value,
            deliveryOption: deliveryOption
        },
        payment: {
            method: paymentMethod,
            subtotal: calculateSubtotal(),
            shipping: deliveryOption === 'express' ? 50 : 0,
            total: orderTotal
        }
    };

    // Process wallet payment if selected
    if (paymentMethod === 'wallet' && authState.isAuthenticated) {
        const success = deductFromWallet(orderTotal, orderId);
        if (!success) {
            showToast('Failed to process wallet payment. Please try again.');
            return;
        }
    }

    // Save order to localStorage
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.unshift(formData);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Record profit transaction in admin wallet
    const adminWallet = JSON.parse(localStorage.getItem('wallet_admin')) || {
        balance: 0,
        transactions: [],
        rewards: [],
        notifications: []
    };
    
    // Create profit transaction
    adminWallet.transactions.unshift({
        id: Date.now(),
        type: 'profit',
        amount: totalProfit,
        date: Date.now(),
        description: `Profit from Order ${orderId} (${formData.items.length} items)`
    });
    
    // Update admin balance
    adminWallet.balance += totalProfit;
    
    // Save updated admin wallet
    localStorage.setItem('wallet_admin', JSON.stringify(adminWallet));

    // Add notification for admin
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    notifications.unshift({
        message: `New order received: ${formData.orderId} (${paymentMethod === 'wallet' ? 'Paid via Wallet' : 'Cash on Delivery'})`,
        icon: 'fa-shopping-cart',
        timestamp: new Date().toISOString(),
        type: 'order'
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));

    // Clear cart
    resetCart();

    // Show success message and redirect
    showToast('Order placed successfully!');
    setTimeout(() => {
        navigate('profile');
    }, 2000);
}

function renderSearch() {
    const randomTags = getRandomTrendingTags();

    app.innerHTML = `
        <div class="min-h-screen bg-gray-50">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10 shadow-sm">
                <div class="flex items-center p-4">
                    <button onclick="navigate('home')" class="mr-4">
                        <i class="fas fa-arrow-left text-gray-600"></i>
                    </button>
                    <div class="flex-1 relative">
                        <input type="text" 
                               placeholder="Search products..." 
                               class="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                               oninput="setSearchTerm(this.value)"
                               value="${searchTerm || ''}">
                        <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>
            </div>

            <!-- Trending Tags -->
            <div class="p-4">
                <div class="mb-4">
                    <h2 class="text-lg font-semibold mb-3">Trending Now</h2>
                    <div class="flex flex-wrap gap-2">
                        ${randomTags
                            .map(
                                tag => `
                            <button onclick="setSearchTerm('${tag.name}')"
                                    class="px-4 py-2 bg-white rounded-full border border-gray-200 text-sm text-gray-700 hover:bg-green-50 hover:border-green-500 hover:text-green-600 transition-colors duration-200">
                                <i class="fas fa-trending-up text-green-500 mr-1"></i>
                                ${tag.name}
                            </button>
                        `
                            )
                            .join('')}
                    </div>
                </div>

                <!-- Search History -->
                ${
                    searchHistory.length > 0
                        ? `
                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <h2 class="text-lg font-semibold text-gray-800">Recent Searches</h2>
                            <button onclick="clearSearchHistory()" 
                                    class="text-sm text-green-600 hover:text-green-700">
                                Clear All
                            </button>
                        </div>
                        <div class="space-y-2">
                            ${searchHistory
                                .map(
                                    term => `
                                <button onclick="setSearchTerm('${term}')"
                                        class="w-full p-3 bg-white rounded-lg flex items-center text-gray-700 hover:bg-gray-50">
                                    <i class="fas fa-history text-gray-400 mr-3"></i>
                                    ${term}
                                </button>
                            `
                                )
                                .join('')}
                        </div>
                    </div>
                `
                        : ''
                }
            </div>

            <!-- Search Results -->
            ${
                searchTerm
                    ? `
                <div class="p-4 grid grid-cols-2 gap-4">
                    ${products
                        .filter(
                            product =>
                                product.name
                                    .toLowerCase()
                                    .includes(searchTerm.toLowerCase()) ||
                                product.category
                                    .toLowerCase()
                                    .includes(searchTerm.toLowerCase())
                        )
                        .map(
                            product => `
                            <div class="bg-white rounded-lg shadow overflow-hidden">
                                <img src="${product.image}" alt="${
                                    product.name
                                }" class="w-full h-40 object-cover">
                                <div class="p-3">
                                    <h3 class="font-semibold text-gray-800 truncate">${product.name}</h3>
                                    <p class="text-green-600 font-bold mt-1">$${product.price}</p>
                                </div>
                            </div>
                        `
                        )
                        .join('')}
                </div>
            `
                    : ''
            }
        </div>
    `;
}

function getRandomTrendingTags(count = 6) {
    return trendingTags.sort(() => Math.random() - 0.5).slice(0, count);
}

function setSearchTerm(term) {
    searchTerm = term;
    renderApp();
}

function clearSearchHistory() {
    searchHistory = [];
    renderApp();
}

function renderCart() {
    const total = cart.reduce(
        (sum, item) =>
            sum + products.find(p => p.id === item.id).price * item.quantity,
        0
    );

    app.innerHTML = `
        <div class="pb-32">
            <!-- Header -->
            <div class="bg-white sticky top-0 z-10">
                <div class="flex items-center p-4">
                    <button onclick="navigate('home')" class="mr-4">
                        <i class="fas fa-arrow-left text-xl"></i>
                    </button>
                    <h1 class="text-xl font-bold">Shopping Cart (${
                        cart.length
                    })</h1>
                </div>
            </div>

            ${
                cart.length === 0
                    ? `
                <div class="flex flex-col items-center justify-center p-8">
                    <i class="fas fa-shopping-cart text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 text-lg mb-4">Your cart is empty</p>
                    <button onclick="navigate('home')" 
                            class="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold">
                        Start Shopping
                    </button>
                </div>
            `
                    : `
                <!-- Cart Items -->
                <div class="space-y-4 p-4">
                    ${cart
                        .map(item => {
                            const product = products.find(
                                p => p.id === item.id
                            );
                            if (!product) return '';
                            return `
                            <div class="bg-white rounded-lg shadow-md p-4">
                                <div class="flex items-center">
                                    <img src="${product.image}" 
                                         alt="${product.name}" 
                                         class="w-20 h-20 object-contain mr-4">
                                    <div class="flex-1">
                                        <h3 class="font-medium mb-1">${
                                            product.name
                                        }</h3>
                                        <div class="text-gray-500 mb-2">
                                            ${
                                                item.color
                                                    ? `Color: ${item.color}`
                                                    : ''
                                            }
                                            ${
                                                item.size
                                                    ? ` • Size: ${item.size}`
                                                    : ''
                                            }
                                        </div>
                                        <div class="flex justify-between items-center">
                                            <div>
                                                <div class="text-xl font-bold">PKR ${product.price}</div>
                                                <div class="text-xs text-green-600 font-medium">Profit: PKR ${product.price - product.costPrice}</div>
                                            </div>
                                            <div class="flex items-center space-x-3">
                                                <button onclick="updateQuantity(${
                                                    product.id
                                                }, ${item.quantity - 1})"
                                                        class="w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                                                            item.quantity === 1
                                                                ? 'text-red-500 border-red-500'
                                                                : ''
                                                        }">
                                                    <i class="fas ${
                                                        item.quantity === 1
                                                            ? 'fa-trash'
                                                            : 'fa-minus'
                                                    }"></i>
                                                </button>
                                                <span class="font-medium">${
                                                    item.quantity
                                                }</span>
                                                <button onclick="updateQuantity(${
                                                    product.id
                                                }, ${item.quantity + 1})"
                                                        class="w-8 h-8 rounded-full border-2 flex items-center justify-center">
                                                    <i class="fas fa-plus"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                        })
                        .join('')}
                </div>

                <!-- Order Summary -->
                <div class="bg-white p-4 mb-4">
                    <h3 class="text-lg font-semibold mb-4">Order Summary</h3>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Subtotal</span>
                            <span class="font-medium">PKR ${calculateSubtotal()}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Shipping</span>
                            <span class="font-medium">Free</span>
                        </div>
                        <div class="border-t pt-2 mt-2">
                            <div class="flex justify-between">
                                <span class="font-semibold">Total</span>
                                <span class="font-bold text-xl">PKR ${calculateSubtotal()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `
            }

            ${
                cart.length > 0
                    ? `
                <!-- Checkout Button -->
                <div class="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg">
                    <button onclick="checkout()" 
                            class="w-full bg-green-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center">
                        <i class="fas fa-lock mr-2"></i>
                        Proceed to Checkout (PKR ${calculateSubtotal()})
                    </button>
                </div>
            `
                    : ''
            }
        </div>
    `;
}

function calculateSubtotal() {
    return cart.reduce((total, item) => {
        const product = products.find(p => p.id === item.id);
        return total + (product ? product.price * item.quantity : 0);
    }, 0);
}

function login() {
    authState.isAuthenticated = true;
    authState.currentUser = {
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://via.placeholder.com/50',
        phone: '+1234567890',
        address: '123 Street, City, Country'
    };
    showToast('Logged in successfully');
    renderApp();
}

function logout() {
    authState.isAuthenticated = false;
    authState.currentUser = null;
    showToast('Logged out successfully');
    renderApp();
}

function renderLogin() {
    return `
        <div class="flex flex-col items-center justify-center p-8">
            <h2 class="text-2xl font-bold mb-4">Login</h2>
            <form onsubmit="handleLogin(event)" class="space-y-4 w-full max-w-md">
                <div>
                    <label class="block text-gray-700 text-sm font-medium mb-2">Email</label>
                    <input type="email" id="login-email" required
                           class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                           placeholder="Enter your email">
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-medium mb-2">Password</label>
                    <input type="password" id="login-password" required
                           class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                           placeholder="Enter your password">
                </div>
                <button type="submit" class="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600">
                    Login
                </button>
            </form>
            <p class="text-gray-500 text-center mt-4">
                Don't have an account? <button onclick="navigate('signup')" class="text-green-500">Signup</button>
            </p>
        </div>
    `;
}

function renderSignup() {
    return `
        <div class="flex flex-col items-center justify-center p-8">
            <h2 class="text-2xl font-bold mb-4">Signup</h2>
            <form onsubmit="handleSignup(event)" class="space-y-4 w-full max-w-md">
                <div>
                    <label class="block text-gray-700 text-sm font-medium mb-2">Name</label>
                    <input type="text" id="signup-name" required
                           class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                           placeholder="Enter your name">
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-medium mb-2">Email</label>
                    <input type="email" id="signup-email" required
                           class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                           placeholder="Enter your email">
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-medium mb-2">Phone Number</label>
                    <input type="tel" id="signup-phone" required
                           class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                           placeholder="Enter your phone number">
                </div>
                <div>
                    <label class="block text-gray-700 text-sm font-medium mb-2">Password</label>
                    <input type="password" id="signup-password" required
                           class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
                           placeholder="Enter your password">
                </div>
                <button type="submit" class="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600">
                    Signup
                </button>
            </form>
            <p class="text-gray-500 text-center mt-4">
                Already have an account? <button onclick="navigate('login')" class="text-green-500">Login</button>
            </p>
        </div>
    `;
}

// Utility Functions
function toggleWishlist(productId) {
    const index = wishlist.indexOf(productId);
    if (index === -1) {
        wishlist.push(productId);
        showToast('Added to wishlist');
    } else {
        wishlist.splice(index, 1);
        showToast('Removed from wishlist');
    }
    renderApp();
}

function selectColor(color) {
    selectedColor = color;
    renderApp();
}

function selectSize(size) {
    selectedSize = size;
    renderProductDetail();
}

function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
        content.classList.remove('block');
    });
    
    // Reset all tab buttons
    document.querySelectorAll('[id^="tab-"]').forEach(tab => {
        tab.classList.remove('border-green-500', 'text-green-500');
        tab.classList.add('border-transparent', 'text-gray-500');
    });
    
    // Show selected tab content
    const selectedContent = document.getElementById(`content-${tabName}`);
    if (selectedContent) {
        selectedContent.classList.remove('hidden');
        selectedContent.classList.add('block');
    }
    
    // Highlight selected tab button
    const selectedTab = document.getElementById(`tab-${tabName}`);
    if (selectedTab) {
        selectedTab.classList.remove('border-transparent', 'text-gray-500');
        selectedTab.classList.add('border-green-500', 'text-green-500');
    }
}

function shareProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (navigator.share) {
        navigator.share({
            title: product.name,
            text: product.description,
            url: window.location.href
        });
    } else {
        showToast('Share feature not supported');
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className =
        'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function viewProduct(productId) {
    // Find the product with the matching ID
    const product = products.find(p => p.id === productId);
    if (product) {
        // Navigate to the product details page
        navigate('product', product);
        showToast("Viewing product details");
    }
}

function buyNow(productId) {
    addToCart(productId);
    navigate('delivery');
}

// Cart Functions
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            quantity: 1,
            color: selectedColor,
            size: selectedSize
        });
    }

    saveCart();
    showToast('Added to cart');
    renderApp();
}

function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        cart = cart.filter(item => item.id !== productId);
    } else {
        const item = cart.find(item => item.id === productId);
        if (item) {
            item.quantity = newQuantity;
        }
    }
    saveCart();
    renderApp();
}

function resetCart() {
    cart = [];
    renderApp();
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// Initialize cart from localStorage
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    renderApp();

    // Enable pull-to-refresh
    let touchStart = 0;
    let touchEnd = 0;

    app.addEventListener(
        'touchstart',
        e => {
            touchStart = e.touches[0].clientY;
        },
        { passive: true }
    );

    app.addEventListener(
        'touchmove',
        e => {
            touchEnd = e.touches[0].clientY;

            if (
                app.scrollTop === 0 &&
                touchEnd > touchStart &&
                touchEnd - touchStart > 100
            ) {
                showToast('Refreshing...');
                setTimeout(() => renderApp(), 1000);
            }
        },
        { passive: true }
    );
});

function renderUserStats(userOrders, userWishlist) {
    const pendingOrders = userOrders.filter(o => o.status === 'pending');
    return `
        <div class="grid grid-cols-3 gap-4 mb-6">
            <div onclick="viewAllOrders('all')" 
                class="text-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div class="text-3xl font-bold text-green-600 mb-1">${userOrders.length}</div>
                <div class="text-sm text-gray-600">Total Orders</div>
            </div>
            <div onclick="viewAllOrders('pending')"
                class="text-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div class="text-3xl font-bold text-yellow-600 mb-1">${pendingOrders.length}</div>
                <div class="text-sm text-gray-600">Pending Orders</div>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
                <div class="text-3xl font-bold text-blue-600 mb-1">${userWishlist.length}</div>
                <div class="text-sm text-gray-600">Wishlist Items</div>
            </div>
        </div>
    `;
}

// Function to view detailed information about a specific order
function viewOrderDetails(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(order => order.orderId === orderId);
    
    if (!order) {
        showToast('Order not found');
        return;
    }
    
    app.innerHTML = `
        <div class="min-h-screen bg-gray-50 pb-20">
            <div class="bg-white sticky top-0 z-10 shadow-sm">
                <div class="flex items-center p-4">
                    <button onclick="navigate('profile')" class="mr-4">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h1 class="text-xl font-bold flex-1">
                        Order Details
                    </h1>
                </div>
            </div>
            
            <div class="p-4">
                <!-- Order Header -->
                <div class="bg-white rounded-lg shadow-md p-4 mb-4">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="font-medium text-lg">#${order.orderId}</h3>
                            <p class="text-sm text-gray-500">${new Date(order.orderDate).toLocaleDateString()}</p>
                        </div>
                        <span class="px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(order.status)}">
                            ${order.status.toUpperCase()}
                        </span>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <!-- Shipping Info -->
                        <div>
                            <h4 class="font-medium mb-2">Shipping Information</h4>
                            <div class="bg-gray-50 p-3 rounded-lg text-sm">
                                <p><span class="font-medium">Name:</span> ${order.shipping.fullName}</p>
                                <p><span class="font-medium">Phone:</span> ${order.shipping.phone}</p>
                                <p><span class="font-medium">Email:</span> ${order.shipping.email}</p>
                                <p><span class="font-medium">Address:</span> ${order.shipping.address}</p>
                                <p><span class="font-medium">City:</span> ${order.shipping.city}, ${order.shipping.state} ${order.shipping.postalCode}</p>
                                <p><span class="font-medium">Delivery:</span> ${order.shipping.deliveryOption === 'express' ? 'Express Delivery' : 'Standard Delivery'}</p>
                            </div>
                        </div>
                        
                        <!-- Payment Info -->
                        <div>
                            <h4 class="font-medium mb-2">Payment Information</h4>
                            <div class="bg-gray-50 p-3 rounded-lg text-sm">
                                <p><span class="font-medium">Method:</span> 
                                    <span class="${order.payment.method === 'wallet' ? 'text-green-600' : 'text-blue-600'}">
                                        ${order.payment.method === 'wallet' ? 'Wallet Payment' : 'Cash on Delivery'}
                                    </span>
                                </p>
                                <p><span class="font-medium">Subtotal:</span> PKR ${order.payment.subtotal.toFixed(2)}</p>
                                <p><span class="font-medium">Shipping:</span> PKR ${order.payment.shipping.toFixed(2)}</p>
                                <p><span class="font-medium">Total:</span> PKR ${order.payment.total.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Order Items -->
                <div class="bg-white rounded-lg shadow-md p-4">
                    <h4 class="font-medium mb-4">Order Items</h4>
                    <div class="space-y-4">
                        ${order.items.map(item => {
                            // Get the complete product details, either from the enhanced order item or from products
                            const productDetails = item.product_details || {};
                            return `
                                <div class="flex border-b border-gray-100 pb-4">
                                    <div class="w-20 h-20 flex-shrink-0">
                                        <img src="${item.image || productDetails.image || '../img/placeholder.jpg'}" alt="${item.name || productDetails.name || 'Product'}" 
                                            class="w-full h-full object-cover rounded-md">
                                    </div>
                                    <div class="ml-4 flex-1">
                                        <div class="flex justify-between">
                                            <h5 class="font-medium">${item.name || productDetails.name || 'Product'}</h5>
                                            <p class="font-bold">PKR ${(item.subtotal || (item.price * item.quantity)).toFixed(2)}</p>
                                        </div>
                                        <p class="text-sm text-gray-500">${item.description || productDetails.description || ''}</p>
                                        <div class="flex items-center text-sm text-gray-500 mt-1">
                                            <p>Qty: ${item.quantity}</p>
                                            ${item.color ? `<p class="ml-3">Color: ${item.color}</p>` : ''}
                                            ${item.size ? `<p class="ml-3">Size: ${item.size}</p>` : ''}
                                        </div>
                                        <div class="mt-2">
                                            <button onclick="navigate('product', ${JSON.stringify({id: item.id})})" class="text-green-600 text-sm font-medium">
                                                View Product <i class="fas fa-external-link-alt ml-1"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <!-- Order Actions -->
                <div class="bg-white rounded-lg shadow-md p-4 mt-4">
                    <h4 class="font-medium mb-3">Order Actions</h4>
                    <div class="flex space-x-3">
                        <button onclick="navigate('support', {orderId: '${order.orderId}'})" class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">
                            <i class="fas fa-headset mr-1"></i> Get Support
                        </button>
                        ${order.status === 'delivered' ? `
                            <button onclick="rateOrder('${order.orderId}')" class="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium">
                                <i class="fas fa-star mr-1"></i> Rate Order
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function viewAllOrders(filter = 'all') {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const userOrders = orders.filter(order => order.userId === authState.currentUser.id);
    const filteredOrders = filter === 'all' ? userOrders : userOrders.filter(order => order.status === filter);

    app.innerHTML = `
        <div class="min-h-screen bg-gray-50 pb-20">
            <div class="bg-white sticky top-0 z-10 shadow-sm">
                <div class="flex items-center p-4">
                    <button onclick="navigate('profile')" class="mr-4">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h1 class="text-xl font-bold flex-1">
                        ${filter === 'all' ? 'All Orders' : 'Pending Orders'}
                    </h1>
                </div>
                
                <!-- Order Status Filter -->
                <div class="flex gap-2 p-4 overflow-x-auto">
                    <button onclick="viewAllOrders('all')" 
                        class="px-4 py-2 rounded-full text-sm ${filter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}">
                        All Orders
                    </button>
                    <button onclick="viewAllOrders('pending')"
                        class="px-4 py-2 rounded-full text-sm ${filter === 'pending' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}">
                        Pending
                    </button>
                    <button onclick="viewAllOrders('processing')"
                        class="px-4 py-2 rounded-full text-sm ${filter === 'processing' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}">
                        Processing
                    </button>
                    <button onclick="viewAllOrders('shipped')"
                        class="px-4 py-2 rounded-full text-sm ${filter === 'shipped' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}">
                        Shipped
                    </button>
                    <button onclick="viewAllOrders('delivered')"
                        class="px-4 py-2 rounded-full text-sm ${filter === 'delivered' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}">
                        Delivered
                    </button>
                </div>
            </div>

            <div class="p-4 space-y-4">
                ${filteredOrders.length > 0 ? filteredOrders.map(order => `
                    <div class="bg-white rounded-lg shadow-md p-4">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h3 class="font-medium text-lg">#${order.orderId}</h3>
                                <p class="text-sm text-gray-500">${new Date(order.orderDate).toLocaleDateString()}</p>
                            </div>
                            <span class="px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(order.status)}">
                                ${order.status.toUpperCase()}
                            </span>
                        </div>
                        
                        <div class="border-t border-b border-gray-100 py-4 my-4">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-gray-600">Items</span>
                                <span class="font-medium">${order.items.length}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-gray-600">Total Amount</span>
                                <span class="font-medium">$${order.payment.total.toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <!-- Order Items Preview -->
                        <div class="flex gap-2 mb-4 overflow-x-auto">
                            ${order.items.map(item => `
                                <div class="flex-shrink-0 w-16 h-16">
                                    <img src="${item.image}" alt="${item.name}" 
                                        class="w-full h-full object-cover rounded-md">
                                </div>
                            `).join('')}
                        </div>

                        <div class="flex justify-between items-center">
                            <button onclick="viewOrderDetails('${order.orderId}')" 
                                class="text-green-600 hover:text-green-700 font-medium text-sm">
                                View Details <i class="fas fa-chevron-right ml-1"></i>
                            </button>
                            ${order.status === 'delivered' ? `
                                <button onclick="rateOrder('${order.orderId}')"
                                    class="text-yellow-600 hover:text-yellow-700 font-medium text-sm">
                                    <i class="fas fa-star mr-1"></i> Rate Order
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `).join('') : `
                    <div class="text-center py-8">
                        <i class="fas fa-box-open text-gray-400 text-5xl mb-4"></i>
                        <p class="text-gray-500 mb-4">No ${filter} orders found</p>
                        <button onclick="navigate('home')" 
                            class="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-colors">
                            Continue Shopping
                        </button>
                    </div>
                `}
            </div>

            ${renderBottomNav()}
        </div>
    `;
}

// Connect to the wallet.js redemption functionality
if (typeof window.directRedemption !== 'function') {
    // Fallback implementation if wallet.js hasn't loaded yet
    window.directRedemption = function(rewardId) {
        console.log('Redirecting to wallet page for redemption, reward ID:', rewardId);
        alert('Please wait while we prepare your redemption request...');
        // Navigate to wallet page where the full redemption functionality exists
        navigate('wallet');
        // Store the reward ID to potentially use it later
        localStorage.setItem('pendingRedemptionId', rewardId);
    };
}

function getStatusStyle(status) {
    switch (status.toLowerCase()) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'processing':
            return 'bg-blue-100 text-blue-800';
        case 'shipped':
            return 'bg-purple-100 text-purple-800';
        case 'delivered':
            return 'bg-green-100 text-green-800';
        case 'cancelled':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

function renderUserInfo(userOrders, userWishlist) {
    return `
        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
            <!-- Cover Photo -->
            <div class="h-32 bg-gradient-to-r from-green-400 to-blue-500"></div>
            
            <!-- Profile Info -->
            <div class="relative px-6 pb-6">
                <div class="flex flex-col items-center -mt-16">
                    <img src="${authState.currentUser.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(authState.currentUser.name)}" 
                        alt="Profile" 
                        class="w-32 h-32 rounded-full border-4 border-white shadow-lg mb-4">
                    <h2 class="text-2xl font-bold">${authState.currentUser.name}</h2>
                    <p class="text-gray-600 mb-4">${authState.currentUser.email}</p>
                </div>

                <!-- Stats Cards -->
                ${renderUserStats(userOrders, userWishlist)}

                <!-- Profile Form -->
                <form id="profile-form" onsubmit="updateProfile(event)" class="space-y-4 mt-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="form-group">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input type="text" id="profile-name" value="${authState.currentUser.name}" required
                                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        </div>
                        <div class="form-group">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" id="profile-email" value="${authState.currentUser.email}" required
                                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="form-group">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input type="tel" id="profile-phone" value="${authState.currentUser.phone || ''}"
                                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        </div>
                        <div class="form-group">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                            <input type="date" id="profile-dob" value="${authState.currentUser.dob || ''}"
                                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        </div>
                    </div>
                    <button type="submit" 
                        class="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center justify-center">
                        <i class="fas fa-save mr-2"></i>
                        Update Profile
                    </button>
                </form>
            </div>
        </div>
    `;
}