const authState = {
    isAuthenticated: false,
    currentUser: null
};

function saveAuthState() {
    // Save to localStorage for persistent login across browser sessions
    localStorage.setItem('authState', JSON.stringify(authState));
    
    // Also update currentUser in localStorage for backward compatibility
    if (authState.isAuthenticated && authState.currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(authState.currentUser));
    } else {
        localStorage.removeItem('currentUser');
    }
}

function loadAuthState() {
    // Load auth state from localStorage for persistent login
    const savedState = localStorage.getItem('authState');
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        Object.assign(authState, parsedState);
        
        // If user was previously logged in, ensure we have the current user data
        if (authState.isAuthenticated && authState.currentUser) {
            // Refresh current user data from the users list to ensure it's up to date
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const currentUser = users.find(u => u.id === authState.currentUser.id);
            
            if (currentUser) {
                // Update the current user with any changes from the users list
                authState.currentUser = currentUser;
            } else {
                // User no longer exists in the users list, log them out
                authState.isAuthenticated = false;
                authState.currentUser = null;
            }
            
            // Save the updated auth state
            saveAuthState();
        }
    }
}

function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Find user
    const user = users.find(u => u.email === email && u.password === btoa(password));
    
    if (user) {
        // Update auth state
        authState.isAuthenticated = true;
        authState.currentUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            avatar: user.avatar || 'https://via.placeholder.com/50',
            addresses: user.addresses || []
        };
        saveAuthState();
        
        // Add login notification for admin
        const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
        notifications.unshift({
            message: `User logged in: ${user.name}`,
            icon: 'fa-sign-in-alt',
            timestamp: new Date().toISOString(),
            type: 'auth'
        });
        localStorage.setItem('notifications', JSON.stringify(notifications));
        
        showToast('Login successful!');
        navigate('profile');
    } else {
        showToast('Invalid email or password');
    }
}

function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const phone = document.getElementById('signup-phone').value.trim();
    const password = document.getElementById('signup-password').value;
    
    // CRITICAL: Validate and ensure phone number is properly collected
    if (!phone || phone.trim() === '') {
        console.warn('No phone number provided during signup');
    }
    
    // Debug phone number
    console.log('Collected phone number during signup:', phone);
    
    // Get existing users
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Check if email already exists
    if (users.some(u => u.email === email)) {
        showToast('Email already registered');
        return;
    }
    
    // Generate unique ID for the new user
    const userId = `user_${Date.now()}`;
    
    // Create new user with explicit phone fields for admin visibility
    const phoneValue = phone || '';
    
    const newUser = {
        id: userId,
        name,
        email,
        // Store phone number in multiple fields to ensure compatibility with all display methods
        phone: phoneValue,
        phoneNumber: phoneValue,
        mobile: phoneValue,
        contact: phoneValue,
        // Add phone_admin field specifically for admin panel visibility
        phone_admin: phoneValue,
        password: btoa(password), // Basic encoding, not secure for production
        createdAt: new Date().toISOString(),
        addresses: [],
        // Generate a random avatar using various avatar services
        avatar: getRandomAvatar(name)
    };
    
    // Log the user object to verify phone number is saved
    console.log('New user with phone:', newUser);
    
    // Save user
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Initialize wallet with 0 PKR balance
    const walletData = {
        balance: 0,
        transactions: [],
        rewards: []
    };
    
    // Save wallet data for this user
    localStorage.setItem(`wallet_${userId}`, JSON.stringify(walletData));
    
    // Add notification for admin
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    notifications.unshift({
        message: `New user registered: ${name}`,
        icon: 'fa-user-plus',
        timestamp: new Date().toISOString(),
        type: 'auth'
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    // Auto login after signup - use the complete user object
    authState.isAuthenticated = true;
    authState.currentUser = newUser; // Use the complete user object instead of a subset
    saveAuthState();
    
    showToast('Account created successfully!');
    
    // Check if we need to redirect back to checkout
    const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');
    if (redirectAfterLogin) {
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectAfterLogin);
    } else {
        navigate('profile');
    }
}

function logout() {
    const userName = authState.currentUser?.name;
    
    // Clear auth state
    authState.isAuthenticated = false;
    authState.currentUser = null;
    saveAuthState();
    
    // Add logout notification for admin
    if (userName) {
        const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
        notifications.unshift({
            message: `User logged out: ${userName}`,
            icon: 'fa-sign-out-alt',
            timestamp: new Date().toISOString(),
            type: 'auth'
        });
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }
    
    showToast('Logged out successfully');
    navigate('home');
}

// Address Management
function addNewAddress() {
    if (!authState.isAuthenticated) {
        showToast('Please login to add an address');
        navigate('login');
        return;
    }
    
    // Show address form modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 class="text-lg font-semibold mb-4">Add New Address</h3>
            <form id="address-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Address Type</label>
                    <input type="text" id="address-type" required placeholder="Home, Work, etc."
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Street Address</label>
                    <input type="text" id="address-street" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">City</label>
                        <input type="text" id="address-city" required
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">State</label>
                        <input type="text" id="address-state" required
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Postal Code</label>
                    <input type="text" id="address-postal" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                </div>
                <div class="flex justify-end space-x-4 mt-6">
                    <button type="button" onclick="this.closest('.fixed').remove()"
                        class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500">
                        Cancel
                    </button>
                    <button type="submit"
                        class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                        Save Address
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    document.getElementById('address-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newAddress = {
            type: document.getElementById('address-type').value,
            street: document.getElementById('address-street').value,
            city: document.getElementById('address-city').value,
            state: document.getElementById('address-state').value,
            postalCode: document.getElementById('address-postal').value
        };
        
        // Update user's addresses
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(u => u.id === authState.currentUser.id);
        
        if (userIndex !== -1) {
            users[userIndex].addresses = users[userIndex].addresses || [];
            users[userIndex].addresses.push(newAddress);
            localStorage.setItem('users', JSON.stringify(users));
            
            // Update auth state
            authState.currentUser.addresses = users[userIndex].addresses;
            saveAuthState();
            
            showToast('Address added successfully');
            modal.remove();
            renderProfile();
        }
    });
}

function editAddress(index) {
    const address = authState.currentUser.addresses[index];
    if (!address) return;
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 class="text-lg font-semibold mb-4">Edit Address</h3>
            <form id="edit-address-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Address Type</label>
                    <input type="text" id="edit-address-type" required value="${address.type}"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Street Address</label>
                    <input type="text" id="edit-address-street" required value="${address.street}"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">City</label>
                        <input type="text" id="edit-address-city" required value="${address.city}"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">State</label>
                        <input type="text" id="edit-address-state" required value="${address.state}"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Postal Code</label>
                    <input type="text" id="edit-address-postal" required value="${address.postalCode}"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500">
                </div>
                <div class="flex justify-end space-x-4 mt-6">
                    <button type="button" onclick="this.closest('.fixed').remove()"
                        class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500">
                        Cancel
                    </button>
                    <button type="submit"
                        class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    document.getElementById('edit-address-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const updatedAddress = {
            type: document.getElementById('edit-address-type').value,
            street: document.getElementById('edit-address-street').value,
            city: document.getElementById('edit-address-city').value,
            state: document.getElementById('edit-address-state').value,
            postalCode: document.getElementById('edit-address-postal').value
        };
        
        // Update user's addresses
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(u => u.id === authState.currentUser.id);
        
        if (userIndex !== -1) {
            users[userIndex].addresses[index] = updatedAddress;
            localStorage.setItem('users', JSON.stringify(users));
            
            // Update auth state
            authState.currentUser.addresses = users[userIndex].addresses;
            saveAuthState();
            
            showToast('Address updated successfully');
            modal.remove();
            renderProfile();
        }
    });
}

function deleteAddress(index) {
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === authState.currentUser.id);
    
    if (userIndex !== -1) {
        users[userIndex].addresses.splice(index, 1);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Update auth state
        authState.currentUser.addresses = users[userIndex].addresses;
        saveAuthState();
        
        showToast('Address deleted successfully');
        renderProfile();
    }
}

/**
 * Generates a random avatar URL for a user based on their name
 * Uses a mix of services to provide varied, visually appealing profile images
 * @param {string} name - The user's name to personalize the avatar
 * @returns {string} - URL to the generated avatar
 */
function getRandomAvatar(name) {
    // Encode the name to be URL-safe
    const encodedName = encodeURIComponent(name);
    
    // Define a list of avatar generation services and styles
    const avatarServices = [
        // UI Avatars - Simple text-based avatars with user's initials
        `https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff&bold=true&size=200`,
        
        // Gravatar-style identicons (geometric pattern based on hash)
        `https://www.gravatar.com/avatar/${Math.random().toString(36).substring(2)}?s=200&d=identicon&r=g`,
        
        // Random avatar with different styles
        `https://avatars.dicebear.com/api/micah/${encodedName}.svg?background=%23${Math.floor(Math.random()*16777215).toString(16)}`,
        `https://avatars.dicebear.com/api/bottts/${encodedName}.svg?background=%23${Math.floor(Math.random()*16777215).toString(16)}`,
        `https://avatars.dicebear.com/api/adventurer/${encodedName}.svg`,
        `https://avatars.dicebear.com/api/adventurer-neutral/${encodedName}.svg?background=%23${Math.floor(Math.random()*16777215).toString(16)}`,
        `https://avatars.dicebear.com/api/avataaars/${encodedName}.svg?background=%23${Math.floor(Math.random()*16777215).toString(16)}`,
        `https://avatars.dicebear.com/api/jdenticon/${encodedName}.svg?background=%23${Math.floor(Math.random()*16777215).toString(16)}`
    ];
    
    // Randomly select one of the avatar services
    const randomIndex = Math.floor(Math.random() * avatarServices.length);
    return avatarServices[randomIndex];
}

// Initialize auth state on page load
document.addEventListener('DOMContentLoaded', loadAuthState);

// Render auth screens
function renderLogin() {
    return `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-logo">
                    <i class="fas fa-shopping-bag text-4xl text-green-500"></i>
                </div>
                <div class="auth-header">
                    <h2>Welcome Back!</h2>
                    <p>Sign in to continue shopping</p>
                </div>
                <form class="auth-form" onsubmit="handleLogin(event)">
                    <div class="form-group">
                        <div class="input-icon-wrapper">
                            <i class="fas fa-envelope text-gray-400"></i>
                            <input type="email" id="login-email" placeholder=" " required>
                            <label for="login-email">Email</label>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="input-icon-wrapper">
                            <i class="fas fa-lock text-gray-400"></i>
                            <input type="password" id="login-password" placeholder=" " required>
                            <label for="login-password">Password</label>
                            <button type="button" class="password-toggle" onclick="togglePassword('login-password')">
                                <i class="fas fa-eye text-gray-400"></i>
                            </button>
                        </div>
                    </div>
                    <div class="flex items-center justify-between mb-4">
                        <label class="flex items-center">
                            <input type="checkbox" class="form-checkbox">
                            <span class="ml-2 text-sm text-gray-600">Remember me</span>
                        </label>
                        <a href="#" class="text-sm text-green-600 hover:text-green-700">Forgot Password?</a>
                    </div>
                    ${authState.error ? `<div class="error-message">${authState.error}</div>` : ''}
                    <button type="submit" class="auth-button ripple">
                        <span>Sign In</span>
                        <i class="fas fa-arrow-right ml-2"></i>
                    </button>
                </form>
                <div class="auth-divider">or continue with</div>
                <div class="social-auth">
                    <button class="social-button google" onclick="socialLogin('google')">
                        <i class="fab fa-google"></i>
                        <span>Google</span>
                    </button>
                    <button class="social-button facebook" onclick="socialLogin('facebook')">
                        <i class="fab fa-facebook"></i>
                        <span>Facebook</span>
                    </button>
                </div>
                <div class="auth-footer">
                    <p>Don't have an account? 
                        <a href="#" onclick="navigate('signup')" class="text-green-600 hover:text-green-700 font-semibold">
                            Create Account
                        </a>
                    </p>
                </div>
            </div>
        </div>
    `;
}

function renderSignup() {
    return `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-logo">
                    <i class="fas fa-shopping-bag text-4xl text-green-500"></i>
                </div>
                <div class="auth-header">
                    <h2>Create Account</h2>
                    <p>Join us for a better shopping experience</p>
                </div>
                <form class="auth-form" onsubmit="handleSignup(event)">
                    <div class="form-group">
                        <div class="input-icon-wrapper">
                            <i class="fas fa-user text-gray-400"></i>
                            <input type="text" id="signup-name" placeholder=" " required>
                            <label for="signup-name">Full Name</label>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="input-icon-wrapper">
                            <i class="fas fa-envelope text-gray-400"></i>
                            <input type="email" id="signup-email" placeholder=" " required>
                            <label for="signup-email">Email</label>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="input-icon-wrapper">
                            <i class="fas fa-phone text-gray-400"></i>
                            <input type="tel" id="signup-phone" placeholder=" " required>
                            <label for="signup-phone">Phone Number</label>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="input-icon-wrapper">
                            <i class="fas fa-lock text-gray-400"></i>
                            <input type="password" id="signup-password" placeholder=" " required>
                            <label for="signup-password">Password</label>
                            <button type="button" class="password-toggle" onclick="togglePassword('signup-password')">
                                <i class="fas fa-eye text-gray-400"></i>
                            </button>
                        </div>
                    </div>
                    <div class="flex items-center mb-4">
                        <input type="checkbox" id="terms" class="form-checkbox" required>
                        <label for="terms" class="ml-2 text-sm text-gray-600">
                            I agree to the <a href="#" class="text-green-600 hover:text-green-700">Terms</a> and 
                            <a href="#" class="text-green-600 hover:text-green-700">Privacy Policy</a>
                        </label>
                    </div>
                    ${authState.error ? `<div class="error-message">${authState.error}</div>` : ''}
                    <button type="submit" class="auth-button ripple">
                        <span>Create Account</span>
                        <i class="fas fa-arrow-right ml-2"></i>
                    </button>
                </form>
                <div class="auth-divider">or sign up with</div>
                <div class="social-auth">
                    <button class="social-button google" onclick="socialLogin('google')">
                        <i class="fab fa-google"></i>
                        <span>Google</span>
                    </button>
                    <button class="social-button facebook" onclick="socialLogin('facebook')">
                        <i class="fab fa-facebook"></i>
                        <span>Facebook</span>
                    </button>
                </div>
                <div class="auth-footer">
                    <p>Already have an account? 
                        <a href="#" onclick="navigate('login')" class="text-green-600 hover:text-green-700 font-semibold">
                            Sign In
                        </a>
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.parentElement.querySelector('.password-toggle i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Auth handlers
async function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    // Check if email already exists
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.some(user => user.email === email)) {
        showToast('Email already exists');
        return;
    }
    
    // Create new user object
    const newUser = {
        id: `user_${Date.now()}`,
        name,
        email,
        password: btoa(password), // Basic encoding (not for production)
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        createdAt: new Date().toISOString(),
        status: 'active',
        addresses: [],
        orders: [],
        wishlist: []
    };
    
    // Save to users list
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Auto login after signup
    authState.isAuthenticated = true;
    authState.currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    // Add notification for admin
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    notifications.unshift({
        message: `New user registered: ${name}`,
        icon: 'fa-user-plus',
        timestamp: new Date().toISOString(),
        type: 'user'
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    showToast('Signup successful!');
    navigate('profile');
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Get all users and print to console for debugging
    const users = JSON.parse(localStorage.getItem('users')) || [];
    console.log('Attempting login with:', { email });
    console.log('Available users:', users.map(u => ({ email: u.email })));
    
    // Ensure case-insensitive email matching
    const user = users.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.password === btoa(password)
    );
    
    if (!user) {
        console.error('Login failed: Invalid credentials');
        showToast('Invalid email or password');
        return;
    }
    
    if (user.status === 'suspended') {
        showToast('Your account has been suspended. Please contact support.');
        return;
    }
    
    // Update last login
    user.lastLogin = new Date().toISOString();
    localStorage.setItem('users', JSON.stringify(users));
    
    // Set auth state
    authState.isAuthenticated = true;
    authState.currentUser = user;
    // Save auth state using our unified function
    saveAuthState();
    
    // Add notification for admin
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    notifications.unshift({
        message: `User logged in: ${user.name}`,
        icon: 'fa-sign-in-alt',
        timestamp: new Date().toISOString(),
        type: 'user'
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    showToast('Login successful!');
    
    // Check if we need to redirect back to checkout
    const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');
    if (redirectAfterLogin) {
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectAfterLogin);
    } else {
        navigate('profile');
    }
}

function updateProfile(event) {
    event.preventDefault();
    
    const name = document.getElementById('profile-name').value;
    const email = document.getElementById('profile-email').value;
    const phone = document.getElementById('profile-phone').value;
    const address = document.getElementById('profile-address').value;
    
    // Update users list
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === authState.currentUser.id);
    
    if (userIndex === -1) {
        showToast('Error updating profile');
        return;
    }
    
    // Check if email is taken by another user
    if (email !== authState.currentUser.email && 
        users.some(u => u.email === email && u.id !== authState.currentUser.id)) {
        showToast('Email already taken');
        return;
    }
    
    // Update user data
    const updatedUser = {
        ...users[userIndex],
        name,
        email,
        phone,
        address,
        updatedAt: new Date().toISOString()
    };
    
    users[userIndex] = updatedUser;
    localStorage.setItem('users', JSON.stringify(users));
    
    // Update current user
    authState.currentUser = updatedUser;
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    // Add notification for admin
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    notifications.unshift({
        message: `User profile updated: ${name}`,
        icon: 'fa-user-edit',
        timestamp: new Date().toISOString(),
        type: 'user'
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    showToast('Profile updated successfully!');
    renderProfile();
}

function addNewAddress() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-md w-full">
            <form id="address-form" class="p-6">
                <h3 class="text-lg font-semibold mb-4">Add New Address</h3>
                <div class="space-y-4">
                    <div class="form-group">
                        <label class="block text-sm font-medium text-gray-700">Address Type</label>
                        <select id="address-type" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                            <option value="home">Home</option>
                            <option value="work">Work</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="block text-sm font-medium text-gray-700">Street Address</label>
                        <textarea id="address-street" required rows="2" 
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="form-group">
                            <label class="block text-sm font-medium text-gray-700">City</label>
                            <input type="text" id="address-city" required 
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        </div>
                        <div class="form-group">
                            <label class="block text-sm font-medium text-gray-700">State</label>
                            <input type="text" id="address-state" required 
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="block text-sm font-medium text-gray-700">Postal Code</label>
                        <input type="text" id="address-postal" required 
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    </div>
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                    <button type="button" onclick="this.closest('.fixed').remove()" 
                        class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500">
                        Cancel
                    </button>
                    <button type="submit" 
                        class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                        Save Address
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('address-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newAddress = {
            type: document.getElementById('address-type').value,
            street: document.getElementById('address-street').value,
            city: document.getElementById('address-city').value,
            state: document.getElementById('address-state').value,
            postalCode: document.getElementById('address-postal').value
        };
        
        // Update user's addresses
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(u => u.id === authState.currentUser.id);
        
        if (!users[userIndex].addresses) {
            users[userIndex].addresses = [];
        }
        
        users[userIndex].addresses.push(newAddress);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Update current user
        authState.currentUser = users[userIndex];
        localStorage.setItem('currentUser', JSON.stringify(users[userIndex]));
        
        modal.remove();
        showToast('Address added successfully!');
        renderProfile();
    });
}

function logout() {
    authState.isAuthenticated = false;
    authState.currentUser = null;
    localStorage.removeItem('currentUser');
    showToast('Logged out successfully');
    navigate('home');
}