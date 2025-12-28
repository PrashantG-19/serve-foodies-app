// State
const state = {
    currentView: 'vendors', // vendors, menu, checkout, vendor_wait, payment, success
    selectedVendor: null,
    cart: [],
    orderCode: null,
    vendorCode: null,
    deliveryTime: null,
    orderStatus: 'pending' // pending, preparing, ready
};

// Data
const VENDORS = [
    {
        id: 1,
        name: 'Fast Food Hub',
        desc: 'Burgers, Fries & Shakes',
        image: 'vendor_fast_food.png',
        menu: [
            { id: 101, name: 'Classic Burger', price: 199, image: 'vendor_fast_food.png' },
            { id: 102, name: 'Cheesy Fries', price: 99, image: 'vendor_fast_food.png' },
            { id: 103, name: 'Chicken Nuggets', price: 149, image: 'vendor_fast_food.png' },
            { id: 104, name: 'Cola', price: 49, image: 'vendor_fast_food.png' }
        ]
    },
    {
        id: 2,
        name: 'Spicy Kitchen',
        desc: 'Authentic Curries & Spice',
        image: 'vendor_spicy_kitchen.png',
        menu: [
            { id: 201, name: 'Red Curry', price: 299, image: 'vendor_spicy_kitchen.png' },
            { id: 202, name: 'Spicy Noodles', price: 249, image: 'vendor_spicy_kitchen.png' },
            { id: 203, name: 'Tom Yum Soup', price: 199, image: 'vendor_spicy_kitchen.png' },
            { id: 204, name: 'Thai Iced Tea', price: 129, image: 'vendor_spicy_kitchen.png' }
        ]
    },
    {
        id: 3,
        name: 'Yummy Bites',
        desc: 'Desserts & Sweet Treats',
        image: 'vendor_yummy_bites.png',
        menu: [
            { id: 301, name: 'Lava Cake', price: 189, image: 'vendor_yummy_bites.png' },
            { id: 302, name: 'Fruit Tart', price: 149, image: 'vendor_yummy_bites.png' },
            { id: 303, name: 'Cheesecake', price: 179, image: 'vendor_yummy_bites.png' },
            { id: 304, name: 'Cappuccino', price: 119, image: 'vendor_yummy_bites.png' }
        ]
    }
];

// DOM Elements
const app = document.getElementById('app');

// Utils
const formatPrice = (price) => `₹${price}`;
const generateCode = () => Math.floor(1000 + Math.random() * 9000);
const showNotification = (title, msg) => {
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.className = 'notification-toast';
    notif.innerHTML = `
        <div class="notification-icon">🔔</div>
        <div class="notification-content">
            <h4>${title}</h4>
            <p>${msg}</p>
        </div>
    `;
    document.body.appendChild(notif);

    // Trigger animation
    setTimeout(() => notif.classList.add('show'), 10);

    // Auto hide
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 500);
    }, 5000);
};

// Render Functions
function render() {
    app.innerHTML = '';

    // Header
    const header = document.createElement('header');
    const showBack = state.currentView !== 'vendors';

    header.innerHTML = `
        <div style="flex: 1; display: flex; align-items: center;">
            ${showBack ? `<button class="btn btn-icon" style="color:white; font-size:1.5rem; padding:0;" id="backBtn">←</button>` : ''}
        </div>
        <h1 style="margin: 0;">Serve Smart</h1>
        <div style="flex: 1;"></div>
    `;
    app.appendChild(header);

    // Main Content
    const main = document.createElement('main');

    switch (state.currentView) {
        case 'vendors':
            main.appendChild(renderVendorList());
            break;
        case 'menu':
            main.appendChild(renderMenu());
            break;
        case 'checkout':
            main.appendChild(renderCheckout());
            break;
        case 'vendor_wait':
            main.appendChild(renderVendorWait());
            break;
        case 'payment':
            main.appendChild(renderPayment());
            break;
        case 'success':
            main.appendChild(renderSuccess());
            break;
    }

    app.appendChild(main);

    // Event Listeners
    if (document.getElementById('backBtn')) {
        document.getElementById('backBtn').addEventListener('click', () => {
            if (state.currentView === 'menu') setState({ currentView: 'vendors', selectedVendor: null, cart: [] });
            else if (state.currentView === 'checkout') setState({ currentView: 'menu' });
            else if (state.currentView === 'payment') setState({ currentView: 'checkout' }); // Warning: losing vendor code
        });
    }
}

function renderVendorList() {
    const container = document.createElement('div');
    container.style.width = '100%';

    const title = document.createElement('h2');
    title.textContent = 'Select a Vendor';
    title.style.textAlign = 'center';
    title.style.marginTop = '40px';
    title.style.marginBottom = '20px';
    container.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'vendor-grid';
    // Remove padding from grid since we might want it on the container or handle it differently, 
    // but looking at style.css, .vendor-grid has padding: 40px. 
    // We should probably keep the grid style but purely for cards.

    VENDORS.forEach(vendor => {
        const card = document.createElement('div');
        card.className = 'vendor-card';
        card.onclick = () => selectVendor(vendor);
        card.innerHTML = `
            <img src="${vendor.image}" class="vendor-img" alt="${vendor.name}">
            <div class="vendor-info">
                <div class="vendor-name">${vendor.name}</div>
                <div class="vendor-desc">${vendor.desc}</div>
            </div>
        `;
        grid.appendChild(card);
    });

    container.appendChild(grid);
    return container;
}

function renderMenu() {
    const div = document.createElement('div');
    const vendor = state.selectedVendor;

    div.innerHTML = `
        <div style="padding: 20px 20px 0;">
            <h2>${vendor.name} Menu</h2>
        </div>
        <div class="menu-list">
            ${vendor.menu.map(item => {
        const inCart = state.cart.find(i => i.id === item.id);
        return `
                <div class="menu-item">
                    <img src="${item.image}" class="menu-item-img" alt="${item.name}">
                    <div class="menu-item-details">
                        <div>${item.name}</div>
                        <div class="menu-item-price">${formatPrice(item.price)}</div>
                    </div>
                    <button class="add-btn ${inCart ? 'active' : ''}" onclick="toggleCart(${item.id})">
                        ${inCart ? '✓' : '+'}
                    </button>
                </div>
                `;
    }).join('')}
        </div>
    `;

    if (state.cart.length > 0) {
        const total = state.cart.reduce((sum, item) => sum + item.price, 0);
        const cartBar = document.createElement('div');
        cartBar.className = 'cart-bar';
        cartBar.onclick = () => setState({ currentView: 'checkout' });
        cartBar.innerHTML = `
            <div>${state.cart.length} Items</div>
            <div style="font-weight:700">Checkout ${formatPrice(total)}</div>
        `;
        div.appendChild(cartBar);
    }

    return div;
}

function renderCheckout() {
    const div = document.createElement('div');
    div.className = 'page-container';
    const total = state.cart.reduce((sum, item) => sum + item.price, 0);

    div.innerHTML = `
        <h2>Order Summary</h2>
        <div class="order-summary">
            ${state.cart.map(item => `
                <div class="summary-row">
                    <span>${item.name}</span>
                    <span>${formatPrice(item.price)}</span>
                </div>
            `).join('')}
            <div class="summary-total">
                <div class="summary-row">
                    <span>Total</span>
                    <span>${formatPrice(total)}</span>
                </div>
            </div>
        </div>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;">
            Clicking "Send to Vendor" will send your order to <strong>${state.selectedVendor.name}</strong> for approval.
        </p>
        <button class="btn btn-primary" onclick="requestVendorApproval()">Send to Vendor</button>
    `;
    return div;
}

function renderVendorWait() {
    const div = document.createElement('div');
    div.className = 'page-container';

    if (!state.vendorCode) {
        // Waiting state
        div.innerHTML = `
            <div class="status-card">
                <div class="spinner"></div>
                <h3>Waiting for Vendor...</h3>
                <p style="color: var(--text-muted); margin-top: 10px;">
                    ${state.selectedVendor.name} is reviewing your order.
                </p>
            </div>
        `;
        // Simulate approval after 3 seconds
        setTimeout(() => {
            const now = new Date();
            const delivery = new Date(now.getTime() + 20 * 60000); // +20 mins
            const timeString = delivery.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            setState({
                vendorCode: generateCode(),
                deliveryTime: timeString
            });
        }, 3000);
    } else {
        // Approved state
        div.innerHTML = `
            <div class="status-card">
                <div style="font-size: 3rem; margin-bottom: 10px;">✅</div>
                <h3>Order Approved!</h3>
                <p>Estimated Delivery: <strong>${state.deliveryTime}</strong></p>
                <p>Please use this code to complete payment:</p>
                <div class="code-display">${state.vendorCode}</div>
                <button class="btn btn-primary" onclick="setState({ currentView: 'payment' })">Proceed to Payment</button>
            </div>
        `;
    }
    return div;
}

function renderPayment() {
    const div = document.createElement('div');
    div.className = 'page-container';
    const total = state.cart.reduce((sum, item) => sum + item.price, 0);

    div.innerHTML = `
        <h2>Payment</h2>
        <div class="order-summary">
            <div class="summary-row">
                <span>Total Amount</span>
                <span style="color: var(--primary); font-weight: 700;">${formatPrice(total)}</span>
            </div>
        </div>

        <div class="input-group">
            <label>Vendor Approval Code</label>
            <input type="text" class="input-field" value="${state.vendorCode}" readonly style="opacity: 0.7">
        </div>

        <div class="input-group">
            <label>Payment Method</label>
            <select class="input-field">
                <option>Credit/Debit Card</option>
                <option>Employee Wallet</option>
                <option>Cash on Delivery</option>
            </select>
        </div>

        <button class="btn btn-primary" onclick="processPayment()">Pay & Place Order</button>
    `;
    return div;
}

function renderSuccess() {
    const div = document.createElement('div');
    div.className = 'page-container';
    const isReady = state.orderStatus === 'ready';

    div.innerHTML = `
        <div class="status-card">
            <div class="success-icon">${isReady ? '🍽️' : '👨‍🍳'}</div>
            <h2>${isReady ? 'Order Ready!' : 'Preparing...'}</h2>
            <p style="color: var(--text-muted); margin-bottom: 20px;">
                ${isReady ? 'Please collect your order at the counter.' : 'Your food is being prepared.'}
            </p>
            
            <div class="order-summary" style="text-align: left;">
                <div class="summary-row">
                    <span>Order Number</span>
                    <span>#${state.orderCode}</span>
                </div>
                <div class="summary-row">
                    <span>Estimated Delivery</span>
                    <span>${state.deliveryTime}</span>
                </div>
                <div class="summary-row">
                    <span>Vendor</span>
                    <span>${state.selectedVendor.name}</span>
                </div>
                <div class="summary-row">
                    <span>Status</span>
                    <span style="color: ${isReady ? 'var(--success)' : 'var(--secondary)'}; font-weight:700">
                        ${isReady ? 'Ready to Pick Up' : 'Cooking'}
                    </span>
                </div>
            </div>

            <button class="btn btn-secondary" onclick="resetApp()">Order More</button>
        </div>
    `;
    return div;
}

// Actions
function setState(newState) {
    Object.assign(state, newState);
    render();
}

function selectVendor(vendor) {
    setState({ selectedVendor: vendor, currentView: 'menu', cart: [] });
}

window.toggleCart = function (itemId) {
    const item = state.selectedVendor.menu.find(i => i.id === itemId);
    const inCart = state.cart.find(i => i.id === itemId);

    let newCart;
    if (inCart) {
        newCart = state.cart.filter(i => i.id !== itemId);
    } else {
        newCart = [...state.cart, item];
    }

    setState({ cart: newCart });
};

window.requestVendorApproval = function () {
    setState({ currentView: 'vendor_wait', vendorCode: null });
};

window.processPayment = function () {
    // Simulate payment processing
    setState({
        currentView: 'success',
        orderStatus: 'preparing',
        orderCode: 'ORD-' + generateCode()
    });

    // Simulate cooking time (5 seconds for demo)
    setTimeout(() => {
        state.orderStatus = 'ready';
        // Only re-render if we are still on the success screen
        if (state.currentView === 'success') {
            render();
        }
        showNotification('Order Ready!', `Your order #${state.orderCode} is ready for pickup!`);
    }, 5000);
};

window.resetApp = function () {
    setState({
        currentView: 'vendors',
        selectedVendor: null,
        cart: [],
        orderCode: null,
        orderCode: null,
        vendorCode: null,
        deliveryTime: null,
        orderStatus: 'pending'
    });
};

// Initial Render
document.addEventListener('DOMContentLoaded', () => {
    render();
});
