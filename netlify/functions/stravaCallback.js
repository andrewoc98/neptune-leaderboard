import axios from "axios";
import admin from "firebase-admin";

// ✅ Initialize Firebase Admin only once
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // replace escaped newlines in the private key
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
    });
}

const db = admin.firestore();

export async function handler(event, context) {
    const code = event.queryStringParameters.code;

    if (!code) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing authorization code" }),
        };
    }

    try {
        // Step 1: Exchange code for tokens
        const response = await axios.post("https://www.strava.com/oauth/token", {
            client_id: process.env.STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            code: code,
            grant_type: "authorization_code",
        });

        const data = response.data;
        const athlete = data.athlete;

        // Step 2: Save athlete + tokens in Firestore
        await db.collection("strava").doc(athlete.id.toString()).set(
            {
                athlete,
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                expires_at: data.expires_at,
                token_type: data.token_type,
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true } // ✅ update if exists
        );

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, athlete }),
        };
    } catch (err) {
        console.error("Error in Strava callback:", err.response?.data || err.message);
        return {
            statusCode: err.response?.status || 500,
            body: JSON.stringify(err.response?.data || { error: err.message }),
        };
    }
}
