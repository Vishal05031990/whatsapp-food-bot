// netlify/functions/validateSession.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'daalMail';
const SESSIONS_COLLECTION_NAME = 'sessions'; // Assuming you have a 'sessions' collection

// Reuse DB connection across requests for performance in Netlify Functions
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
        const { sessionId, phoneNumber } = JSON.parse(event.body);

        if (!sessionId || !phoneNumber) {
            console.warn("❌ validateSession: Missing sessionId or phoneNumber");
            return {
                statusCode: 400,
                body: JSON.stringify({ valid: false, message: 'Missing session ID or phone number.' }),
            };
        }

        const db = await connectToDatabase();
        const sessionsCollection = db.collection(SESSIONS_COLLECTION_NAME);

        // Find the session
        const session = await sessionsCollection.findOne({
            sessionId: sessionId,
            phoneNumber: phoneNumber
        });

        if (!session) {
            console.log(`❌ validateSession: Session not found for sessionId: ${sessionId}, phoneNumber: ${phoneNumber}`);
            return {
                statusCode: 200, // Return 200 even if invalid, to allow frontend to display message
                body: JSON.stringify({ valid: false, message: 'Session not found. Please restart from WhatsApp.' }),
            };
        }

        // --- NEW: Check for 'completed' status ---
        if (session.status === 'completed') {
            console.log(`❌ validateSession: Session already completed for sessionId: ${sessionId}`);
            return {
                statusCode: 200,
                body: JSON.stringify({ valid: false, message: 'This session has already been completed. Please start a new order from WhatsApp.' }),
            };
        }

        // Optional: Implement session expiration logic (e.g., sessions expire after 30 minutes)
        const THIRTY_MINUTES_MS = 30 * 60 * 1000;
        const now = new Date();
        // Ensure 'createdAt' exists or handle its absence
        const sessionCreatedAt = session.createdAt ? new Date(session.createdAt) : new Date(0); // Default to epoch if not present

        if (now.getTime() - sessionCreatedAt.getTime() > THIRTY_MINUTES_MS) {
            console.log(`❌ validateSession: Session expired for sessionId: ${sessionId}`);
            // Optionally update the expired session to 'expired' status in DB
            await sessionsCollection.updateOne(
                { _id: session._id },
                { $set: { status: 'expired', expiredAt: now } }
            );
            return {
                statusCode: 200,
                body: JSON.stringify({ valid: false, message: 'Session expired. Please restart from WhatsApp.' }),
            };
        }

        console.log(`✅ validateSession: Session valid for sessionId: ${sessionId}, phoneNumber: ${phoneNumber}`);
        return {
            statusCode: 200,
            body: JSON.stringify({ valid: true, message: 'Session is valid.' }),
        };

    } catch (error) {
        console.error("❌ validateSession error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ valid: false, error: 'Internal server error during session validation.', details: error.message }),
        };
    }
};
