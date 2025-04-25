// Menu data
const menu = [
    { id: 1, name: 'Dal', price: 50, imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg' },
    { id: 2, name: 'Chole', price: 60, imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg' },
    { id: 3, name: 'Rajma', price: 55, imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg' },
    { id: 4, name: 'Kadi', price: 45, imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg' },
    { id: 5, name: 'Rice', price: 30, imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg' },
    { id: 6, name: 'Bread', price: 20, imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg' },
];

// State
let cart = [];
let waNumber = '';

// Get WhatsApp number from URL
function getWaNumberFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('waNumber');
}

// Initialize the page
function init() {
    waNumber = getWaNumberFromUrl();
    renderMenu();
    attachEventListeners();
}

// Render menu items
function renderMenu() {
    const menuContainer = document.getElementById('menu-container');
    menuContainer.innerHTML = '';

    menu.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card bg-white rounded-lg shadow-md overflow-hidden';
        card.dataset.id = item.id;

        card.innerHTML = `
            <img src="${item.imageUrl}" alt="${item.name}" class="w-full h-48 object-cover">
            <div class="p-4">
                <h3 class="font-semibold text-lg">${item.name}</h3>
                <div class="flex justify-between items-center mt-2">
                    <span class="text-green-600 font-bold">₹${item.price}</span>
                    <button class="add-to-cart bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition">
                        Add
                    </button>
                </div>
            </div>
        `;

        menuContainer.appendChild(card);
    });
}

// Update cart display
function updateCart() {
    const cartItemsElement = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    
    if (cart.length === 0) {
        cartItemsElement.innerHTML = '<p class="text-gray-500 italic">No items in your cart</p>';
        cartTotalElement.textContent = '₹0';
        return;
    }

    let total = 0;
    let cartHTML = '<ul class="divide-y">';
    
    cart.forEach(item => {
        total += item.price;
        cartHTML += `
            <li class="py-2 flex justify-between items-center">
                <span>${item.name} - ₹${item.price}</span>
                <button class="remove-item text-red-500 hover:text-red-700" data-id="${item.id}">
                    Remove
                </button>
            </li>
        `;
    });
    
    cartHTML += '</ul>';
    cartItemsElement.innerHTML = cartHTML;
    cartTotalElement.textContent = `₹${total}`;

    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            removeFromCart(id);
        });
    });
}

// Add item to cart
function addToCart(id) {
    const item = menu.find(item => item.id === id);
    if (item) {
        cart.push({...item});
        updateCart();
        
        // Highlight the selected card
        const card = document.querySelector(`.item-card[data-id="${id}"]`);
        card.classList.add('selected');
        setTimeout(() => {
            card.classList.remove('selected');
        }, 500);
    }
}

// Remove item from cart
function removeFromCart(id) {
    const index = cart.findIndex(item => item.id === id);
    if (index !== -1) {
        cart.splice(index, 1);
        updateCart();
    }
}

// Submit order
async function submitOrder() {
    if (cart.length === 0) {
        alert('Please add items to your cart first');
        return;
    }

    if (!waNumber) {
        showErrorModal('WhatsApp number not found. Please go back to WhatsApp and try again.');
        return;
    }

    try {
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        
        const response = await fetch('/.netlify/functions/processOrder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                waNumber,
                orderItems: cart,
                total
            })
        });

        const result = await response.json();
        
        if (response.ok) {
            // Show success modal
            document.getElementById('order-confirmation-message').textContent = 
                `Your order #${result.orderId} has been placed successfully!`;
            document.getElementById('success-modal').classList.remove('hidden');
            
            // Clear cart
            cart = [];
            updateCart();
        } else {
            showErrorModal(result.error || 'Failed to place order. Please try again.');
        }
    } catch (error) {
        console.error('Error submitting order:', error);
        showErrorModal('Network error. Please check your connection and try again.');
    }
}

// Show error modal
function showErrorModal(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-modal').classList.remove('hidden');
}

// Attach event listeners
function attachEventListeners() {
    // Add to cart buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart')) {
            const card = e.target.closest('.item-card');
            const id = parseInt(card.dataset.id);
            addToCart(id);
        }
    });

    // Submit order button
    document.getElementById('order-btn').addEventListener('click', submitOrder);

    // Close modals
    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('success-modal').classList.add('hidden');
    });
    
    document.getElementById('close-error-modal').addEventListener('click', () => {
        document.getElementById('error-modal').classList.add('hidden');
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
