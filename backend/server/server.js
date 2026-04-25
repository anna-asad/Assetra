require('dotenv').config();
const app = require('./app');
const { getConnection } = require('./config');

const PORT = 3001;

async function startServer() {
  try {
    // Test database connection
    await getConnection();
    console.log('Database connected successfully');

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`Assetra server running on http://localhost:${PORT}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use.`);
        console.error('Please either:');
        console.error(`  1. Stop the other process using port ${PORT}, or`);
        console.error(`  2. Change the PORT in your .env file (e.g., PORT=3001)`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
