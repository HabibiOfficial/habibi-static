export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { query } = req.query;
  if (!query) return res.json({ status: false, msg: "Parameter 'query' diperlukan" });
  try {
    const html = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=id`,
      { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'id-ID,id;q=0.9' } }
    ).then(r => r.text());
    const match = html.match(/var ytInitialData = ({.*?});<\/script>/s);
    if (!match) return res.json({ status: false, msg: "Gagal parse YouTube" });
    const ytData = JSON.parse(match[1]);
    const contents = ytData?.contents?.twoColumnSearchResultsRenderer
      ?.primaryContents?.sectionListRenderer?.contents?.[0]
      ?.itemSectionRenderer?.contents || [];
    const results = contents.filter(c => c.videoRenderer).slice(0, 10).map(c => {
      const v = c.videoRenderer;
      return {
        id: v.videoId, title: v.title?.runs?.[0]?.text,
        url: `https://youtu.be/${v.videoId}`,
        thumbnail: `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`,
        duration: v.lengthText?.simpleText,
        views: v.viewCountText?.simpleText,
        channel: v.ownerText?.runs?.[0]?.text,
      };
    });
    res.json({ status: true, data: results });
  } catch (e) { res.json({ status: false, msg: e.message }); }
}
