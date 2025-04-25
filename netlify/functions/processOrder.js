const axios = require('axios');

exports.handler = async (event) => {
  const { waNumber, orderItems } = JSON.parse(event.body);
  
  // Generate order summary
  let summary = "📦 *Your Order Summary:*\n\n";
  let total = 0;
  
  orderItems.forEach(item => {
    summary += `- ${item.name}: ₹${item.price}\n`;
    total += item.price;
  });
  
  summary += `\n💵 *Total: ₹${total}*\n\nThank you for your order!`;
  
  // Send WhatsApp message
  try {
    await axios.post('/.netlify/functions/sendMessage', {
      phone: waNumber,
      message: summary
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to send WhatsApp message" })
    };
  }
};