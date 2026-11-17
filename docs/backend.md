# Portföy backend’i — ilk sürüm

VPS’te Caddy frontend dosyalarını sunar, aynı alan adındaki /api isteklerini Express’e iletir. Express PostgreSQL’e pg ile bağlanır. Claude frontend’i geliştirme sırasında örnek veriyle çalıştırabilir.

## Articles
Tablo alanları: id, benzersiz slug, title, excerpt, body_markdown, published_at. Boş yayın tarihi taslak anlamına gelir. Yalnız yayın tarihi gelmiş yazıları göster.
- GET /api/articles — tarihe göre azalan dizi. Alanlar slug, title, excerpt, publishedAt. Yazı yoksa 200 ve boş dizi.
- GET /api/articles/:slug — aynı alanlar ve bodyMarkdown. Taslak veya bulunamayan kayıt için 404.
- İlk yazıları SQL veya yayınlama betiğiyle ekle. Panel daha sonra.
- Slug sorgusunu parametreli yaz. Markdown’da ham HTML’i kapat. Hata yanıtlarına bağlantı bilgisi ekleme.
- /articles ve /articles/:slug doğrudan açılabilmeli, yenilemede de çalışmalı.

## Projeler
İlk sürümde vitrin yerel veri dosyasından beslenebilir. Projeleri redeploy olmadan değiştirmek veya backend pratiği yapmak istersen GET /api/projects ve GET /api/projects/:slug ekle. Liste alanları slug, title, summary, coverImage, displayOrder. Detay açıklamayı ve doğrulanmış bağlantıları içerir. API’ye geçilirse tek veri kaynağı kullan.

## Kontrol
Yayımlanmış yazı listede ve detayda açılmalı. Taslak listelenmemeli ve detay API’si 404 vermeli. Yazı API’si geçici olarak erişilemezse proje vitrini çalışmalı.
