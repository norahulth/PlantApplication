export default async function handler(req, res) {
  try {
    const { species } = req.query;
    if (!species) {
      return res.status(400).json({ error: 'Missing species' });
    }

    const key = process.env.PERENUAL_KEY;

    //
    // 1. Look up by name to get the plant ID
    //
    const listUrl = `https://perenual.com/api/v2/species-list?key=${key}&q=${encodeURIComponent(species)}`;
    const listRes = await fetch(listUrl);

    if (!listRes.ok) {
      return res
        .status(listRes.status)
        .json({ error: 'Failed to fetch species list from Perenual' });
    }

    const listData = await listRes.json();

    const first = Array.isArray(listData.data) && listData.data.length > 0
      ? listData.data[0]
      : null;

    if (!first) {
      // no match at all
      return res.status(200).json({
        water: 'unknown',
        sun: 'unknown'
      });
    }

    const plantId = first.id;

    //
    // 2. Fetch full care details for that plant ID
    //
    // per your screenshot, the correct endpoint is:
    // GET https://perenual.com/api/v2/species/details/[ID]?key=YOUR-API-KEY
    //
    const detailUrl = `https://perenual.com/api/v2/species/details/${plantId}?key=${key}`;
    const detailRes = await fetch(detailUrl);

    if (!detailRes.ok) {
      // couldn't get details -> still return something predictable
      return res.status(200).json({
        water: 'unknown',
        sun: 'unknown'
      });
    }

    const detailData = await detailRes.json();

    // sunlight can be an array like ["Part shade", "Full sun"]
    let sunValue = detailData.sunlight;
    if (Array.isArray(sunValue)) {
      sunValue = sunValue.join(', ');
    }

    const waterValue =
      detailData.watering ||
      // fallback to benchmark text if watering isn't a simple string
      (detailData.watering_general_benchmark
        ? `${detailData.watering_general_benchmark.value} ${detailData.watering_general_benchmark.unit}`
        : null);

    return res.status(200).json({
      water: waterValue || 'unknown',
      sun: sunValue || 'unknown'
    });

  } catch (err) {
    console.error('getCare error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
