const menu = [
  {
    id: 1,
    name: 'Dal',
    price: 50,
    imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg',
    description: 'A classic lentil dish, rich and flavorful.',
    options: [{ name: 'Full', priceMultiplier: 1 }, { name: 'Half', priceMultiplier: 0.5 }]
  },
  {
    id: 2,
    name: 'Chole',
    price: 60,
    imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg',
    description: 'Spicy and tangy chickpea curry.',
    options: [{ name: 'Full', priceMultiplier: 1 }, { name: 'Half', priceMultiplier: 0.5 }]
  },
  {
    id: 3,
    name: 'Rajma',
    price: 55,
    imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg',
    description: 'Red kidney bean curry, a North Indian favorite.',
    options: [{ name: 'Full', priceMultiplier: 1 }, { name: 'Half', priceMultiplier: 0.5 }]
  },
  {
    id: 4,
    name: 'Kadi',
    price: 45,
    imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg',
    description: 'Yogurt-based curry with gram flour dumplings.',
    options: [{ name: 'Full', priceMultiplier: 1 }, { name: 'Half', priceMultiplier: 0.5 }]
  },
  {
    id: 5,
    name: 'Rice',
    price: 30,
    imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg',
    description: 'Plain steamed rice, perfect accompaniment to any dish.',
    options: [{ name: 'Regular', priceMultiplier: 1 }]
  },
  {
    id: 6,
    name: 'Bread',
    price: 20,
    imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg',
    description: 'Assorted Indian breads (Roti, Naan).',
    options: [{ name: '1 Qty', priceMultiplier: 1 }]
  }
];

let waNumber = '';
let cart = [];

document.addEventListener('DOMContentLoaded', () => {
  waNumber = getWaNumberFromUrl();
  renderMenu();
  attachEventListeners();
});

function getWaNumberFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('waNumber');
}

function renderMenu() {
  const menuContainer = document.getElementById('menu-container');
  menuContainer.innerHTML = '';

  menu.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card bg-white rounded-xl shadow p-4';
    card.dataset.id = item.id;

    let optionsHtml = '';
    if (item.options && item.options.length > 1) {
      optionsHtml = `<div class="options flex justify-center gap-2 mt-4">`;
      item.options.forEach(option => {
        optionsHtml += `
          <input type="radio" id="${item.id}-${option.name}" name="option-${item.id}" value="${option.name}" data-price-multiplier="${option.priceMultiplier}" class="hidden peer">
          <label for="${item.id}-${option.name}" class="text-sm px-3 py-1 border rounded-full cursor-pointer peer-checked:bg-[#FF7043] peer-checked:text-white">
            ${option.name}
          </label>
        `;
      });
      optionsHtml += `</div>`;
    }

    card.innerHTML = `
      <img src="${item.imageUrl}" class="w-full h-32 object-cover rounded-lg mb-2" />
      <h3 class="font-semibold text-lg">${item.name}</h3>
      <p class="description text-sm text-gray-600 hidden">${item.description}</p>
      <button class="description-btn text-xs text-[#FF5722] mt-1 underline">Show Description</button>
      <div class="mt-2 flex justify-between items-center">
        <span class="text-[#FF5722] font-bold text-lg">₹${item.price}</span>
        <button class="add-to-cart bg-[#FF5722] hover:bg-[#FF7043] text-white px-4 py-1 rounded font-medium">Add</button>
      </div>
      ${optionsHtml}
    `;

    menuContainer.appendChild(card);
  });
}

function addToCart(id) {
  const item = menu.find(m => m.id === id);
  if (!item) return;

  const selectedOption = document.querySelector(`input[name="option-${id}"]:checked`);
  const priceMultiplier = selectedOption ? parseFloat(selectedOption.dataset.priceMultiplier) : 1;
  const portion = selectedOption ? selectedOption.value : item.options?.[0]?.name || '';
  const quantity = 1;
  const price = item.price * priceMultiplier;

  const existing = cart.find(i => i.id === id && i.portion === portion);
  if (existing) {
    existing.quantity += 1;
    existing.price += price;
  } else {
    cart.push({ id, name: item.name, portion, quantity, price });
  }

  updateCart();
}

function removeFromCart(id) {
  const index = cart.findIndex(i => i.id === id);
  if (index !== -1) {
    cart.splice(index, 1);
    updateCart();
  }
}

function updateCart() {
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');

  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="text-gray-500 italic">No items in your cart</p>';
    cartTotal.textContent = '₹0';
    return;
  }

  let total = 0;
  let html = '<ul class="divide-y">';
  cart.forEach(item => {
    total += item.price;
    html += `
      <li class="py-2 flex justify-between text-sm">
        <span>${item.name} ${item.portion ? `(${item.portion})` : ''} x ${item.quantity}</span>
        <span class="text-[#FF5722] font-medium">₹${item.price.toFixed(2)}</span>
      </li>
    `;
  });
  html += '</ul>';

  cartItems.innerHTML = html;
  cartTotal.textContent = `₹${total.toFixed(2)}`;
}

async function submitOrder() {
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }

  if (!waNumber) {
    showErrorModal('WhatsApp number not found. Please return to the bot.');
    return;
  }

  const total = cart.reduce((sum, i) => sum + i.price, 0);
  const orderItems = cart.map(i => ({
    name: i.name,
    quantity: i.quantity,
    portion: i.portion,
    price: i.price / i.quantity
  }));

  try {
    const res = await fetch('/.netlify/functions/processOrder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waNumber, orderItems, total })
    });
    const result = await res.json();

    if (res.ok) {
      document.getElementById('order-confirmation-message').textContent =
        `Your order #${result.orderId} has been placed successfully!`;
      document.getElementById('success-modal').classList.remove('hidden');
      cart = [];
      updateCart();
    } else {
      showErrorModal(result.error || 'Failed to place order.');
    }
  } catch (err) {
    console.error(err);
    showErrorModal('Network error. Please try again.');
  }
}

function showErrorModal(message) {
  document.getElementById('error-message').textContent = message;
  document.getElementById('error-modal').classList.remove('hidden');
}

function attachEventListeners() {
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-item')) {
      const id = parseInt(e.target.dataset.id);
      removeFromCart(id);
    }
    if (e.target.classList.contains('description-btn')) {
      const desc = e.target.closest('.item-card').querySelector('.description');
      desc.classList.toggle('hidden');
      e.target.textContent = desc.classList.contains('hidden') ? 'Show Description' : 'Hide Description';
    }
  });

  document.getElementById('order-btn').addEventListener('click', submitOrder);
  document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('success-modal').classList.add('hidden');
  });
  document.getElementById('close-error-modal').addEventListener('click', () => {
    document.getElementById('error-modal').classList.remove('hidden');
  });
}
