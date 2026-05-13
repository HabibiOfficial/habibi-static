export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { url } = req.query;
  if (!url) return res.json({ status: false, msg: "Parameter 'url' diperlukan" });
  try {
    const shortcode = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/)?.[2];
    if (!shortcode) return res.json({ status: false, msg: "URL Instagram tidak valid" });
    const data = await fetch(`https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Cookie': 'ig_did=1; csrftoken=1', 'X-IG-App-ID': '936619743392459' }
    }).then(r => r.json());
    const media = data?.graphql?.shortcode_media || data?.items?.[0];
    if (!media) return res.json({ status: false, msg: "Gagal ambil data Instagram" });
    res.json({
      status: true,
      data: {
        type: media.__typename || 'GraphImage',
        url: media.video_url || media.display_url,
        thumbnail: media.display_url,
        caption: media.edge_media_to_caption?.edges?.[0]?.node?.text || '',
      }
    });
  } catch (e) { res.json({ status: false, msg: e.message }); }
}
