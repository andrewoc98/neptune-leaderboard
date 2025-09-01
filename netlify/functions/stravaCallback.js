import axios from "axios";

export async function handler() {
    try {
        const axios = require("axios");
        return {
            statusCode: 200,
            body: "Axios loaded fine!"
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: `Axios error: ${err.message}`
        };
    }
}


