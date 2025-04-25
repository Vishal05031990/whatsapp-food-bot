document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const waNumber = urlParams.get('waNumber');
  
  if(waNumber) {
    document.getElementById('waNumber').value = waNumber;
  }

  document.getElementById('orderForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const selectedItems = [];
    const checkboxes = document.querySelectorAll('input[name="item"]:checked');
    
    checkboxes.forEach(checkbox => {
      const itemName = checkbox.value;
      const itemPrice = parseInt(checkbox.nextElementSibling.textContent.split('₹')[1]);
      selectedItems.push({ name: itemName, price: itemPrice });
    });

    if(selectedItems.length === 0) {
      alert('Please select at least one item');
      return;
    }

    try {
      const response = await fetch('/.netlify/functions/processOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waNumber: waNumber,
          orderItems: selectedItems
        })
      });
      
      const result = await response.json();
      
      if(response.ok) {
        document.getElementById('orderForm').classList.add('hidden');
        document.getElementById('confirmation').classList.remove('hidden');
        document.getElementById('confirmation').innerHTML = `
          <h2>Order Submitted!</h2>
          <p>Check your WhatsApp for confirmation.</p>
          <a href="https://wa.me/${waNumber}" class="whatsapp-btn">Open WhatsApp</a>
        `;
      } else {
        throw new Error(result.error || 'Failed to submit order');
      }
    } catch(error) {
      alert(`Error: ${error.message}`);
      console.error('Order submission error:', error);
    }
  });
});