import axios from "axios";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
    });
}

const db = admin.firestore();

export async function handler(event, context) {
    const code = event.queryStringParameters.code;

    try {
        // 1. Exchange code for tokens
        const response = await axios.post("https://www.strava.com/oauth/token", {
            client_id: process.env.STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            code,
            grant_type: "authorization_code"
        });

        const data = response.data;

        // 2. Save to Firestore
        await db.collection("strava").doc(data.athlete.id.toString()).set(data);

        // 3. Redirect back to homepage
        return {
            statusCode: 302,
            headers: {
                Location: "/"  // 👈 change this to "/dashboard" if you want
            },
        };

    } catch (err) {
        console.error("Strava auth error:", err.response?.data || err.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message }),
        };
    }
}
