import QRCode from 'qrcode';

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
};

async function fetchJson(url, opts = {}) {
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, ...opts });
  return r.json();
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────

async function dlTiktok(q) {
  const data = await fetchJson(`https://www.tikwm.com/api/?url=${encodeURIComponent(q.url)}&hd=1`);
  if (!data?.data) throw new Error('Gagal ambil data TikTok');
  const d = data.data;
  return { title: d.title, author: d.author?.nickname, duration: d.duration, play: d.play, wmplay: d.wmplay, music: d.music, cover: d.cover };
}

async function dlInstagram(q) {
  const sc = q.url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/)?.[2];
  if (!sc) throw new Error('URL Instagram tidak valid');
  const data = await fetchJson(`https://www.instagram.com/p/${sc}/?__a=1&__d=dis`, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Cookie': 'ig_did=1; csrftoken=1', 'X-IG-App-ID': '936619743392459' }
  });
  const m = data?.graphql?.shortcode_media || data?.items?.[0];
  if (!m) throw new Error('Gagal ambil data Instagram');
  return { type: m.__typename || 'GraphImage', url: m.video_url || m.display_url, thumbnail: m.display_url, caption: m.edge_media_to_caption?.edges?.[0]?.node?.text || '' };
}

async function dlYoutube(q) {
  const id = q.url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1];
  if (!id) throw new Error('URL YouTube tidak valid');
  const data = await fetchJson(`https://www.youtube.com/oembed?url=https://youtu.be/${id}&format=json`);
  return { title: data.title, author: data.author_name, thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`, videoId: id, watch: `https://youtu.be/${id}` };
}

async function dlFacebook(q) {
  const html = await fetch(q.url, { headers: { 'User-Agent': 'facebookexternalhit/1.1' } }).then(r => r.text());
  const hd = html.match(/hd_src(?:_no_ratelimit)?:"([^"]+)"/)?.[1]?.replace(/\\/g, '');
  const sd = html.match(/sd_src(?:_no_ratelimit)?:"([^"]+)"/)?.[1]?.replace(/\\/g, '');
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1] || 'Facebook Video';
  if (!hd && !sd) throw new Error('Gagal ambil video Facebook');
  return { title, hd, sd };
}

async function makerBrat(q, res) {
  const safe = q.text.slice(0, 20).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><rect width="500" height="500" fill="#90ff00"/><text x="250" y="250" font-family="Arial Narrow,Arial,sans-serif" font-size="72" font-weight="bold" fill="black" text-anchor="middle" dominant-baseline="middle" style="filter:blur(1.5px)">${safe}</text></svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  return res.send(svg);
}

async function makerQrcode(q, res) {
  const dataUrl = await QRCode.toDataURL(q.text, { width: 400, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
  res.setHeader('Content-Type', 'image/png');
  return res.send(buf);
}

async function makerNulis(q, res) {
  const words = q.text.slice(0, 80).split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > 22) { lines.push(cur.trim()); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur.trim());
  const lh = 55, h = Math.max(200, 80 + lines.length * lh);
  const lr = Array.from({ length: Math.ceil(h / lh) }, (_, i) =>
    `<line x1="30" y1="${50 + i * lh}" x2="470" y2="${50 + i * lh}" stroke="#c8b8a2" stroke-width="1"/>`).join('');
  const tr = lines.map((l, i) => `<text x="40" y="${80 + i * lh}" font-family="cursive" font-size="40" fill="#1a1a2e">${l.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</text>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="${h}"><rect width="500" height="${h}" fill="#fefae0"/>${lr}${tr}</svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  return res.send(svg);
}

async function toolsTranslate(q) {
  const data = await fetchJson(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(q.text)}&langpair=${q.from || 'autodetect'}|${q.to || 'id'}`);
  return { original: q.text, translated: data.responseData?.translatedText, from: q.from || 'auto', to: q.to || 'id' };
}

async function toolsShorturl(q) {
  const data = await fetchJson(`https://is.gd/create.php?format=json&url=${encodeURIComponent(q.url)}`);
  if (!data.shorturl) throw new Error('Gagal mempersingkat URL');
  return { original: q.url, short: data.shorturl };
}

async function toolsSsweb(q, res) {
  const imgRes = await fetch(`https://image.thum.io/get/width/1280/crop/720/noanimate/${encodeURIComponent(q.url)}`);
  if (!imgRes.ok) throw new Error('Gagal screenshot');
  const buf = Buffer.from(await imgRes.arrayBuffer());
  res.setHeader('Content-Type', 'image/jpeg');
  return res.send(buf);
}

async function searchTiktok(q) {
  const data = await fetchJson(
    `https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(q.query)}&count=${q.count || 10}&cursor=0&HD=1`
  );
  if (!data?.data?.videos) throw new Error('Tidak ada hasil');
  return data.data.videos.map(v => ({ id: v.video_id, title: v.title, play: v.play, cover: v.cover, duration: v.duration, author: v.author?.nickname }));
}

async function searchYoutube(q) {
  const html = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(q.query)}&hl=id`, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'id-ID,id;q=0.9' }
  }).then(r => r.text());
  const m = html.match(/var ytInitialData = ({.*?});<\/script>/s);
  if (!m) throw new Error('Gagal parse YouTube');
  const contents = JSON.parse(m[1])?.contents?.twoColumnSearchResultsRenderer?.primaryContents
    ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
  return contents.filter(c => c.videoRenderer).slice(0, 10).map(c => {
    const v = c.videoRenderer;
    return { id: v.videoId, title: v.title?.runs?.[0]?.text, url: `https://youtu.be/${v.videoId}`, thumbnail: `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`, duration: v.lengthText?.simpleText, views: v.viewCountText?.simpleText, channel: v.ownerText?.runs?.[0]?.text };
  });
}

async function infoCuaca(q) {
  const data = await fetchJson(`https://wttr.in/${encodeURIComponent(q.kota)}?format=j1`, { headers: { 'User-Agent': 'curl/7.0' } });
  const c = data?.current_condition?.[0];
  if (!c) throw new Error('Kota tidak ditemukan');
  return { kota: q.kota, suhu_c: c.temp_C + '°C', terasa_seperti: c.FeelsLikeC + '°C', kondisi: c.lang_id?.[0]?.value || c.weatherDesc?.[0]?.value || '-', kelembaban: c.humidity + '%', angin: c.windspeedKmph + ' km/h', visibilitas: c.visibility + ' km', uv_index: c.uvIndex };
}

async function infoKurs(q) {
  const from = q.from || 'USD', to = q.to || 'IDR';
  const data = await fetchJson(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
  if (data.error) throw new Error(data.error);
  const rate = data.rates?.[to.toUpperCase()];
  return { dari: from.toUpperCase(), ke: to.toUpperCase(), rate, tanggal: data.date, contoh: `1 ${from.toUpperCase()} = ${rate} ${to.toUpperCase()}` };
}

async function infoSholat(q) {
  const d = new Date();
  const data = await fetchJson(`https://api.aladhan.com/v1/timingsByCity/${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}?city=${encodeURIComponent(q.kota)}&country=Indonesia&method=11`);
  if (data.code !== 200) throw new Error('Kota tidak ditemukan');
  const t = data.data.timings;
  return { kota: q.kota, tanggal: data.data.date.readable, subuh: t.Fajr, terbit: t.Sunrise, dzuhur: t.Dhuhr, ashar: t.Asr, maghrib: t.Maghrib, isya: t.Isha };
}

// ─── ROUTER ───────────────────────────────────────────────────────────────────

const ROUTES = {
  '/api/download/tiktok':   { fn: dlTiktok,       req: ['url'] },
  '/api/download/instagram':{ fn: dlInstagram,     req: ['url'] },
  '/api/download/youtube':  { fn: dlYoutube,       req: ['url'] },
  '/api/download/facebook': { fn: dlFacebook,      req: ['url'] },
  '/api/maker/brat':        { fn: makerBrat,        req: ['text'], raw: true },
  '/api/maker/qrcode':      { fn: makerQrcode,      req: ['text'], raw: true },
  '/api/maker/nulis':       { fn: makerNulis,       req: ['text'], raw: true },
  '/api/tools/translate':   { fn: toolsTranslate,   req: ['text'] },
  '/api/tools/shorturl':    { fn: toolsShorturl,    req: ['url']  },
  '/api/tools/ssweb':       { fn: toolsSsweb,       req: ['url'],  raw: true },
  '/api/search/tiktok':     { fn: searchTiktok,     req: ['query'] },
  '/api/search/youtube':    { fn: searchYoutube,    req: ['query'] },
  '/api/info/cuaca':        { fn: infoCuaca,        req: ['kota']  },
  '/api/info/kurs':         { fn: infoKurs,         req: [] },
  '/api/info/sholat':       { fn: infoSholat,       req: ['kota']  },
};

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname.replace(/\/$/, '');
  const q = Object.fromEntries(url.searchParams.entries());

  const route = ROUTES[path];
  if (!route) return res.status(404).json({ status: false, msg: 'Endpoint tidak ditemukan' });

  // Check required params
  for (const p of route.req) {
    if (!q[p]) return res.status(400).json({ status: false, msg: `Parameter '${p}' diperlukan` });
  }

  try {
    if (route.raw) {
      await route.fn(q, res);
    } else {
      const data = await route.fn(q, res);
      res.json({ status: true, data });
    }
  } catch (e) {
    res.status(500).json({ status: false, msg: e.message });
  }
}
