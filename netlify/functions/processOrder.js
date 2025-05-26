// netlify/functions/processOrder.js
const { MongoClient } = require('mongodb');
const axios = require('axios');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'daalMail';
const COLLECTION_NAME = 'orders'; // This is for orders

// Netlify automatically provides the base URL of your deployed site
// This is crucial for function-to-function calls using full URLs
const NETLIFY_SITE_URL = process.env.URL; // This variable is provided by Netlify

// Reuse DB connection across requests
let cachedDb = null;
const connectToDatabase = async () => {
    if (cachedDb) return cachedDb;
    const client = await MongoClient.connect(MONGODB_URI);
    cachedDb = client.db(DB_NAME);
    return cachedDb;
};

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        const data = JSON.parse(event.body);
        const { waNumber, orderItems, total } = data;

        if (!waNumber || !orderItems || !total) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields for order' }),
            };
        }

        const formattedPhone = waNumber.startsWith('+') ? waNumber : `+${waNumber}`;
        const orderNumber = `DM${Date.now().toString().slice(-6)}`;
        const order = {
            waNumber: formattedPhone,
            orderItems,
            total,
            status: 'new',
            orderTime: new Date(),
            orderNumber,
        };

        const db = await connectToDatabase();
        await db.collection(COLLECTION_NAME).insertOne(order);

        const orderSummary = `
Order Summary:
Order Number: ${order.orderNumber}
Total: ₹${total}
Items:
${orderItems.map(item => `- ${item.name} x ${item.quantity}`).join('\n')}
Status: ${order.status}
`;
        // CONSTRUCT THE FULL ABSOLUTE URL FOR THE sendMessage FUNCTION
        // Use NETLIFY_SITE_URL (e.g., https://sweet-sopapillas-fb37b3.netlify.app)
        // and append the function path.
        const sendMessageUrl = `${NETLIFY_SITE_URL}/.netlify/functions/sendMessage`;

        console.log(`Attempting to call sendMessage function at: ${sendMessageUrl}`); // Add for debugging

        const sendMessageResponse = await axios.post(
            sendMessageUrl,
            {
                phone: formattedPhone,
                message: `Your order has been placed!\n${orderSummary}`,
            }
        );

        if (sendMessageResponse.status !== 200) {
            console.error("❌ Failed to send WhatsApp message via sendMessage function");
        } else {
            console.log("✅ WhatsApp message sent successfully!");
        }


        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                order: { orderNumber: order.orderNumber },
                message: 'Order placed successfully',
            }),
        };
    } catch (error) {
        console.error("❌ processOrder error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error processing order', details: error.message }),
        };
    }
};
