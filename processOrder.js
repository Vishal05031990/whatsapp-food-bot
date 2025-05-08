// netlify/functions/processOrder.js
const { MongoClient } = require('mongodb');
const axios = require('axios');
require('dotenv').config(); // Good practice, though Netlify provides env vars

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'daalMail';
const COLLECTION_NAME = 'orders';
const NETLIFY_FUNCTION_URL = process.env.NETLIFY_FUNCTION_URL; // Corrected variable name
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID; // Get Phone Number ID

// Connect to MongoDB
let cachedDb = null;
const connectToDatabase = async () => {
  if (cachedDb) return cachedDb;

  const client = await MongoClient.connect(MONGODB_URI);
  cachedDb = client.db(DB_NAME);
  return cachedDb;
};

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.error("processOrder: Method not allowed");
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the incoming request body
    const data = JSON.parse(event.body);
    const { waNumber, orderItems, total } = data;

    if (!waNumber || !orderItems || !total) {
      console.error("processOrder: Missing required fields");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Format the phone number to include country code if not present
    const formattedPhone = waNumber.startsWith('+')
      ? waNumber
      : `+${waNumber}`;

    // Create an order object
    const order = {
      waNumber: formattedPhone,
      orderItems,
      total,
      status: 'new',
      orderTime: new Date(),
      orderNumber: `DM${Date.now().toString().slice(-6)}`
    };

    // Connect to the database
    const db = await connectToDatabase();

    // Insert the order
    await db.collection(COLLECTION_NAME).insertOne(order);
    console.log("processOrder: Order inserted into database", order); // Log the inserted order

    // Construct order summary message
    const orderSummary = `
Order Summary:
Order Number: ${order.orderNumber}
Total: ${total}
Items:
${orderItems.map(item => `- ${item.name} x ${item.quantity} ${item.portion ? `(${item.portion})` : ''}`).join('\n')}
Status: ${order.status}
    `;

    // Call sendMessage Netlify Function
    try {
      console.log(`processOrder: Calling sendMessage with URL: ${NETLIFY_FUNCTION_URL}/sendMessage`); // Log the URL
      const sendMessageResponse = await axios.post(
        `${NETLIFY_FUNCTION_URL}/sendMessage`, //  Use NETLIFY_FUNCTION_URL
        {
          phone: formattedPhone,
          message: `Your order has been placed!\n${orderSummary}`
        },
        {
          headers: {
            Authorization: `Bearer EAAJOwzVjafUBO1YobOHuw4woZCd9EUCheXx65sWC4dOuIqa1OLOXU17gEyctZCDObLuGNF8wC11Iyl5phpOwN4Nh8WOLN3a4HZCBkUz46IY72gHWzZBziQBuag0ROksayA3NG0ZArq0DprCuHsgSgXtvmv5HWllH7oFY6xhCNj7c9TwuRoBBPR9XfsyMcfg24VgZDZD`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('processOrder: sendMessage response:', sendMessageResponse.data);
      if (sendMessageResponse.status !== 200) {
        console.error("processOrder: sendMessage returned non-200 status:", sendMessageResponse.status);
      }

    } catch (sendMessageError) {
      console.error('processOrder: Error calling sendMessage:', sendMessageError.response?.data || sendMessageError.message || sendMessageError); // improved
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to send message', details: sendMessageError.message }) // Include details
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        orderId: order.orderNumber,
        message: 'Order placed successfully'
      })
    };
  } catch (error) {
    console.error('processOrder: Error processing order:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }) // Include details
    };
  }
};
