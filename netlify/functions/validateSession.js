{\rtf1\ansi\ansicpg1252\cocoartf2761
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // netlify/functions/validateSession.js\
const \{ MongoClient \} = require('mongodb');\
require('dotenv').config();\
\
const MONGODB_URI = process.env.MONGODB_URI;\
const DB_NAME = 'daalMail';\
const SESSIONS_COLLECTION_NAME = 'sessions'; // Assuming you have a 'sessions' collection\
\
// Reuse DB connection across requests for performance in Netlify Functions\
let cachedDb = null;\
const connectToDatabase = async () => \{\
    if (cachedDb) return cachedDb;\
    const client = await MongoClient.connect(MONGODB_URI);\
    cachedDb = client.db(DB_NAME);\
    return cachedDb;\
\};\
\
exports.handler = async (event) => \{\
    if (event.httpMethod !== 'POST') \{\
        return \{\
            statusCode: 405,\
            body: JSON.stringify(\{ error: 'Method not allowed' \}),\
        \};\
    \}\
\
    try \{\
        const \{ sessionId, phoneNumber \} = JSON.parse(event.body);\
\
        if (!sessionId || !phoneNumber) \{\
            console.warn("\uc0\u10060  validateSession: Missing sessionId or phoneNumber");\
            return \{\
                statusCode: 400,\
                body: JSON.stringify(\{ valid: false, message: 'Missing session ID or phone number.' \}),\
            \};\
        \}\
\
        const db = await connectToDatabase();\
        const sessionsCollection = db.collection(SESSIONS_COLLECTION_NAME);\
\
        // Find the session\
        const session = await sessionsCollection.findOne(\{\
            sessionId: sessionId,\
            phoneNumber: phoneNumber\
        \});\
\
        if (!session) \{\
            console.log(`\uc0\u10060  validateSession: Session not found for sessionId: $\{sessionId\}, phoneNumber: $\{phoneNumber\}`);\
            return \{\
                statusCode: 200, // Return 200 even if invalid, to allow frontend to display message\
                body: JSON.stringify(\{ valid: false, message: 'Session not found. Please restart from WhatsApp.' \}),\
            \};\
        \}\
\
        // Optional: Implement session expiration logic (e.g., sessions expire after 30 minutes)\
        const THIRTY_MINUTES_MS = 30 * 60 * 1000;\
        const now = new Date();\
        const sessionCreatedAt = new Date(session.createdAt); // Assuming 'createdAt' field in your session object\
\
        if (now.getTime() - sessionCreatedAt.getTime() > THIRTY_MINUTES_MS) \{\
            console.log(`\uc0\u10060  validateSession: Session expired for sessionId: $\{sessionId\}`);\
            // Optionally remove the expired session\
            await sessionsCollection.deleteOne(\{ _id: session._id \});\
            return \{\
                statusCode: 200,\
                body: JSON.stringify(\{ valid: false, message: 'Session expired. Please restart from WhatsApp.' \}),\
            \};\
        \}\
\
        console.log(`\uc0\u9989  validateSession: Session valid for sessionId: $\{sessionId\}, phoneNumber: $\{phoneNumber\}`);\
        return \{\
            statusCode: 200,\
            body: JSON.stringify(\{ valid: true, message: 'Session is valid.' \}),\
        \};\
\
    \} catch (error) \{\
        console.error("\uc0\u10060  validateSession error:", error);\
        return \{\
            statusCode: 500,\
            body: JSON.stringify(\{ valid: false, error: 'Internal server error during session validation.', details: error.message \}),\
        \};\
    \}\
\};}