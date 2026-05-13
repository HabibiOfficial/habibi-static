export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { url } = req.query;
  if (!url) return res.json({ status: false, msg: "Parameter 'url' diperlukan" });
  try {
    const data = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`).then(r => r.json());
    if (!data.shorturl) return res.json({ status: false, msg: "Gagal mempersingkat URL" });
    res.json({ status: true, data: { original: url, short: data.shorturl } });
  } catch (e) { res.json({ status: false, msg: e.message }); }
}
