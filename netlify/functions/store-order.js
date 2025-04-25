
const { MongoClient } = require("mongodb");
const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = "daalMail";
const COLLECTION_NAME = "orders";

exports.handler = async (event, context) => {
  console.log("➡️ Function triggered");

  if (event.httpMethod !== "POST") {
    console.warn("❌ Invalid method:", event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    console.log("🔐 MONGO_URI available?", !!MONGO_URI);

    const body = JSON.parse(event.body);
    console.log("📦 Order data received:", body);

    const { waNumber, orderItems, total } = body;
    if (!waNumber || !orderItems || !total) {
      console.warn("⚠️ Missing fields");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log("✅ MongoDB connected");

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const newOrder = {
      waNumber,
      orderItems,
      total,
      timestamp: new Date(),
    };

    const result = await collection.insertOne(newOrder);
    console.log("✅ Order inserted with ID:", result.insertedId);

    await client.close();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Order stored successfully!" }),
    };
  } catch (err) {
    console.error("❌ Error storing order:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to store order" }),
    };
  }
};
