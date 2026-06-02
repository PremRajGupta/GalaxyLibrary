import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// ===== Sequelize Instance (MySQL Connection) =====
const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'library_management',
  process.env.MYSQL_USER     || 'root',
  process.env.MYSQL_PASSWORD || '',
  {
    host:    process.env.MYSQL_HOST || 'localhost',
    port:    Number(process.env.MYSQL_PORT) || 3306,
    dialect: 'mysql',

    // Set to console.log to see every SQL query in the terminal
    logging: false,

    pool: {
      max:     10,   // Maximum concurrent connections
      min:     0,
      acquire: 30000, // Max ms to acquire a connection before throwing
      idle:    10000  // Max ms a connection can be idle before release
    },

    define: {
      charset:   'utf8mb4',
      collate:   'utf8mb4_unicode_ci',
      timestamps: true // adds createdAt + updatedAt to every table
    }
  }
);

// ===== Connect & Sync Helper =====
export const connectMySQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Connected to MySQL database successfully.');

    // sync({ alter: true }) adds missing columns but never drops existing data
    await sequelize.sync({ alter: true });
    console.log('✓ MySQL tables synchronized.\n');
  } catch (error) {
    console.warn('⚠ MySQL connection failed. Retrying in 5 seconds...');
    console.warn(`  Error: ${error.message}`);
    setTimeout(connectMySQL, 5000);
  }
};

export default sequelize;
