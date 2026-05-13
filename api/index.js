import QRCode from 'qrcode';
import sharp from 'sharp';

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
  const lower = q.text.slice(0, 80).toLowerCase().trim();
  const words = lower.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? cur + ' ' + w : w;
    if (next.length > 12 && cur) { lines.push(cur); cur = w; } else cur = next;
  }
  if (cur) lines.push(cur);
  const maxLen = Math.max(...lines.map(l => l.length));
  const fs = maxLen <= 3 ? 150 : maxLen <= 5 ? 130 : maxLen <= 8 ? 108 : maxLen <= 12 ? 85 : 68;
  const lh = Math.round(fs * 1.18);
  const startY = Math.round(fs * 0.85);
  const textEls = lines.map((line, i) => {
    const safe = line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return `<text x="26" y="${startY + i * lh}" font-family="DejaVu Sans,Arial,sans-serif" font-size="${fs}" font-weight="400" fill="#000000" filter="url(#bl)">${safe}</text>`;
  }).join('');
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500">` +
    `<defs><filter id="bl" x="-10%" y="-10%" width="130%" height="130%"><feGaussianBlur stdDeviation="1.8"/></filter></defs>` +
    `<rect width="500" height="500" fill="#ffffff"/>` +
    `${textEls}</svg>`
  );
  const png = await sharp(svg).png().toBuffer();
  res.setHeader('Content-Type', 'image/png');
  return res.send(png);
}

async function makerIqc(q, res) {
  const msg = q.text.slice(0, 200);
  const now = new Date();
  const time = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
  const W = 400;
  const words = msg.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? cur + ' ' + w : w;
    if (next.length > 28 && cur) { lines.push(cur); cur = w; } else cur = next;
  }
  if (cur) lines.push(cur);
  const maxCharLen = Math.max(...lines.map(l => l.length));
  const lineH = 22, bubblePad = 14;
  const bubbleH = bubblePad * 2 + lines.length * lineH + 20;
  const bubbleW = Math.min(300, Math.max(110, maxCharLen * 8.8 + bubblePad * 2 + 60));
  const menuW = 280;
  const reactionY = 18, reactionH = 52;
  const bubbleY = reactionY + reactionH + 14;
  const menuItems = [
    { label:'Beri Bintang', icon:'★' },
    { label:'Balas', icon:'↩' },
    { label:'Teruskan', icon:'↪' },
    { label:'Salin', icon:'⊡' },
    { label:'Laporkan', icon:'⚑' },
    { label:'Hapus', icon:'✕', red:true },
  ];
  const itemH = 52;
  const menuY = bubbleY + bubbleH + 10;
  const menuH = menuItems.length * itemH;
  const totalH = menuY + menuH + 18;
  const textRows = lines.map((line, i) => {
    const safe = line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return `<text x="${16+bubblePad}" y="${bubbleY+bubblePad+17+i*lineH}" font-size="15" fill="#e9edef">${safe}</text>`;
  }).join('');
  const emojis = ['👍','❤️','😂','😮','😢','🙏'];
  const emojiEls = emojis.map((e,i)=>`<text x="${26+i*38}" y="${reactionY+36}" font-size="22">${e.replace(/&/g,'&amp;')}</text>`).join('');
  const menuRows = menuItems.map((item, i) => {
    const y = menuY + i * itemH;
    const color = item.red ? '#ef5350' : '#e9edef';
    const div = i < menuItems.length - 1 ? `<line x1="16" y1="${y+itemH}" x2="${16+menuW}" y2="${y+itemH}" stroke="#374045" stroke-width="0.8"/>` : '';
    const safe = item.label.replace(/&/g,'&amp;');
    return `<text x="36" y="${y+33}" font-size="16" fill="${color}">${safe}</text><text x="${16+menuW-28}" y="${y+34}" font-size="18" fill="${color}">${item.icon}</text>${div}`;
  }).join('');
  const tailPath = `M ${16+bubbleW} ${bubbleY+12} L ${16+bubbleW+10} ${bubbleY+6} L ${16+bubbleW+2} ${bubbleY+20} Z`;
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${totalH}" font-family="DejaVu Sans,Arial,sans-serif">` +
    `<rect width="${W}" height="${totalH}" fill="#0b141a"/>` +
    `<rect x="14" y="${reactionY}" width="${emojis.length*38+16}" height="${reactionH}" rx="26" fill="#1f2c34" stroke="#374045" stroke-width="1"/>` +
    emojiEls +
    `<rect x="14" y="${bubbleY}" width="${bubbleW}" height="${bubbleH}" rx="8" fill="#005c4b"/>` +
    `<path d="${tailPath}" fill="#005c4b"/>` +
    textRows +
    `<text x="${16+bubbleW-bubblePad-32}" y="${bubbleY+bubbleH-8}" font-size="11" fill="#8aad9f">${time}</text>` +
    `<text x="${16+bubbleW-bubblePad-10}" y="${bubbleY+bubbleH-8}" font-size="12" fill="#53bdeb">✓✓</text>` +
    `<rect x="14" y="${menuY}" width="${menuW}" height="${menuH}" rx="12" fill="#1f2c34"/>` +
    menuRows +
    `</svg>`
  );
  const jpg = await sharp(svg).jpeg({ quality: 88 }).toBuffer();
  res.setHeader('Content-Type', 'image/jpeg');
  return res.send(jpg);
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
  // microlink.io: free, works from Vercel (thum.io blocks Vercel IPs)
  const ml = await fetchJson(`https://api.microlink.io/?url=${encodeURIComponent(q.url)}&screenshot=true&meta=false`);
  const ssUrl = ml?.data?.screenshot?.url;
  if (!ssUrl) throw new Error('Gagal mengambil screenshot');
  // Proxy image dari microlink CDN
  const imgRes = await fetch(ssUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!imgRes.ok) throw new Error('Gagal mengunduh screenshot');
  const buf = Buffer.from(await imgRes.arrayBuffer());
  res.setHeader('Content-Type', imgRes.headers.get('content-type') || 'image/png');
  return res.send(buf);
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';

async function groqChat(messages) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY tidak tersedia');
  const r = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: GROQ_MODEL, messages, max_tokens: 1024, temperature: 0.7 }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e?.error?.message || 'Groq API error');
  }
  const data = await r.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

async function aiChat(q) {
  const messages = [
    { role: 'system', content: q.system || 'Kamu adalah Habibi Bot, asisten AI yang ramah dan helpful. Jawab dalam bahasa Indonesia yang santai dan natural.' },
    { role: 'user', content: q.text },
  ];
  const reply = await groqChat(messages);
  return { text: q.text, reply };
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
  '/api/maker/iqc':         { fn: makerIqc,         req: ['text'], raw: true },
  '/api/tools/translate':   { fn: toolsTranslate,   req: ['text'] },
  '/api/tools/shorturl':    { fn: toolsShorturl,    req: ['url']  },
  '/api/tools/ssweb':       { fn: toolsSsweb,       req: ['url'],  raw: true },
  '/api/search/tiktok':     { fn: searchTiktok,     req: ['query'] },
  '/api/search/youtube':    { fn: searchYoutube,    req: ['query'] },
  '/api/info/cuaca':        { fn: infoCuaca,        req: ['kota']  },
  '/api/info/kurs':         { fn: infoKurs,         req: [] },
  '/api/info/sholat':       { fn: infoSholat,       req: ['kota']  },
  '/api/ai/chat':           { fn: aiChat,           req: ['text']  },
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
