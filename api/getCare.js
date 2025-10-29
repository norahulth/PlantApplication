export default async function handler(req, res) {
  try {
    const { species } = req.query;
    if (!species) {
      return res.status(400).json({ error: 'Missing species' });
    }

    const url = `https://perenual.com/api/v2/species-list?key=${process.env.PERENUAL_KEY}&q=${encodeURIComponent(species)}`;

    const apiRes = await fetch(url);

    if (!apiRes.ok) {
      return res
        .status(apiRes.status)
        .json({ error: 'Failed to fetch from Perenual' });
    }

    const data = await apiRes.json();

    // 🔍 TEMP DEBUG LOG:
    console.log('Perenual raw data for', species, JSON.stringify(data, null, 2));

    const first = Array.isArray(data.data) && data.data.length > 0
      ? data.data[0]
      : null;

    if (!first) {
      return res.status(200).json({
        water: 'unknown',
        sun: 'unknown'
      });
    }

    // more debug while we're here:
    console.log('First match fields:', {
      watering: first.watering,
      sunlight: first.sunlight
    });

    let sunValue = first.sunlight;
    if (Array.isArray(sunValue)) {
      sunValue = sunValue.join(', ');
    }

    return res.status(200).json({
      water: first.watering || 'unknown',
      sun: sunValue || 'unknown'
    });
  } catch (err) {
    console.error('getCare error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
