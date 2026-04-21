require('dotenv').config();
const app = require('./app');
const { getConnection } = require('./config');

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Test database connection
    await getConnection();
    console.log('Database connected successfully');

    // Start server
    app.listen(PORT, () => {
      console.log(`Assetra server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
