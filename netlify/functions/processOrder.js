// netlify/functions/processOrder.js
const { MongoClient } = require('mongodb');
const axios = require('axios');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'daalMail';
const ORDERS_COLLECTION_NAME = 'orders'; // Renamed for clarity
const SESSIONS_COLLECTION_NAME = 'sessions'; // Added for session management

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
        // Destructure sessionId and phoneNumber from the incoming data
        const { waNumber, orderItems, total, sessionId, phoneNumber } = data;

        if (!waNumber || !orderItems || !total) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields for order' }),
            };
        }

        // Ensure sessionId and phoneNumber are present for session update
        if (!sessionId || !phoneNumber) {
            console.error("❌ processOrder: Session ID or Phone Number missing from request body. Cannot mark session as complete.");
            // You might choose to return an error here or proceed without session update
            // For now, we'll proceed but log the issue.
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
            sessionId: sessionId, // Store sessionId with the order for traceability
        };

        const db = await connectToDatabase();
        const ordersCollection = db.collection(ORDERS_COLLECTION_NAME);
        const sessionsCollection = db.collection(SESSIONS_COLLECTION_NAME); // Get sessions collection

        // 1. Insert the order
        await ordersCollection.insertOne(order);
        console.log(`✅ Order ${order.orderNumber} inserted.`);


        // 2. Mark the session as completed/finished
        if (sessionId && phoneNumber) {
            await sessionsCollection.updateOne(
                { sessionId: sessionId, phoneNumber: phoneNumber },
                {
                    $set: {
                        status: 'completed',
                        completedAt: new Date(),
                        orderNumber: order.orderNumber // Link the session to the order
                    }
                }
            );
            console.log(`✅ Session ${sessionId} for ${phoneNumber} marked as completed.`);
        } else {
            console.warn("⚠️ Session ID or Phone Number not provided to processOrder, cannot mark session as complete.");
        }


        // 3. Send WhatsApp message
        const orderSummary = `
Order Summary:
Order Number: ${order.orderNumber}
Total: ₹${total}
Items:
${orderItems.map(item => `- ${item.name} x ${item.quantity}`).join('\n')}
Status: ${order.status}
`;
        const sendMessageUrl = `${NETLIFY_SITE_URL}/.netlify/functions/sendMessage`;

        console.log(`Attempting to call sendMessage function at: ${sendMessageUrl}`);

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
