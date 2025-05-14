const menu = [
  {
    id: 1,
    name: 'Dal',
    price: 50,
    imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg',
    description: 'A classic lentil dish, rich and flavorful.',
  },
  {
    id: 2,
    name: 'Chole',
    price: 60,
    imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg',
    description: 'Spicy and tangy chickpea curry.',
  },
  {
    id: 3,
    name: 'Rajma',
    price: 55,
    imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg',
    description: 'Red kidney bean curry, a North Indian favorite.',
  },
  {
    id: 4,
    name: 'Kadi',
    price: 45,
    imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg',
    description: 'Yogurt-based curry with gram flour dumplings.',
  },
  {
    id: 5,
    name: 'Rice',
    price: 30,
    imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg',
    description: 'Plain steamed rice, perfect accompaniment to any dish.',
  },
  {
    id: 6,
    name: 'Bread',
    price: 20,
    imageUrl: 'https://i.ibb.co/wnNL4s5/food-sample.jpg',
    description: 'Assorted Indian breads (Roti, Naan).',
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

    card.innerHTML = `
      <img src="${item.imageUrl}" class="w-full h-32 object-cover rounded-lg mb-2" />
      <h3 class="font-semibold text-lg">${item.name}</h3>
      <p class="description text-sm text-gray-600 hidden">${item.description}</p>
      <button class="description-btn text-xs text-[#FF5722] mt-1 underline">Show Description</button>
      <div class="mt-2 flex justify-between items-center">
        <span class="text-[#FF5722] font-bold text-lg">₹${item.price}</span>
        <div class="quantity-control flex items-center gap-2">
          <button class="decrease-quantity bg-[#FF5722] text-white px-3 py-1 rounded">-</button>
          <input type="number" class="quantity-input w-12 text-center border rounded" value="1" min="1" />
          <button class="increase-quantity bg-[#FF5722] text-white px-3 py-1 rounded">+</button>
        </div>
        <button class="add-to-cart bg-[#FF5722] hover:bg-[#FF7043] text-white px-4 py-1 rounded font-medium">Add</button>
      </div>
    `;

    menuContainer.appendChild(card);
  });
}

function addToCart(id, quantity) {
  const item = menu.find(m => m.id === id);
  if (!item) return;

  const price = item.price * quantity;
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.quantity += quantity;
    existing.price += price;
  } else {
    cart.push({ id, name: item.name, quantity, price });
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
        <span>${item.name} x ${item.quantity}</span>
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

    if (e.target.classList.contains('add-to-cart')) {
      const card = e.target.closest('.item-card');
      const id = parseInt(card.dataset.id);
      const quantity = parseInt(card.querySelector('.quantity-input').value);
      addToCart(id, quantity);
    }

    if (e.target.classList.contains('increase-quantity')) {
      const input = e.target.closest('.item-card').querySelector('.quantity-input');
      input.value = parseInt(input.value) + 1;
    }

    if (e.target.classList.contains('decrease-quantity')) {
      const input = e.target.closest('.item-card').querySelector('.quantity-input');
      if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
      }
    }
  });

  document.getElementById('order-btn').addEventListener('click', submitOrder);
  document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('success-modal').classList.add('hidden');
  });
  document.getElementById('close-error-modal').addEventListener('click', () => {
    document.getElementById('error-modal').classList.add('hidden');
  });
}
