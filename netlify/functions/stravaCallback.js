import axios from "axios";

export async function handler(event, context) {
    const code = event.queryStringParameters.code;

    try {
        const response = await axios.post("https://www.strava.com/oauth/token", {
            client_id: process.env.STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            code: code,
            grant_type: "authorization_code"
        });

        return {
            statusCode: 200,
            body: JSON.stringify(response.data)
        };
    } catch (err) {
        console.error(err.response.data); // log Strava's error message
        return {
            statusCode: err.response?.status || 500,
            body: JSON.stringify(err.response?.data || { error: err.message })
        };
    }
}
