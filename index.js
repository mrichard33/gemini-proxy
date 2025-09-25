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