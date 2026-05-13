export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { url } = req.query;
  if (!url) return res.json({ status: false, msg: "Parameter 'url' diperlukan" });
  try {
    const videoId = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1];
    if (!videoId) return res.json({ status: false, msg: "URL YouTube tidak valid" });
    const data = await fetch(`https://www.youtube.com/oembed?url=https://youtu.be/${videoId}&format=json`).then(r => r.json());
    res.json({
      status: true,
      data: {
        title: data.title, author: data.author_name,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        videoId, watch: `https://youtu.be/${videoId}`,
      }
    });
  } catch (e) { res.json({ status: false, msg: e.message }); }
}
