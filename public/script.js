// Menu data
const menu = [
    {
        id: 1,
        name: 'Dal',
        price: 50,
        imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg',
        description: 'A classic lentil dish, rich and flavorful.'
    },
    {
        id: 2,
        name: 'Chole',
        price: 60,
        imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg',
        description: 'Spicy and tangy chickpea curry.'
    },
    {
        id: 3,
        name: 'Rajma',
        price: 55,
        imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg',
        description: 'Red kidney bean curry, a North Indian favorite.'
    },
    {
        id: 4,
        name: 'Kadi',
        price: 45,
        imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg',
        description: 'Yogurt-based curry with gram flour dumplings.'
    },
    {
        id: 5,
        name: 'Rice',
        price: 30,
        imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg',
        description: 'Plain steamed rice, perfect accompaniment to any dish.'
    },
    {
        id: 6,
        name: 'Bread',
        price: 20,
        imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg',
        description: 'Assorted Indian breads (Roti, Naan).'
    },
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

function renderMenu() {
    const menuContainer = document.getElementById('menu-container');
    menuContainer.innerHTML = '';

    menu.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.dataset.id = item.id;

        card.innerHTML = `
            <div class="item-details flex justify-between items-center w-full">
                <div class="flex flex-col w-1/3">
                    <h3 class="font-semibold text-xl text-gray-800">${item.name}</h3>
                    <span class="item-price">₹${item.price}</span>
                </div>
                <div class="quantity-adjust flex items-center gap-4">
                    <button class="quantity-minus text-gray-700  p-2 rounded-full">
                        -
                    </button>
                    <span class="quantity-text text-gray-700">0</span>
                    <button class="quantity-plus text-gray-700  p-2 rounded-full">
                        +
                    </button>
                </div>
                <div class="w-1/3 flex justify-end">
                   <img src="${item.imageUrl}" alt="${item.name}" style="border-radius: 50%; object-fit: cover; width: 100px; height: 100px;">
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

    // Filter out items with zero quantity
    cart = cart.filter(item => item.quantity > 0);

    if (cart.length === 0) {
        cartItemsElement.innerHTML = '<p class="text-gray-500 italic">No items in your cart</p>';
        cartTotalElement.textContent = '₹0';
        return;
    }

    let total = 0;
    let cartHTML = '<ul class="divide-y divide-gray-200">';

    cart.forEach(item => {
        total += item.price;
        cartHTML += `
            <li class="py-3 flex justify-between items-center">
                <div class="flex items-center gap-4">
                    <span class="font-medium text-gray-800">${item.name} x ${item.quantity}</span>
                    <span class="text-green-600 font-semibold">₹${item.price.toFixed(2)}</span>
                </div>
                <button class="remove-item text-red-500 hover:text-red-700 transition-colors duration-200 font-medium" data-id="${item.id}">
                    Remove
                </button>
            </li>
        `;
    });

    cartHTML += '</ul>';
    cartItemsElement.innerHTML = cartHTML;
    cartTotalElement.textContent = `₹${total.toFixed(2)}`;

    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            removeFromCart(id);
        });
    });
}

// Add item to cart
function addToCart(id, quantity) {
    const item = menu.find(item => item.id === id);
    if (item) {
        const existingItem = cart.find(cartItem => cartItem.id === id);

        if (existingItem) {
            existingItem.quantity = quantity; // Corrected line
            existingItem.price = item.price * quantity;
        } else {
            cart.push({
                ...item,
                price: item.price * quantity,
                quantity: quantity
            });
        }

        updateCart();
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
        const orderItems = cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price / item.quantity, // Price per unit
        }));

        const response = await fetch('/.netlify/functions/processOrder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                waNumber,
                orderItems,
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
    // Quantity adjustment buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('quantity-plus') || e.target.classList.contains('quantity-minus')) {
            const card = e.target.closest('.item-card');
            const id = parseInt(card.dataset.id);
            const quantityText = card.querySelector('.quantity-text');
            let quantity = parseInt(quantityText.textContent);

            if (e.target.classList.contains('quantity-plus')) {
                quantity++;
            } else if (e.target.classList.contains('quantity-minus') && quantity > 0) {
                quantity--;
            }

            quantityText.textContent = quantity;
            addToCart(id, quantity);
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
