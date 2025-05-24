{\rtf1\ansi\ansicpg1252\cocoartf2761
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 const \{ MongoClient \} = require('mongodb');\
require('dotenv').config(); // Ensure dotenv is loaded for Netlify environment variables\
\
const MONGODB_URI = process.env.MONGODB_URI;\
const DB_NAME = 'daalMail'; // Your database name\
const USERS_COLLECTION = 'users'; // Your collection where user states are stored\
\
let cachedDb = null;\
\
const connectToDatabase = async () => \{\
  if (cachedDb) \{\
    console.log("checkUserState: Returning cached database connection");\
    return cachedDb;\
  \}\
  try \{\
    console.log("checkUserState: Connecting to MongoDB...");\
    const client = await MongoClient.connect(MONGODB_URI);\
    cachedDb = client.db(DB_NAME);\
    console.log('checkUserState: Successfully connected to MongoDB');\
    return cachedDb;\
  \} catch (error) \{\
    console.error('checkUserState: Error connecting to MongoDB:', error);\
    throw error; // Re-throw to be caught by the handler\
  \}\
\};\
\
exports.handler = async (event, context) => \{\
  // Only allow GET requests\
  if (event.httpMethod !== 'GET') \{\
    return \{\
      statusCode: 405,\
      body: JSON.stringify(\{ error: 'Method not allowed' \}),\
    \};\
  \}\
\
  const waNumber = event.queryStringParameters.waNumber;\
\
  if (!waNumber) \{\
    return \{\
      statusCode: 400,\
      body: JSON.stringify(\{ error: 'WhatsApp number is required' \}),\
    \};\
  \}\
\
  try \{\
    const db = await connectToDatabase();\
    const usersCollection = db.collection(USERS_COLLECTION);\
    const user = await usersCollection.findOne(\{ waNumber: waNumber \});\
\
    if (user && user.state) \{\
      // Return the user's current stage and any relevant data like addresses\
      return \{\
        statusCode: 200,\
        body: JSON.stringify(\{\
          stage: user.state.stage,\
          addresses: user.state.addresses || [], // Ensure addresses are returned if present in state\
          previousAddresses: user.previousAddresses || [] // If you store previousAddresses directly on the user doc\
        \}),\
      \};\
    \} else \{\
      // User not found or no state recorded, treat as 'start'\
      return \{\
        statusCode: 200,\
        body: JSON.stringify(\{ stage: 'start', addresses: [], previousAddresses: [] \}),\
      \};\
    \}\
  \} catch (error) \{\
    console.error('checkUserState: Error checking user state:', error);\
    return \{\
      statusCode: 500,\
      body: JSON.stringify(\{ error: 'Internal server error', details: error.message \}),\
    \};\
  \}\
\};}