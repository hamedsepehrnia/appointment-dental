/**
 * Performance optimization middleware
 * Sets optimal HTTP headers for static assets, preloading, and caching
 */

const performanceHeaders = (req, res, next) => {
  // Only apply to HTML responses (index.html)
  const isHtmlRequest = 
    req.path === "/" || 
    !req.path.includes(".") || 
    req.path.endsWith(".html");

  if (isHtmlRequest) {
    // Preload critical resources
    const preloadHeaders = [
      // Critical fonts - only the most essential
      '</fonts/Estedad-Regular.woff2>; rel=preload; as=font; type=font/woff2; crossorigin',
      // LCP image - CRITICAL for performance
      '</images/doctor_banner.webp>; rel=preload; as=image; fetchpriority=high; imagesrcset="/images/doctor_banner-640.webp 640w, /images/doctor_banner-1024.webp 1024w, /images/doctor_banner.webp 1920w"; imagesizes="100vw"',
    ];

    res.setHeader('Link', preloadHeaders.join(', '));
    
    // Add resource hints for faster DNS/connection
    res.setHeader('X-DNS-Prefetch-Control', 'on');

    // Early hints (103 status) - only if supported and not already sent
    // Note: writeEarlyHints needs specific format and is not widely supported yet
    // Disable for now to avoid errors
    /*
    if (typeof res.writeEarlyHints === 'function' && !res.headersSent) {
      try {
        res.writeEarlyHints({
          link: preloadHeaders
        });
      } catch (err) {
        // Silently fail - not all Node.js versions support this
        console.warn('Early hints not supported:', err.message);
      }
    }
    */

    // Security headers for HTML
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Cache-Control for HTML (must revalidate)
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};

module.exports = performanceHeaders;
