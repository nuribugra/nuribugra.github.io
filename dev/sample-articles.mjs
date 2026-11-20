// ÖRNEK VERİ — yalnızca yerel geliştirme içindir, yayına çıkmaz.
// Alanlar PostgreSQL tablosuyla aynı: id, slug, title, excerpt, body_markdown, published_at.
// published_at = null → taslak. Gelecek tarih → henüz yayımlanmamış. İkisi de listede görünmemeli.

const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString();
const daysLater = (n) => new Date(Date.now() + n * 864e5).toISOString();

export const sampleArticles = [
  {
    id: 1,
    slug: "express-ile-ilk-endpoint",
    title: "Express ile ilk endpoint",
    excerpt: "Bir isteğin Express'e ulaşıp JSON yanıt olarak geri dönmesine kadar geçen yolu adım adım izliyorum.",
    body_markdown: `Bu bir **örnek yazıdır**; gerçek içerik backend hazır olduğunda veritabanından gelecek.

## İstek nereden geliyor?

Tarayıcı \`/api/articles\` adresine istek atıyor. Caddy bu isteği Express'e iletiyor, Express de uygun route'u çalıştırıyor.

\`\`\`ts
app.get("/api/articles", async (_req, res) => {
  const { rows } = await pool.query(
    \`SELECT slug, title, excerpt, published_at AS "publishedAt"
       FROM articles WHERE published_at <= now() ORDER BY published_at DESC\`
  );
  res.json(rows);
});
\`\`\`

## Dikkat ettiğim noktalar

- Yazı yoksa yine **200** ve boş dizi döner.
- Taslaklar listeye girmez.
- Hata yanıtında bağlantı bilgisi yer almaz.

> Ham HTML bu sayfada çalıştırılmaz: <b>bu etiket kalın görünmemeli</b>.

Ayrıntılar için [Express belgeleri](https://expressjs.com/).`,
    published_at: daysAgo(3),
  },
  {
    id: 2,
    slug: "postgresqlde-parametreli-sorgular",
    title: "PostgreSQL'de parametreli sorgular",
    excerpt: "Kullanıcıdan gelen değeri sorguya doğrudan eklemek yerine neden parametre kullandığımı anlatıyorum.",
    body_markdown: `Bu bir **örnek yazıdır**.

Slug'a göre yazı getirirken değeri sorgu metnine eklemiyorum, parametre olarak gönderiyorum:

\`\`\`ts
const { rows } = await pool.query(
  \`SELECT slug, title, excerpt, published_at AS "publishedAt", body_markdown AS "bodyMarkdown"
     FROM articles WHERE slug = $1 AND published_at <= now()\`,
  [req.params.slug]
);
if (rows.length === 0) return res.status(404).json({ error: "Yazı bulunamadı" });
\`\`\`

Böylece slug içinde ne gelirse gelsin, veritabanı onu yalnızca bir değer olarak görür.`,
    published_at: daysAgo(12),
  },
  {
    id: 3,
    slug: "caddy-ile-tek-alan-adi",
    title: "Caddy ile tek alan adında frontend ve API",
    excerpt: "Statik dosyalar ve /api istekleri aynı alan adından nasıl sunulur, kısa bir yapılandırma notu.",
    body_markdown: `Bu bir **örnek yazıdır**.

1. Statik dosyalar \`frontend\` klasöründen sunulur.
2. \`/api/*\` istekleri Express'e iletilir.
3. \`/articles/:slug\` adresleri yazı sayfasına yönlendirilir; böylece sayfa yenilendiğinde de açılır.`,
    published_at: daysAgo(30),
  },
  {
    id: 4,
    slug: "taslak-yazi",
    title: "Taslak: henüz yayımlanmadı",
    excerpt: "Bu yazı taslak olduğu için listede görünmemeli ve detay adresi 404 vermeli.",
    body_markdown: "Taslak içerik.",
    published_at: null,
  },
  {
    id: 5,
    slug: "ileri-tarihli-yazi",
    title: "İleri tarihli yazı",
    excerpt: "Yayın tarihi gelmediği için görünmemeli.",
    body_markdown: "Gelecekte yayımlanacak içerik.",
    published_at: daysLater(5),
  },
];
