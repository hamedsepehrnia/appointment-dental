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
      // Critical fonts
      '</fonts/Estedad-Regular.woff2>; rel=preload; as=font; type=font/woff2; crossorigin',
      '</fonts/Estedad-SemiBold.woff2>; rel=preload; as=font; type=font/woff2; crossorigin',
      '</fonts/Estedad-Light.woff2>; rel=preload; as=font; type=font/woff2; crossorigin',
      // LCP image
      '</images/doctor_banner.png>; rel=preload; as=image; fetchpriority=high',
    ];

    res.setHeader('Link', preloadHeaders.join(', '));

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
