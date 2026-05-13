# Habibi API

Image hosting sederhana untuk Habibi Bot, di-deploy di Vercel.

## Endpoints

| URL | Keterangan |
|-----|------------|
| `GET /` | Info API |
| `GET /img/menu.jpg` | Thumbnail menu bot |

## Deploy ke Vercel

1. Import repo ini di [vercel.com](https://vercel.com)
2. Deploy otomatis
3. Tambahkan domain custom di Settings → Domains

## Custom Domain (Cloudflare)

Di Cloudflare, tambah CNAME record:
- **Name**: `api`
- **Target**: `cname.vercel-dns.com`
- **Proxy**: DNS only (grey cloud)
