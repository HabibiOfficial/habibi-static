export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { url } = req.query;
  if (!url) return res.json({ status: false, msg: "Parameter 'url' diperlukan" });
  try {
    const data = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }).then(r => r.json());
    if (!data?.data) return res.json({ status: false, msg: "Gagal ambil data TikTok" });
    const d = data.data;
    res.json({
      status: true,
      data: {
        title: d.title, author: d.author?.nickname,
        duration: d.duration, play: d.play, wmplay: d.wmplay,
        music: d.music, cover: d.cover,
      }
    });
  } catch (e) { res.json({ status: false, msg: e.message }); }
}
