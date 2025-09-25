const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // Allow requests from your website

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;

app.post('/api/gemini-proxy', async (req, res) => {
    const { address } = req.body;

    if (!address) {
        return res.status(400).json({ error: 'Address is required' });
    }

    const prompt = `Based on the following address, what is the estimated property value in US dollars? Respond with ONLY the numerical value, with no commas, dollar signs, or other text. If you cannot determine a value, respond with 'null'.\n\nAddress: ${address}`;
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// The API key is safely loaded from Railway's environment variables
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

        const prompt = `Based on the following address, what is the estimated property value in US dollars? Respond with ONLY the numerical value, with no commas, dollar signs, or other text. If you cannot determine a value, respond with 'null'.\n\nAddress: ${address}`;
        
        console.log('[2/5] Sending prompt to Google API.');
        
        const googleResponse = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const rawGoogleResponseText = await googleResponse.text();
        console.log(`[3/5] Received raw response from Google with status: ${googleResponse.status}`);
        console.log('--- START GOOGLE RESPONSE ---');
        console.log(rawGoogleResponseText);
        console.log('--- END GOOGLE RESPONSE ---');

        if (!googleResponse.ok) {
            throw new Error(`Google API failed. See raw response above.`);
        }

        const googleData = JSON.parse(rawGoogleResponseText);
        const extractedValue = googleData?.candidates?.[0]?.content?.parts?.[0]?.text || null;
        
        console.log(`[4/5] Extracted value from Google's response: "${extractedValue}"`);
        
        const finalResponse = { value: extractedValue };
        console.log('[5/5] Sending this JSON back to the browser:', finalResponse);
        
        res.status(200).json(finalResponse);

    } catch (error) {
        console.error('[FATAL PROXY ERROR] The process failed.', error.message);
        // Still send a success status to the browser so it doesn't hang, but with a null value.
        res.status(200).json({ value: null, error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Proxy server listening on port ${PORT}`);
});
    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google API failed with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const value = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
        
        res.status(200).json({ value });

    } catch (error) {
        console.error('Proxy Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch data from Google API.' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Proxy server listening on port ${PORT}`);
});