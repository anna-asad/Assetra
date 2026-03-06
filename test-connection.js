require('dotenv').config();
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

console.log('Testing connection with:');
console.log('Server:', config.server);
console.log('Database:', config.database);
console.log('User:', config.user);
console.log('Port:', config.port);
console.log('\nAttempting to connect...\n');

async function testConnection() {
  try {
    const pool = await sql.connect(config);
    console.log('✓ Successfully connected to SQL Server!');
    
    const result = await pool.request().query('SELECT @@VERSION as version');
    console.log('\nSQL Server Version:');
    console.log(result.recordset[0].version);
    
    const dbTest = await pool.request().query('SELECT DB_NAME() as current_db');
    console.log('\nCurrent Database:', dbTest.recordset[0].current_db);
    
    await pool.close();
    console.log('\n✓ Connection test successful!');
  } catch (err) {
    console.error('✗ Connection failed!');
    console.error('\nError details:');
    console.error('Message:', err.message);
    console.error('Code:', err.code);
    console.error('\nCommon solutions:');
    console.log('1. Enable TCP/IP in SQL Server Configuration Manager');
    console.log('2. Check if SQL Server Browser service is running');
    console.log('3. Verify firewall allows port 1433');
    console.log('4. Try using "localhost\\SQLEXPRESS" or your instance name');
    console.log('5. Check if SQL Server Authentication is enabled');
  }
}

testConnection();
