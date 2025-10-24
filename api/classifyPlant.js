import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// helper: super strict JSON extraction fallback
function extractSpecies(text) {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.species === "string") {
      return parsed.species;
    }
  } catch (e) {
    // model maybe returned plain text like "This looks like a pothos."
    // fallback regex for last resort:
    const match = text.match(/(pothos|monstera|ficus|orchid|palm|succulent|snake plant|aloe|unknown)/i);
    if (match) return match[0];
  }
  return "unknown";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageDataUrl } = req.body || {};
  if (!imageDataUrl) {
    return res.status(400).json({ error: "No image provided" });
  }

  try {
    // Ask the model for a *short* structured answer.
    // We tell it to ONLY return JSON like:
    // { "species": "Monstera deliciosa" }
    //
    // We also tell it to answer "unknown" if it's not confident.
    //
    // Vision models like gpt-4o accept messages that include both text and an image,
    // where the image can be sent as a base64 data URL string in `image_url.url`. :contentReference[oaicite:1]{index=1}
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // or "gpt-4o-mini" if you want cheaper/faster
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text:
                "You are a houseplant identification assistant. " +
                "Identify the most likely common houseplant species in the photo. " +
                'Return ONLY valid JSON like {"species": "Monstera deliciosa"}.' +
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
                // send the base64 data URL from the client
                url: imageDataUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 100,
    });

    const rawText = completion.choices?.[0]?.message?.content?.trim() || "";
    const speciesGuess = extractSpecies(rawText);

    return res.status(200).json({
      species: speciesGuess || "unknown",
      raw: rawText, // optional: useful for debugging in dev
    });
  } catch (err) {
    console.error("classification error", err);
    return res.status(500).json({
      error: "Classification failed",
      species: "unknown",
    });
  }
}
