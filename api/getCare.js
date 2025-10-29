export default async function handler(req, res) {
  try {
    const { species } = req.query;
    console.log('🔍 Incoming species:', species);

    if (!species) {
      console.warn('⚠️ Missing species parameter');
      return res.status(400).json({ error: 'Missing species' });
    }

    const key = process.env.PERENUAL_KEY;

    console.log('🌐 Fetching species list...');
    const listUrl = `https://perenual.com/api/v2/species-list?key=${key}&q=${encodeURIComponent(species)}`;
    const listRes = await fetch(listUrl);
    console.log('🪴 species-list status:', listRes.status);

    const listData = await listRes.json();
    console.log('🪴 species-list result:', JSON.stringify(listData, null, 2).slice(0, 300) + '...');

    const first = Array.isArray(listData.data) && listData.data.length > 0
      ? listData.data[0]
      : null;

    if (!first) {
      console.warn('⚠️ No plant match found for', species);
      return res.status(200).json({ water: 'unknown', sun: 'unknown' });
    }

    const plantId = first.id;
    console.log(`🌿 Found plant ID: ${plantId}`);

    const detailUrl = `https://perenual.com/api/v2/species/details/${plantId}?key=${key}`;
    console.log('🌐 Fetching details from:', detailUrl);

    const detailRes = await fetch(detailUrl);
    console.log('🔎 details status:', detailRes.status);

    if (!detailRes.ok) {
      console.error('❌ Failed to fetch plant details');
      return res.status(200).json({ water: 'unknown', sun: 'unknown' });
    }

    const detailData = await detailRes.json();
    console.log('🌞 details data:', JSON.stringify(detailData, null, 2).slice(0, 300) + '...');

    let sunValue = Array.isArray(detailData.sunlight)
      ? detailData.sunlight.join(', ')
      : detailData.sunlight;
    const waterValue =
      detailData.watering ||
      (detailData.watering_general_benchmark
        ? `${detailData.watering_general_benchmark.value} ${detailData.watering_general_benchmark.unit}`
        : 'unknown');

    console.log('✅ Parsed care:', { water: waterValue, sun: sunValue });

    return res.status(200).json({
      water: waterValue || 'unknown',
      sun: sunValue || 'unknown'
    });
  } catch (err) {
    console.error('💥 getCare error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
