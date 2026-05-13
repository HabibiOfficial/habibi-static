export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { text } = req.query;
  if (!text) return res.json({ status: false, msg: "Parameter 'text' diperlukan" });
  const safe = text.slice(0, 20).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500">
    <rect width="500" height="500" fill="#90ff00"/>
    <text x="250" y="250"
      font-family="Arial Narrow, Arial, sans-serif"
      font-size="72" font-weight="bold"
      fill="black" text-anchor="middle" dominant-baseline="middle"
      style="filter:blur(1.5px)">${safe}</text>
  </svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
}
