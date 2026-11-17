// Vitrin verisi. Alan adları backend.md'deki GET /api/projects sözleşmesine uyar
// (slug, title, summary, coverImage, displayOrder). Diğer alanlar yalnızca vitrin içindir.
// API'ye geçildiğinde bu dosya silinip aynı biçimde /api/projects'ten okunur — tek veri kaynağı.

export const projects = [
  {
    slug: "haus-pera",
    title: "Haus Pera Coffee",
    subtitle: "QR Menü",
    summary:
      "Misafirlerin masadaki QR kodla telefondan açtığı dijital menü. Kategorilere ayrılmış ve aranabilir; fiyatları işletme kendi yönetim panelinden güncelliyor.",
    kind: "Müşteri işi",
    stack: ["Next.js", "PostgreSQL"],
    orientation: "portrait",
    // Canlı menünün gerçek mobil ekran görüntüsü (Kasım 2026).
    coverImage: "assets/img/haus-pera-menu.webp",
    coverSize: [921, 1718],
    coverAlt: "Haus Pera Coffee QR menüsünün mobil ekranı",
    displayOrder: 1,
  },
  {
    slug: "jakovs",
    title: "Jakovs Coffee",
    subtitle: "Web sitesi yenilemesi",
    summary:
      "Turhost üzerinden alınmış hazır sitenin, mekânın sıcak atmosferi ve taş rölyeflerinden yola çıkılarak yeniden düzenlenmesi; görsel hiyerarşi ve galeri baştan kuruldu.",
    kind: null, // Müşteri işi mi, staj mı? Buğra doğrulayınca eklenecek.
    stack: [], // Teknolojiler ve katkı kapsamı Buğra tarafından doğrulanınca eklenecek.
    orientation: "landscape",
    coverImage: "assets/img/jakovs-home-1900.webp",
    coverSrcset: "assets/img/jakovs-home-960.webp 960w, assets/img/jakovs-home-1900.webp 1900w",
    coverSize: [1900, 862],
    coverAlt: "Jakovs Coffee web sitesinin ana sayfası",
    displayOrder: 2,
  },
];
