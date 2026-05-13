export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { from = 'USD', to = 'IDR' } = req.query;
  try {
    const data = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`).then(r => r.json());
    if (data.error) return res.json({ status: false, msg: data.error });
    const rate = data.rates?.[to.toUpperCase()];
    res.json({
      status: true,
      data: {
        dari: from.toUpperCase(), ke: to.toUpperCase(), rate,
        tanggal: data.date,
        contoh: `1 ${from.toUpperCase()} = ${rate} ${to.toUpperCase()}`,
      }
    });
  } catch (e) { res.json({ status: false, msg: e.message }); }
}
