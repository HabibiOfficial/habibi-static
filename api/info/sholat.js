export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { kota } = req.query;
  if (!kota) return res.json({ status: false, msg: "Parameter 'kota' diperlukan" });
  try {
    const d = new Date();
    const data = await fetch(
      `https://api.aladhan.com/v1/timingsByCity/${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}?city=${encodeURIComponent(kota)}&country=Indonesia&method=11`
    ).then(r => r.json());
    if (data.code !== 200) return res.json({ status: false, msg: "Kota tidak ditemukan" });
    const t = data.data.timings;
    res.json({
      status: true,
      data: {
        kota, tanggal: data.data.date.readable,
        subuh: t.Fajr, terbit: t.Sunrise, dzuhur: t.Dhuhr,
        ashar: t.Asr, maghrib: t.Maghrib, isya: t.Isha,
      }
    });
  } catch (e) { res.json({ status: false, msg: e.message }); }
}
