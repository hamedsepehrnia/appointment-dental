const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

// Use DATABASE_URL directly for PostgreSQL connection
const sessionStore = new pgSession({
  conString: process.env.DATABASE_URL,
  tableName: 'sessions',
  createTableIfMissing: true,
});

const sessionConfig = {
  store: sessionStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'dental.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: 'lax',
  },
};

module.exports = sessionConfig;

