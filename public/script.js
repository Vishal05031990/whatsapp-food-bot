// Menu data
const menu = [
    { 
        id: 1, 
        name: 'Dal', 
        price: 50, 
        imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg',
        description: 'A classic lentil dish, rich and flavorful.',
        options: [
            { name: 'Full', priceMultiplier: 1 },
            { name: 'Half', priceMultiplier: 0.5 }
        ]
    },
    { 
        id: 2, 
        name: 'Chole', 
        price: 60, 
        imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg',
        description: 'Spicy and tangy chickpea curry.',
        options: [
            { name: 'Full', priceMultiplier: 1 },
            { name: 'Half', priceMultiplier: 0.5 }
        ]
    },
    { 
        id: 3, 
        name: 'Rajma', 
        price: 55, 
        imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg',
        description: 'Red kidney bean curry, a North Indian favorite.',
        options: [
            { name: 'Full', priceMultiplier: 1 },
            { name: 'Half', priceMultiplier: 0.5 }
        ]
    },
    { 
        id: 4, 
        name: 'Kadi', 
        price: 45, 
        imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg',
        description: 'Yogurt-based curry with gram flour dumplings.',
        options: [
            { name: 'Full', priceMultiplier: 1 },
            { name: 'Half', priceMultiplier: 0.5 }
        ]
    },
    { 
        id: 5, 
        name: 'Rice', 
        price: 30, 
        imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg',
        description: 'Plain steamed rice, perfect accompaniment to any dish.',
        options: [
            { name: 'Regular', priceMultiplier: 1 }
        ]
    },
    { 
        id: 6, 
        name: 'Bread', 
        price: 20, 
        imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg',
        description: 'Assorted Indian breads (Roti, Naan).',
        options: [
            { name: '1 Qty', priceMultiplier: 1 }
        ]
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

// Render menu items
function renderMenu() {
    const menuContainer = document.getElementById('menu-container');
    menuContainer.innerHTML = '';

    menu.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:scale-[1.02]';
        card.dataset.id = item.id;

        let optionsHtml = '';
        if (item.options && item.options.length > 1) {
            optionsHtml = `<div class="options flex justify-center gap-4 mt-4">`;
            item.options.forEach(option => {
                optionsHtml += `
                    <input type="radio" id="${item.id}-${option.name}" name="option-${item.id}" value="${option.name}" data-price-multiplier="${option.priceMultiplier}" class="hidden peer">
                    <label for="${item.id}-${option.name}" class="inline-flex items-center justify-center px-4 py-2 rounded-full border border-gray-300 text-gray-700 bg-gray-50 hover:bg-gray-100 hover:text-green-600 cursor-pointer focus:outline-none focus:ring-4 focus:ring-green-500/50 transition-colors duration-300 font-medium text-sm w-full text-center peer-checked:bg-green-100 peer-checked:text-green-700">
                        ${option.name}
                    </label>
                `;
            });
            optionsHtml += `</div>`;
        } else if (item.options && item.options.length === 1) {
            optionsHtml = `<div class="options flex justify-center gap-4 mt-4">
                            <span class="text-gray-700 font-medium text-sm">
                                ${item.options[0].name}
                            </span>
                           </div>`;
        }


        card.innerHTML = `
            <img src="${item.imageUrl}" alt="${item.name}" class="w-full h-32 object-cover rounded-t-lg">
            <div class="p-6">
                <h3 class="font-semibold text-xl text-gray-800 mb-2">${item.name}</h3>
                <p class="text-gray-600 text-sm mb-4 description hidden">${item.description}</p>
                 <button class="description-btn text-blue-500 hover:text-blue-700 text-sm mb-4 transition-colors duration-200">
                    Show Description
                </button>
                <div class="flex justify-between items-center mt-2">
                    <span class="text-green-600 font-bold text-lg">₹${item.price}</span>
                    <button class="add-to-cart bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors duration-300 font-semibold">
                        Add
                    </button>
                </div>
                ${optionsHtml}
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
    let cartHTML = '<ul class="divide-y divide-gray-200">';
    
    cart.forEach(item => {
        total += item.price;
        cartHTML += `
            <li class="py-3 flex justify-between items-center">
                <div class="flex items-center gap-4">
                    <span class="font-medium text-gray-800">${item.name} ${item.portion ? `(${item.portion})` : ''} x ${item.quantity}</span>
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
function addToCart(id) {
    const item = menu.find(item => item.id === id);
    if (item) {
        let selectedOption = item.options ? document.querySelector(`input[name="option-${id}"]:checked`) : null;
        let priceMultiplier = selectedOption ? parseFloat(selectedOption.dataset.priceMultiplier) : 1;
        let portionName = selectedOption ? selectedOption.value : item.options? item.options[0].name : '';
       
        let quantity = 1;
        if(item.name === 'Rice') {
            quantity = 1;
        }
        
        const existingItem = cart.find(cartItem => cartItem.id === id && cartItem.portion === portionName);
        
        if (existingItem) {
             existingItem.quantity += quantity;
             existingItem.price = item.price * existingItem.quantity * priceMultiplier;
        } else {
            cart.push({ 
                ...item, 
                price: item.price * quantity * priceMultiplier,
                portion: portionName,
                quantity: quantity
            });
        }
        
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
         const orderItems = cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            portion: item.portion,
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
    // Add to cart buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart')) {
            const card = e.target.closest('.item-card');
            const id = parseInt(card.dataset.id);
            addToCart(id);
        }
    });

     // Description toggle buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('description-btn')) {
            const card = e.target.closest('.item-card');
            const description = card.querySelector('.description');
            description.classList.toggle('hidden');
            e.target.textContent = description.classList.contains('hidden')
                ? 'Show Description'
                : 'Hide Description';
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