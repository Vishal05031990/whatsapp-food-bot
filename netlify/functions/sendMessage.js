const axios = require('axios');
require('dotenv').config(); // Important for accessing environment variables

exports.handler = async (event) => {
  const { phone, message } = JSON.parse(event.body);

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp", // Add this line
        to: phone,
        text: { body: message }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error("sendMessage error:", error); // Add more detailed error logging
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};