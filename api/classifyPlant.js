import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// helper: grab "species" from model output
function extractSpecies(text) {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.species === "string") {
      return parsed.species;
    }
  } catch (e) {
    // not valid pure JSON, try loose match
    const jsonLikeMatch = text.match(/"species"\s*:\s*"([^"]+)"/i);
    if (jsonLikeMatch) {
      return jsonLikeMatch[1];
    }

    const match = text.match(
      /(pothos|monstera|ficus|orchid|palm|succulent|snake plant|aloe|unknown)/i
    );
    if (match) return match[0];
  }
  return "unknown";
}

export default async function handler(req, res) {
  // --- basic request validation ---
  if (req.method !== "POST") {
    console.log("[classifyPlant] wrong method:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  // NOTE: depending on Vercel runtime, req.body may already be parsed JSON,
  // but in some setups it's still a string. Let's guard both cases:
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      console.error("[classifyPlant] could not parse req.body string as JSON:", e);
    }
  }

  const { imageDataUrl } = body || {};
  console.log(
    "[classifyPlant] received imageDataUrl?",
    imageDataUrl ? "yes" : "no"
  );
  if (imageDataUrl) {
    console.log(
      "[classifyPlant] imageDataUrl prefix:",
      imageDataUrl.slice(0, 60)
    );
    console.log(
      "[classifyPlant] approx length (chars):",
      imageDataUrl.length
    );
  }

  if (!imageDataUrl) {
    console.error("[classifyPlant] No image provided");
    return res.status(400).json({ error: "No image provided" });
  }

  try {
    // --- Call OpenAI ---
    console.log("[classifyPlant] Calling OpenAI...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 100,
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text:
                "You are a houseplant identification assistant. " +
                "Identify the most likely common houseplant species in the photo. " +
                'Return ONLY valid JSON like {"species": "Monstera deliciosa"}. ' +
                'If you are not at least 60% sure, respond with {"species": "unknown"}. ' +
                "Use short common names or well known Latin names, not care tips.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "What plant is this? Remember: JSON only.",
            },
            {
              type: "image_url",
              image_url: {
                // we are passing the data URL directly
                url: imageDataUrl,
              },
            },
          ],
        },
      ],
    });

    // --- Process OpenAI response ---
    const rawText = completion?.choices?.[0]?.message?.content?.trim() || "";
    console.log("[classifyPlant] OpenAI rawText:", rawText);

    const speciesGuess = extractSpecies(rawText);
    console.log("[classifyPlant] Parsed speciesGuess:", speciesGuess);

    // --- return ok ---
    return res.status(200).json({
      species: speciesGuess || "unknown",
      raw: rawText,
    });
  } catch (err) {
    // This is critical: log full error so we can diagnose
    console.error("[classifyPlant] ERROR calling OpenAI:");
    console.error("name:", err.name);
    console.error("message:", err.message);
    console.error("status:", err.status || err.statusCode);
    // The SDK sometimes sticks response info on err.response
    if (err.response) {
      console.error("response status:", err.response.status);
      console.error("response data:", err.response.data);
    }
    // We also want to send some debug info back to the client
    return res.status(500).json({
      error: "Classification failed",
      details: err.message || "unknown server error",
      species: "unknown",
    });
  }
}
