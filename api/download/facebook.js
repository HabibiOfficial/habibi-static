export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { url } = req.query;
  if (!url) return res.json({ status: false, msg: "Parameter 'url' diperlukan" });
  try {
    const html = await fetch(url, { headers: { 'User-Agent': 'facebookexternalhit/1.1' } }).then(r => r.text());
    const hdMatch = html.match(/hd_src(?:_no_ratelimit)?:"([^"]+)"/);
    const sdMatch = html.match(/sd_src(?:_no_ratelimit)?:"([^"]+)"/);
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (!hdMatch && !sdMatch) return res.json({ status: false, msg: "Gagal ambil video Facebook" });
    res.json({
      status: true,
      data: {
        title: titleMatch?.[1] || 'Facebook Video',
        hd: hdMatch?.[1]?.replace(/\\/g, ''),
        sd: sdMatch?.[1]?.replace(/\\/g, ''),
      }
    });
  } catch (e) { res.json({ status: false, msg: e.message }); }
}
