export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { query, count = '10' } = req.query;
  if (!query) return res.json({ status: false, msg: "Parameter 'query' diperlukan" });
  try {
    const data = await fetch(
      `https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(query)}&count=${count}&cursor=0&HD=1`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    ).then(r => r.json());
    if (!data?.data?.videos) return res.json({ status: false, msg: "Tidak ada hasil" });
    res.json({
      status: true,
      data: data.data.videos.map(v => ({
        id: v.video_id, title: v.title, play: v.play,
        cover: v.cover, duration: v.duration, author: v.author?.nickname,
      }))
    });
  } catch (e) { res.json({ status: false, msg: e.message }); }
}
