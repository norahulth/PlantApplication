import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// helper: map AI response to our plant categories
function mapToPlantCategory(text) {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.species === "string") {
      return categorizeSpecies(parsed.species);
    }
  } catch (e) {
    // not valid pure JSON, try loose match
    const jsonLikeMatch = text.match(/"species"\s*:\s*"([^"]+)"/i);
    if (jsonLikeMatch) {
      return categorizeSpecies(jsonLikeMatch[1]);
    }
  }
  
  // fallback: try to match directly in the text
  return categorizeSpecies(text);
}

// Map any plant identification to our specific categories
function categorizeSpecies(species) {
  if (!species) return "unknown";
  
  const lower = species.toLowerCase();
  
  // Check for Monstera
  if (lower.includes("monstera")) {
    return "Monstera";
  }
  
  // Check for Pothos (also called Devil's Ivy, Epipremnum)
  if (lower.includes("pothos") || lower.includes("epipremnum") || lower.includes("devil")) {
    return "Pothos";
  }
  
  // Check for Parlor Palm (Chamaedorea elegans)
  if (lower.includes("parlor") || lower.includes("chamaedorea") || 
      (lower.includes("palm") && !lower.includes("areca") && !lower.includes("majesty"))) {
    return "Parlor Palm";
  }
  
  // Check for Peace Lily (Spathiphyllum)
  if (lower.includes("peace") || lower.includes("spathiphyllum") || 
      (lower.includes("lily") && !lower.includes("calla") && !lower.includes("water"))) {
    return "Peace Lily";
  }
  
  // Check for Rubber Fig/Plant (Ficus elastica)
  if (lower.includes("rubber") || lower.includes("ficus elastica") || 
      (lower.includes("ficus") && (lower.includes("elastica") || lower.includes("rubber")))) {
    return "Rubber Fig";
  }
  
  // Check for Orchid (Phalaenopsis, etc.)
  if (lower.includes("orchid") || lower.includes("phalaenopsis")) {
    return "Orchid";
  }
  
  // If not matched, return unknown
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
                "Identify if the plant in the photo is one of these types:\n" +
                "- Monstera (Monstera deliciosa)\n" +
                "- Pothos (also known as Devil's Ivy or Epipremnum aureum)\n" +
                "- Parlor Palm (Chamaedorea elegans or similar small palms)\n" +
                "- Peace Lily (Spathiphyllum)\n" +
                "- Rubber Plant/Fig (Ficus elastica)\n" +
                "- Orchid (Phalaenopsis or any orchid species)\n\n" +
                'Return ONLY valid JSON like {"species": "Monstera"} or {"species": "Pothos"}. ' +
                'If the plant does NOT match any of these categories or you are not at least 60% sure, ' +
                'respond with {"species": "unknown"}. ' +
                "Use the exact names listed above.",
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

    const speciesGuess = mapToPlantCategory(rawText);
    console.log("[classifyPlant] Categorized as:", speciesGuess);

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
