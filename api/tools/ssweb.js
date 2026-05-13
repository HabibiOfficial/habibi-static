export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { url } = req.query;
  if (!url) return res.json({ status: false, msg: "Parameter 'url' diperlukan" });
  try {
    const imgRes = await fetch(`https://image.thum.io/get/width/1280/crop/720/noanimate/${encodeURIComponent(url)}`);
    if (!imgRes.ok) throw new Error('Gagal screenshot');
    const buf = Buffer.from(await imgRes.arrayBuffer());
    res.setHeader('Content-Type', 'image/jpeg');
    res.send(buf);
  } catch (e) { res.json({ status: false, msg: e.message }); }
}
