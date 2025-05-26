// netlify/functions/sendMessage.js
const axios = require('axios');
require('dotenv').config(); // Important for accessing environment variables

exports.handler = async (event) => {
    console.log("➡️ sendMessage Function triggered");
    const { phone, message } = JSON.parse(event.body);

    try {
        console.log(`Attempting to send message to: ${phone}`);
        const response = await axios.post(
            `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: phone,
                type: "text",
                text: { body: message }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("✅ Message sent successfully:", response.data);
        return {
            statusCode: 200,
            body: JSON.stringify(response.data)
        };
    } catch (error) {
        console.error("❌ sendMessage error:", error.response?.data || error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.response?.data || error.message })
        };
    }
};
