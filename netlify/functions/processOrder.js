// netlify/functions/processOrder.js (replace with this content)
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'daalMail';
const COLLECTION_NAME = 'orders';

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
      orderNumber: `DM${Date.now().toString().slice(-6)}` // Simple order ID generation
    };

    // Connect to the database
    const db = await connectToDatabase();
    
    // Insert the order
    await db.collection(COLLECTION_NAME).insertOne(order);

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
