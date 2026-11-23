// Vitrin verisi, iki dilde. Alan adları backend.md'deki GET /api/projects sözleşmesine uyar
// (slug, title, summary, coverImage, displayOrder). Diğer alanlar yalnızca vitrin içindir.
// API'ye geçildiğinde bu dosya silinip aynı biçimde /api/projects?lang=tr|en'den okunur — tek veri kaynağı.

const shared = {
  "haus-pera": {
    slug: "haus-pera",
    title: "Haus Pera Coffee",
    stack: ["Next.js", "PostgreSQL"],
    orientation: "portrait",
    coverImage: "/assets/img/haus-pera-menu.webp", // canlı menünün gerçek ekran görüntüsü (Kasım 2026)
    coverSize: [921, 1718],
    displayOrder: 1,
  },
  jakovs: {
    slug: "jakovs",
    title: "Jakovs Coffee",
    stack: [],
    orientation: "landscape",
    coverImage: "/assets/img/jakovs-home-1900.webp",
    coverSrcset: "/assets/img/jakovs-home-960.webp 960w, /assets/img/jakovs-home-1900.webp 1900w",
    coverSize: [1900, 862],
    displayOrder: 2,
  },
};

export const projectsByLang = {
  tr: [
    {
      ...shared["haus-pera"],
      href: "/projeler/haus-pera/",
      subtitle: "QR Menü",
      kind: "Müşteri işi",
      summary:
        "Misafirlerin masadaki QR kodla telefondan açtığı dijital menü. Kategorilere ayrılmış ve aranabilir; fiyatları işletme kendi yönetim panelinden güncelliyor.",
      coverAlt: "Haus Pera Coffee QR menüsünün mobil ekranı",
    },
    {
      ...shared.jakovs,
      href: "/projeler/jakovs/",
      subtitle: "Web sitesi yenilemesi",
      kind: null,
      summary:
        "Turhost üzerinden alınmış hazır sitenin, mekânın sıcak atmosferi ve taş rölyeflerinden yola çıkılarak yeniden düzenlenmesi; görsel hiyerarşi ve galeri baştan kuruldu.",
      coverAlt: "Jakovs Coffee web sitesinin ana sayfası",
    },
  ],
  en: [
    {
      ...shared["haus-pera"],
      href: "/en/projects/haus-pera/",
      subtitle: "QR Menu",
      kind: "Client work",
      summary:
        "A digital menu guests open on their phones by scanning the QR code on their table. Organised by category and searchable, with prices the business updates from its own management panel.",
      coverAlt: "The Haus Pera Coffee QR menu on a phone",
    },
    {
      ...shared.jakovs,
      href: "/en/projects/jakovs/",
      subtitle: "Website redesign",
      kind: null,
      summary:
        "A template website bought through Turhost, reworked around the venue's warm atmosphere and stone reliefs, with the visual hierarchy and gallery rebuilt from scratch.",
      coverAlt: "The Jakovs Coffee website home page",
    },
  ],
};
