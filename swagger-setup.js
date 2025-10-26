// Swagger UI Setup for Express
// Import and use this in your server.js

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

module.exports = (app) => {
  // Swagger Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API Documentation - سیستم مدیریت نوبت‌دهی کلینیک دندانپزشکی',
    customfavIcon: '/favicon.ico',
  }));
  
  console.log('📚 Swagger UI available at: http://localhost:4000/api-docs');
};

