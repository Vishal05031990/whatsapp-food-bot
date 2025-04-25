const axios = require('axios');

exports.handler = async (event) => {
  try {
    const { waNumber, orderItems } = JSON.parse(event.body);
    
    // Generate order summary
    let summary = "📦 *Your Order Summary:*\n\n";
    let total = 0;
    
    orderItems.forEach(item => {
      summary += `- ${item.name}: ₹${item.price}\n`;
      total += item.price;
    });
    
    summary += `\n💵 *Total: ₹${total}*\n\nThank you for your order!`;
    
    // Send confirmation back to Venom bot
    await axios.post('http://localhost:8888/.netlify/functions/submitOrder', {
      phone: `${waNumber}@c.us`,
      message: summary
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};