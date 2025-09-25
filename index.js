const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

// Main endpoint that receives the address and calls the AI
app.post('/api/gemini-proxy', async (req, res) => {
    console.log('\n--- NEW REQUEST RECEIVED ---');

    try {
        const { address } = req.body;
        console.log(`[1/5] Received address from browser: "${address}"`);

        if (!address) {
            console.error('[ERROR] Address is missing in the request body.');
            return res.status(400).json({ error: 'Address is required' });
        }

        // The new, more sophisticated "Appraiser-Grade" prompt
        const prompt = `Act as an expert real estate AVM (Automated Valuation Model). Your task is to provide a highly accurate, up-to-date fair market value for the property at the following address. Methodology: 1. Property Lookup: First, identify the core attributes of the subject property from public records (e.g., Zillow, Redfin, county records). Key attributes include: living area square footage, bed/bath count, and lot size. 2. Comparable Sales: Second, find at least 3 recent comparable sales (comps) of similar properties sold within the last 12 months in the immediate neighborhood. 3. Market Adjustment: Third, adjust the valuation based on current local market trends and price per square foot. Do not use outdated tax assessments or old sale prices as the final value. 4. Final Estimate: Synthesize all data into a single estimated value. Your response must be a single integer representing the fair market value in USD. Do not include any text, dollar signs, or commas. Address: ${address}`;
        
        console.log('[2/5] Sending sophisticated prompt to Google API.');
        
        const googleResponse = await axios.post(GEMINI_URL, {
            contents: [{ parts: [{ text: prompt }] }]
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log(`[3/5] Received response from Google with status: ${googleResponse.status}`);
        console.log('--- START GOOGLE RESPONSE ---');
        console.log(JSON.stringify(googleResponse.data, null, 2));
        console.log('--- END GOOGLE RESPONSE ---');

        const extractedValue = googleResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
        
        console.log(`[4/5] Extracted value from Google's response: "${extractedValue}"`);
        
        const finalResponse = { value: extractedValue };
        console.log('[5/5] Sending this JSON back to the browser:', finalResponse);
        
        res.status(200).json(finalResponse);

    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error('[FATAL PROXY ERROR] The process failed.', errorMessage);
        res.status(200).json({ value: null, error: errorMessage });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Proxy server with axios is listening on port ${PORT}`);
});
