const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

// Parse DATABASE_URL for MySQL connection
const parseDbUrl = (url) => {
  const parsedUrl = new URL(url);
  return {
    user: parsedUrl.username,
    password: parsedUrl.password,
    host: parsedUrl.hostname,
    port: parseInt(parsedUrl.port) || 3306,
    database: parsedUrl.pathname.slice(1), // Remove leading '/'
  };
};

const dbConfig = parseDbUrl(process.env.DATABASE_URL);

const sessionStore = new MySQLStore({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  createDatabaseTable: true,
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
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

