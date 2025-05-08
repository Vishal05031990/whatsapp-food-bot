// netlify/functions/processOrder.js
const { MongoClient } = require('mongodb');
const axios = require('axios');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'daalMail';
const COLLECTION_NAME = 'orders';
const NETLIFY_FUNCTION_URL = process.env.NETLIFY_FUNCTION_URL;

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
      const sendMessageResponse = await axios.post(
        `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, // Use the environment variable
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
      console.log('sendMessage response:', sendMessageResponse.data);
    } catch (sendMessageError) {
      console.error('Error calling sendMessage:', sendMessageError.response?.data || sendMessageError.message);
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
    console.error('Error processing order:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};