const prisma = require("../config/database");

/**
 * Generate dynamic sitemap.xml
 * This endpoint fetches all doctors, services, and published articles
 * and generates a sitemap with their URLs
 */
const generateSitemap = async (req, res) => {
  try {
    const siteUrl = process.env.SITE_URL || req.protocol + "://" + req.get("host");
    
    // Get all published articles (only published for public)
    const articles = await prisma.article.findMany({
      where: {
        published: true,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Get all doctors
    const doctors = await prisma.doctor.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Get all services
    const services = await prisma.service.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Format date for sitemap (YYYY-MM-DD)
    const formatDate = (date) => {
      return new Date(date).toISOString().split("T")[0];
    };

    // Static pages
    const staticPages = [
      { url: "/home", priority: "1.0", changefreq: "daily" },
      { url: "/about-us", priority: "0.8", changefreq: "monthly" },
      { url: "/contact", priority: "0.8", changefreq: "monthly" },
      { url: "/doctors", priority: "0.9", changefreq: "weekly" },
      { url: "/services", priority: "0.9", changefreq: "weekly" },
      { url: "/blog", priority: "0.9", changefreq: "daily" },
      { url: "/gallery", priority: "0.7", changefreq: "weekly" },
      { url: "/faq", priority: "0.7", changefreq: "monthly" },
      { url: "/become-doctor", priority: "0.6", changefreq: "monthly" },
    ];

    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`;

    // Add static pages
    staticPages.forEach((page) => {
      xml += `  <url>
    <loc>${siteUrl}${page.url}</loc>
    <lastmod>${formatDate(new Date())}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    });

    // Add doctors
    doctors.forEach((doctor) => {
      if (doctor.slug) {
        xml += `  <url>
    <loc>${siteUrl}/doctors/${doctor.slug}</loc>
    <lastmod>${formatDate(doctor.updatedAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }
    });

    // Add services
    services.forEach((service) => {
      if (service.slug) {
        xml += `  <url>
    <loc>${siteUrl}/services/${service.slug}</loc>
    <lastmod>${formatDate(service.updatedAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }
    });

    // Add articles
    articles.forEach((article) => {
      if (article.slug) {
        xml += `  <url>
    <loc>${siteUrl}/blog/${article.slug}</loc>
    <lastmod>${formatDate(article.updatedAt)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    });

    xml += `</urlset>`;

    // Set content type to XML
    res.set("Content-Type", "application/xml");
    res.send(xml);
  } catch (error) {
    console.error("Error generating sitemap:", error);
    res.status(500).json({
      success: false,
      message: "Error generating sitemap",
      error: error.message,
    });
  }
};

module.exports = {
  generateSitemap,
};

