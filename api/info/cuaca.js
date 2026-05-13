export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { kota } = req.query;
  if (!kota) return res.json({ status: false, msg: "Parameter 'kota' diperlukan" });
  try {
    const data = await fetch(
      `https://wttr.in/${encodeURIComponent(kota)}?format=j1`,
      { headers: { 'User-Agent': 'curl/7.0' } }
    ).then(r => r.json());
    const c = data?.current_condition?.[0];
    if (!c) return res.json({ status: false, msg: "Kota tidak ditemukan" });
    res.json({
      status: true,
      data: {
        kota,
        suhu_c: c.temp_C + '°C',
        terasa_seperti: c.FeelsLikeC + '°C',
        kondisi: c.lang_id?.[0]?.value || c.weatherDesc?.[0]?.value || '-',
        kelembaban: c.humidity + '%',
        angin: c.windspeedKmph + ' km/h',
        visibilitas: c.visibility + ' km',
        uv_index: c.uvIndex,
      }
    });
  } catch (e) { res.json({ status: false, msg: e.message }); }
}
