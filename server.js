const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, '../data/eventos-finais.db');

// Middleware
app.use(cors());
app.use(express.json());

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize empty database if it doesn't exist
if (!fs.existsSync(DB_PATH)) {
  const sqlite3 = require('sqlite3').verbose();
  const db = new sqlite3.Database(DB_PATH);
  
  // Create tables (same schema as db-worker.ts)
  db.exec(`
    CREATE TABLE IF NOT EXISTS chapters (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT,
      content TEXT,
      audio_url TEXT,
      order_index INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY,
      chapter_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      order_index INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chapter_pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chapter_id INTEGER NOT NULL,
      subtitle TEXT,
      page_number INTEGER NOT NULL,
      content TEXT NOT NULL,
      order_index INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
    );
  `);
  
  db.close();
  console.log('Database initialized:', DB_PATH);
}

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes

// Get database file
app.get('/api/db', (req, res) => {
  if (!fs.existsSync(DB_PATH)) {
    return res.status(404).json({ error: 'Database not found' });
  }
  
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename="eventos-finais.db"');
  res.sendFile(DB_PATH);
});

// Upload database (admin only - you should add authentication)
app.post('/api/db', upload.single('database'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Backup current database
    if (fs.existsSync(DB_PATH)) {
      const backupPath = DB_PATH.replace('.db', '.backup.db');
      fs.copyFileSync(DB_PATH, backupPath);
    }

    // Write new database
    fs.writeFileSync(DB_PATH, req.file.buffer);
    
    res.json({ 
      success: true, 
      message: 'Database uploaded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload database' });
  }
});

// Get database timestamp
app.get('/api/db/timestamp', (req, res) => {
  if (!fs.existsSync(DB_PATH)) {
    return res.json({ timestamp: 0 });
  }
  
  const stats = fs.statSync(DB_PATH);
  res.json({ 
    timestamp: stats.mtime.getTime(),
    size: stats.size
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: fs.existsSync(DB_PATH) ? 'exists' : 'not found'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database path: ${DB_PATH}`);
  console.log(`API endpoints:`);
  console.log(`  GET  /api/db - Download database`);
  console.log(`  POST /api/db - Upload database`);
  console.log(`  GET  /api/db/timestamp - Get database timestamp`);
  console.log(`  GET  /api/health - Health check`);
});
