# Yerel geliştirme sunucusu

Bağımlılık yok; yalnızca Node gerekir. Repo kökünden:

```bash
node dev/server.mjs              # http://localhost:5173, örnek veriyle
MOCK=slow  node dev/server.mjs   # API 1,5 sn gecikir → yükleme durumu
MOCK=empty node dev/server.mjs   # yayımlanmış yazı yok → boş liste
MOCK=error node dev/server.mjs   # API 500 döner → hata durumu
API_TARGET=http://localhost:3000 node dev/server.mjs   # /api → kendi Express sunucun
```

Windows PowerShell'de ortam değişkeni: `$env:MOCK="empty"; node dev/server.mjs`

## Ne yapar?

- `frontend/` klasörünü sunar, tarayıcı önbelleğini kapatır.
- `/articles/:slug` adreslerini `frontend/articles/article.html` sayfasına yönlendirir (yenilemede de açılır).
- `/api/articles` ve `/api/articles/:slug` uçlarını `docs/backend.md` sözleşmesine göre `sample-articles.mjs` içindeki örnek veriyle yanıtlar: taslak ve ileri tarihli yazılar listede yoktur, detayları 404 verir.
- Örnek veri döndüğünde `X-Data-Source: sample` başlığı gönderir; sayfa bunu görünce "Örnek veri" şeridini gösterir. Gerçek Express bu başlığı göndermediği için şerit yayında görünmez.

## Yayında (Caddy)

Bu sunucunun yaptığı üç işi yayında Caddy üstlenir: `frontend/` klasörünü sunmak, `/api/*` isteklerini Express'e iletmek ve `/articles/*` adreslerini `articles/article.html` sayfasına yönlendirmek.
