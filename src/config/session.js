const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

// Parse DATABASE_URL for MySQL connection
const parseDbUrl = (url) => {
  const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
  const match = url.match(regex);
  if (match) {
    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: parseInt(match[4]),
      database: match[5],
    };
  }
  throw new Error('Invalid DATABASE_URL format');
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

