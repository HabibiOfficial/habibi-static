export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { text } = req.query;
  if (!text) return res.json({ status: false, msg: "Parameter 'text' diperlukan" });
  const words = text.slice(0, 80).split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > 22) { lines.push(current.trim()); current = word; }
    else current = (current + ' ' + word).trim();
  }
  if (current) lines.push(current.trim());
  const lh = 55, h = Math.max(200, 80 + lines.length * lh);
  const lineRows = Array.from({ length: Math.ceil(h / lh) }, (_, i) =>
    `<line x1="30" y1="${50 + i * lh}" x2="470" y2="${50 + i * lh}" stroke="#c8b8a2" stroke-width="1"/>`
  ).join('');
  const textRows = lines.map((line, i) => {
    const safe = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<text x="40" y="${80 + i * lh}" font-family="cursive" font-size="40" fill="#1a1a2e">${safe}</text>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="${h}">
    <rect width="500" height="${h}" fill="#fefae0"/>
    ${lineRows}${textRows}
  </svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
}
