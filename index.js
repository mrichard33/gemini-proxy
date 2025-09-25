import express from "express";
import cors from "cors";
import { OpenAI } from "openai";

const app = express();
app.use(express.json());
app.use(cors());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Optional: tighten outputs to a single integer using JSON schema
const avmSchema = {
  name: "avm_integer_only",
  schema: {
    type: "object",
    properties: {
      value: { type: "integer", description: "Fair market value in USD as an integer only" }
    },
    required: ["value"],
    additionalProperties: false
  },
  strict: true
};

app.post("/api/openai-avm", async (req, res) => {
  console.log("\n--- NEW REQUEST RECEIVED ---");
  try {
    const { address } = req.body;
    console.log(`[1/4] Address: "${address}"`);
    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    // Same instruction, tightened to force an integer and disallow extra text
    const systemPrompt =
      "Act as an expert real estate AVM. Output a single integer representing fair market value in USD. " +
      "Methodology: 1) Identify core attributes from public records like living area, bed bath count, lot size; " +
      "2) Find at least three comparable sales within the last 12 months in the immediate neighborhood; " +
      "3) Adjust for current local market trends and price per square foot; " +
      "Do not use outdated tax assessments or old sale prices as the final value. " +
      "Output must be a single integer only inside a JSON object keyed 'value' when using JSON mode.";

    const userPrompt = `Address: ${address}`;

    console.log("[2/4] Sending request to OpenAI");

    // Responses API call with JSON schema to force integer output
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      system: systemPrompt,
      input: userPrompt,
      response_format: { type: "json_schema", json_schema: avmSchema }
    });

    // Extract the JSON object { value: <int> }
    const output = response.output?.[0]?.content?.[0]?.text ?? null;

    // Fallback: if the model returned plain text, coerce to integer
    let value = null;
    try {
      if (output) {
        const parsed = JSON.parse(output);
        value = Number.isInteger(parsed?.value) ? parsed.value : null;
      }
    } catch {
      // Try to strip non digits and parse
      const digits = String(output || "").replace(/[^\d]/g, "");
      value = digits ? parseInt(digits, 10) : null;
    }

    console.log(`[3/4] Extracted value: ${value}`);

    // Keep your existing response shape
    const finalResponse = { value };
    console.log("[4/4] Sending JSON back to the browser:", finalResponse);
    return res.status(200).json(finalResponse);
  } catch (err) {
    const errorMessage = err.response?.data || err.message || "Unknown error";
    console.error("[FATAL PROXY ERROR]", errorMessage);
    return res.status(200).json({ value: null, error: String(errorMessage) });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`OpenAI AVM proxy listening on port ${PORT}`);
});
