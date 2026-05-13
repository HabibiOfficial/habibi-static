export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { text, to = 'id', from = 'autodetect' } = req.query;
  if (!text) return res.json({ status: false, msg: "Parameter 'text' diperlukan" });
  try {
    const data = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`
    ).then(r => r.json());
    res.json({
      status: true,
      data: { original: text, translated: data.responseData?.translatedText, from, to }
    });
  } catch (e) { res.json({ status: false, msg: e.message }); }
}
