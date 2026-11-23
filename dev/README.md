# Yerel geliştirme

## Sayfalar nereden geliyor?

`frontend/` içindeki HTML sayfaları **üretilir**; elle düzenleme. Kaynakları `site/` klasöründe:

- `site/pages/` — sayfa şablonları (yapı)
- `site/i18n/tr.json`, `site/i18n/en.json` — tüm metinler (bir metni değiştirmek için burası)
- `site/partials/` — menü, alt bilgi gibi ortak parçalar
- `site/build.mjs` — şablonları iki dilde `frontend/` içine yazar: `node site/build.mjs`

Geliştirme sunucusu açılışta sayfaları üretir ve `site/` içinde bir dosya değişince yeniden üretir.

Adresler: Türkçe `/`, `/hakkimda`, `/iletisim`, `/projeler/…/` · İngilizce `/en/`, `/en/about`, `/en/contact`, `/en/projects/…/`

## Sunucu

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

- Sayfaları üretir, `frontend/` klasörünü sunar, tarayıcı önbelleğini kapatır.
- `/hakkimda` → `hakkimda.html` (temiz adres), `/hakkimda.html` → `/hakkimda` yönlendirmesi.
- `/articles/:slug` adreslerini `frontend/articles/article.html` sayfasına yönlendirir (yenilemede de açılır).
- `/api/articles` ve `/api/articles/:slug` uçlarını `docs/backend.md` sözleşmesine göre `sample-articles.mjs` içindeki örnek veriyle yanıtlar: taslak ve ileri tarihli yazılar listede yoktur, detayları 404 verir.
- Örnek veri döndüğünde `X-Data-Source: sample` başlığı gönderir; sayfa bunu görünce "Örnek veri" şeridini gösterir. Gerçek Express bu başlığı göndermediği için şerit yayında görünmez.

## Yayında: Cloudflare Pages

- Build command: `node site/build.mjs`
- Build output directory: `frontend`
- `/hakkimda` gibi adresleri Pages kendisi `hakkimda.html` dosyasından sunar; `/articles/*` yönlendirmesi `frontend/_redirects` içinde.

## İleride VPS'te (Caddy)

Bu sunucunun yaptığı işleri Caddy üstlenir: `frontend/` klasörünü sunmak (`try_files {path} {path}.html {path}/index.html`), `/api/*` isteklerini Express'e iletmek ve `/articles/*` adreslerini `articles/article.html` sayfasına yönlendirmek.
