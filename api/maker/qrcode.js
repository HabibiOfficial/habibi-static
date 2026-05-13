import QRCode from 'qrcode';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { text } = req.query;
  if (!text) return res.json({ status: false, msg: "Parameter 'text' diperlukan" });
  try {
    const dataUrl = await QRCode.toDataURL(text, { width: 400, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
    const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
    res.setHeader('Content-Type', 'image/png');
    res.send(buf);
  } catch (e) { res.json({ status: false, msg: e.message }); }
}
