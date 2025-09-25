const express = require('express');
const axios = require('axios'); // Use axios instead of node-fetch
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

app.post('/api/gemini-proxy', async (req, res) => {
    console.log('\n--- NEW REQUEST RECEIVED ---');

    try {
        const { address } = req.body;
        console.log(`[1/5] Received address from browser: "${address}"`);

        if (!address) {
            console.error('[ERROR] Address is missing in the request body.');
            return res.status(400).json({ error: 'Address is required' });
        }

        const prompt = `Act as an expert real estate valuation analyst. Your task is to provide an automated valuation model (AVM) estimate for the property at the following address. Methodology: 1. Analyze publicly available data, including recent comparable sales in the neighborhood, local market trends, property tax records, and any past listing information for the property. 2. Synthesize this information to determine a fair market value. 3. Your final response must be a single integer representing the estimated value in USD, with no commas, dollar signs, or explanatory text. Address: ${address}`;
        
        console.log('[2/5] Sending prompt to Google API.');
        
        // Use axios.post for the API call
        const googleResponse = await axios.post(GEMINI_URL, {
            contents: [{ parts: [{ text: prompt }] }]
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log(`[3/5] Received response from Google with status: ${googleResponse.status}`);
        console.log('--- START GOOGLE RESPONSE ---');
        console.log(JSON.stringify(googleResponse.data, null, 2)); // axios puts the data in a .data property
        console.log('--- END GOOGLE RESPONSE ---');

        const extractedValue = googleResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
        
        console.log(`[4/5] Extracted value from Google's response: "${extractedValue}"`);
        
        const finalResponse = { value: extractedValue };
        console.log('[5/5] Sending this JSON back to the browser:', finalResponse);
        
        res.status(200).json(finalResponse);

    } catch (error) {
        console.error('[FATAL PROXY ERROR] The process failed.', error.response ? error.response.data : error.message);
        res.status(200).json({ value: null, error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Proxy server with axios is listening on port ${PORT}`);
});
