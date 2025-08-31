// netlify/functions/stravaCallback.js
const axios = require('axios');

exports.handler = async (event, context) => {
    const code = event.queryStringParameters.code;

    // Exchange code for access token
    const response = await axios.post('https://www.strava.com/oauth/token', {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code'
    });

    // You can redirect back to your frontend after storing the token
    return {
        statusCode: 302,
        headers: {
            Location: `/success?athlete=${response.data.athlete.id}`
        },
    };
};
