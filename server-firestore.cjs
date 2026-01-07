require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const admin = require('firebase-admin');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Local uploads directory
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'audio');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Initialize Firebase Admin SDK
// Option 1: Use service account JSON file (production)
// Option 2: Use environment variables (local dev)
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';

try {
  // Try to use service account file first
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (fileError) {
    // Fall back to environment variables
    console.log('[Firebase Init] Checking environment variables...');
    console.log('[Firebase Init] Has FIREBASE_PROJECT_ID:', !!process.env.FIREBASE_PROJECT_ID);
    console.log('[Firebase Init] Has FIREBASE_CLIENT_EMAIL:', !!process.env.FIREBASE_CLIENT_EMAIL);
    console.log('[Firebase Init] Has FIREBASE_PRIVATE_KEY:', !!process.env.FIREBASE_PRIVATE_KEY);
    
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      // Handle multiple private key formats
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      
      console.log('[Firebase Init] Original key preview:', privateKey.substring(0, 50) + '...');
      
      // Trim whitespace
      privateKey = privateKey.trim();
      
      // Remove surrounding quotes if present (handles both " and ')
      if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || 
          (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
        privateKey = privateKey.slice(1, -1);
        console.log('[Firebase Init] Removed surrounding quotes from key');
      }
      
      // Replace escaped backslashes and quotes that appear in string literals
      privateKey = privateKey.replace(/\\\\/g, '\\').replace(/\\"/g, '"');
      
      // Replace escaped newlines with actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n');
      
      console.log('[Firebase Init] After unescape preview:', privateKey.substring(0, 50) + '...');
      
      // If the key doesn't start with -----BEGIN, it might be base64 encoded
      if (!privateKey.includes('-----BEGIN')) {
        console.log('[Firebase Init] Key does not contain BEGIN marker, trying base64 decode...');
        try {
          privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
          console.log('[Firebase Init] Base64 decoded successfully');
        } catch (e) {
          console.error('[Firebase Init] Failed to decode base64 private key:', e.message);
        }
      }
      
      // Ensure proper PEM format
      if (!privateKey.endsWith('\n')) {
        privateKey += '\n';
      }
      
      console.log('[Firebase Init] Private key format check:', {
        startsWithBegin: privateKey.startsWith('-----BEGIN'),
        endsWithEnd: privateKey.includes('-----END'),
        length: privateKey.length,
        firstLine: privateKey.split('\n')[0]
      });
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey
        })
      });
      console.log('[Firebase Init] Successfully initialized with environment variables');
    } else {
      console.error('[Firebase Init] Missing required environment variables');
      throw new Error('Neither service account file nor required environment variables found');
    }
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error.message);
  console.error('\nPlease provide credentials via one of these methods:');
  console.error('1. Service account JSON file at ./firebase-service-account.json');
  console.error('2. Environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  process.exit(1);
}

const db = admin.firestore();

// Configure multer for local file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.mp3';
    cb(null, `${req.params.id}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

  const allowedOrigins = [
    'http://localhost:5173',
    'https://eventosfinais.jaxreset.com'
  ];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }));
app.use(express.json({ limit: '50mb' }));

// Force cache invalidation for critical PWA files
app.use((req, res, next) => {
  const criticalFiles = ['/index.html', '/version.json', '/registerSW.js', '/manifest.webmanifest', '/sw.js'];
  if (criticalFiles.some(file => req.url.includes(file)) || req.url.endsWith('.js')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('Service-Worker-Allowed', '/');
  }
  next();
});

// Middleware to inject cache clearing script into index.html
app.get('/', (req, res, next) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    let content = fs.readFileSync(indexPath, 'utf8');
    const cacheClearScript = `
      <script>
        (function() {
          const CACHE_VERSION = '20260107-v1';
          if (localStorage.getItem('app_cache_force_clear') !== CACHE_VERSION) {
            console.log('Server-side triggered cache clear...');
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(regs => {
                for (let reg of regs) reg.unregister();
              });
            }
            if ('caches' in window) {
              caches.keys().then(names => {
                for (let name of names) caches.delete(name);
              });
            }
            localStorage.clear();
            localStorage.setItem('app_cache_force_clear', CACHE_VERSION);
            window.location.reload(true);
          }
        })();
      </script>
    `;
    content = content.replace('<head>', '<head>' + cacheClearScript);
    return res.send(content);
  }
  next();
});

// Handle OPTIONS preflight for audio files (iOS Safari compatibility)
app.options('/uploads/audio/:filename', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
  res.sendStatus(204);
});

// Serve uploaded audio files with Range Request support (required for iOS/Android)
app.get('/uploads/audio/:filename', (req, res) => {
  const filePath = path.join(UPLOADS_DIR, req.params.filename);
  
  console.log('Audio request received:', { 
    filename: req.params.filename, 
    filePath,
    userAgent: req.headers['user-agent'],
    origin: req.headers.origin
  });
  
  const allowedOrigins = [
    'http://localhost:5173',
    'https://eventosfinais.jaxreset.com'
  ];
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  // Block direct access by checking Referer or Origin
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  const isAllowedReferer = referer && allowedOrigins.some(ao => referer.startsWith(ao));

  if (!isAllowedOrigin && !isAllowedReferer) {
    console.warn('Blocked direct access attempt to audio:', req.params.filename);
    return res.status(403).json({ error: 'Direct access not allowed' });
  }

  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (isAllowedReferer) {
    const matchingOrigin = allowedOrigins.find(ao => referer.startsWith(ao));
    res.setHeader('Access-Control-Allow-Origin', matchingOrigin);
  }

  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length, Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (!fs.existsSync(filePath)) {
    console.error('Audio file not found:', filePath);
    return res.status(404).json({ error: 'Audio file not found' });
  }
  
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;
  
  // Determine content type based on file extension
  const ext = path.extname(req.params.filename).toLowerCase();
  const mimeTypes = {
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.webm': 'audio/webm'
  };
  const contentType = mimeTypes[ext] || 'audio/mpeg';
  
  console.log('Audio serving:', { filename: req.params.filename, range, fileSize, contentType, ext });
  
  if (range) {
    // Handle Range Request (required for iOS Safari and Android audio playback)
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = (end - start) + 1;
    
    const file = fs.createReadStream(filePath, { start, end });
    
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000'
    });
    
    file.pipe(res);
  } else {
    // No range request - send entire file
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000'
    });
    
    fs.createReadStream(filePath).pipe(res);
  }
});

// Serve other uploaded files statically (non-audio)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging
app.use((req, res, next) => {
  next();
});

// Kinde JWT verification
const kindeDomain = process.env.VITE_KINDE_DOMAIN;
const kindeAudience = process.env.VITE_API_URL || 'http://localhost:3001';

const client = jwksClient({
  jwksUri: `${kindeDomain}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

// Auth middleware - validates Kinde JWT
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Debug: Decode token without verification to see contents
  const decoded = jwt.decode(token);

  jwt.verify(token, getKey, { 
    algorithms: ['RS256'],
    // issuer: kindeDomain // Temporariamente removido para isolar o problema
  }, (err, verifiedDecoded) => {
    if (err) {
      console.error('JWT verification failed:', err.message);
      // Se falhar a verificação, ainda tentamos usar o decoded para ver o que tinha dentro
      return res.status(401).json({ error: 'Invalid token', details: err.message });
    }
    
    req.user = {
      id: verifiedDecoded.sub,
      email: verifiedDecoded.email,
      roles: verifiedDecoded.roles || [],
      isAdmin: (verifiedDecoded.roles || []).some(role => 
        role === 'admin' || role.key === 'admin' || role.name === 'Admin'
      )
    };
    
    next();
  });
};

// Admin middleware - requires admin role
const adminMiddleware = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ============ CHAPTERS API ============

// Get all chapters (authenticated users)
app.get('/api/chapters', authMiddleware, async (req, res) => {
  try {
    const snapshot = await db.collection('chapters').orderBy('orderIndex').get();
    const chapters = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(chapters);
  } catch (error) {
    console.error('Error fetching chapters:', error);
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
});

// Get single chapter (authenticated users)
app.get('/api/chapters/:id', authMiddleware, async (req, res) => {
  try {
    const doc = await db.collection('chapters').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching chapter:', error);
    res.status(500).json({ error: 'Failed to fetch chapter' });
  }
});

// Create chapter (admin only)
app.post('/api/chapters', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Accept both snake_case and camelCase
    const title = req.body.title;
    const summary = req.body.summary;
    const content = req.body.content;
    const audioUrl = req.body.audioUrl || req.body.audio_url || '';
    const orderIndex = req.body.orderIndex || req.body.order_index || 0;
    const contentModals = req.body.contentModals || req.body.content_modals || {};
    
    const docRef = await db.collection('chapters').add({
      title,
      summary: summary || '',
      content: content || '',
      audioUrl,
      orderIndex,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    const doc = await docRef.get();
    res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error creating chapter:', error);
    res.status(500).json({ error: 'Failed to create chapter' });
  }
});

// Update chapter (admin only)
app.put('/api/chapters/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Accept both snake_case and camelCase
    const updateData = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.summary !== undefined) updateData.summary = req.body.summary;
    if (req.body.content !== undefined) updateData.content = req.body.content;
    if (req.body.audioUrl !== undefined || req.body.audio_url !== undefined) {
      updateData.audioUrl = req.body.audioUrl || req.body.audio_url || '';
    }
    if (req.body.orderIndex !== undefined || req.body.order_index !== undefined) {
      updateData.orderIndex = req.body.orderIndex || req.body.order_index || 0;
    }
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    await db.collection('chapters').doc(req.params.id).update(updateData);
    
    const doc = await db.collection('chapters').doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error updating chapter:', error);
    res.status(500).json({ error: 'Failed to update chapter' });
  }
});

// Upload chapter audio (admin only) - saves locally
app.post('/api/chapters/:id/audio', authMiddleware, adminMiddleware, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Build the URL to access the uploaded file
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers.host;
    const audioUrl = `${protocol}://${host}/uploads/audio/${req.file.filename}`;

    res.json({ audioUrl, filename: req.file.filename });
  } catch (error) {
    console.error('Error uploading chapter audio:', error);
    res.status(500).json({ error: 'Failed to upload audio' });
  }
});

// Delete chapter (admin only)
app.delete('/api/chapters/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Delete associated questions and pages first
    const questionsSnapshot = await db.collection('questions')
      .where('chapterId', '==', req.params.id).get();
    const pagesSnapshot = await db.collection('chapterPages')
      .where('chapterId', '==', req.params.id).get();
    
    const batch = db.batch();
    questionsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    pagesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    batch.delete(db.collection('chapters').doc(req.params.id));
    
    await batch.commit();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    res.status(500).json({ error: 'Failed to delete chapter' });
  }
});

// ============ QUESTIONS API ============

// Get questions for a chapter (authenticated users)
app.get('/api/chapters/:chapterId/questions', authMiddleware, async (req, res) => {
  try {
    // Try with orderBy first, if index doesn't exist, fall back to simple query
    let snapshot;
    try {
      snapshot = await db.collection('questions')
        .where('chapterId', '==', req.params.chapterId)
        .orderBy('orderIndex')
        .get();
    } catch (indexError) {
      // Fallback: fetch without orderBy and sort in memory
      console.warn('Firestore index missing for questions orderIndex, using fallback');
      snapshot = await db.collection('questions')
        .where('chapterId', '==', req.params.chapterId)
        .get();
    }
    
    let questions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort in memory if needed
    questions.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Create question (admin only)
app.post('/api/chapters/:chapterId/questions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { text, orderIndex } = req.body;
    
    const docRef = await db.collection('questions').add({
      chapterId: req.params.chapterId,
      text,
      orderIndex: orderIndex || 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    const doc = await docRef.get();
    res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// Delete question (admin only)
app.delete('/api/questions/:questionId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await db.collection('questions').doc(req.params.questionId).delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// ============ CHAPTER PAGES API ============

// Get pages for a chapter (authenticated users)
app.get('/api/chapters/:chapterId/pages', authMiddleware, async (req, res) => {
  try {
    const snapshot = await db.collection('chapterPages')
      .where('chapterId', '==', req.params.chapterId)
      .orderBy('pageNumber')
      .get();
    const pages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(pages);
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

// Create page (admin only)
app.post('/api/chapters/:chapterId/pages', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Accept both snake_case and camelCase
    const subtitle = req.body.subtitle || '';
    const pageNumber = req.body.pageNumber || req.body.page_number || 1;
    const content = req.body.content || '';
    const orderIndex = req.body.orderIndex || req.body.order_index || 0;
    const contentModals = req.body.contentModals || req.body.content_modals || {};
    
    const docRef = await db.collection('chapterPages').add({
      chapterId: req.params.chapterId,
      subtitle,
      pageNumber,
      content,
      orderIndex,
      contentModals,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    const doc = await docRef.get();
    res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({ error: 'Failed to create page' });
  }
});

// Delete page (admin only)
app.delete('/api/pages/:pageId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await db.collection('chapterPages').doc(req.params.pageId).delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

// ============ USER PROGRESS API ============

// Get user progress (authenticated users - own data only)
app.get('/api/progress', authMiddleware, async (req, res) => {
  try {
    const snapshot = await db.collection('userProgress')
      .where('userId', '==', req.user.id)
      .get();
    const progress = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Update profile (authenticated users)
app.put('/api/profile', authMiddleware, async (req, res) => {
  try {
    const { username, email } = req.body;
    
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const userId = req.user.id;
    const userEmail = email || req.user.email || '';

    console.log(`[API] Updating profile for user ${userId} to ${username} (Email: ${userEmail})`);

    // Update username in user document
    const userRef = db.collection('users').doc(userId);
    
    // Check if document exists first to avoid error on update
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      console.log(`[API] User document ${userId} not found, creating it...`);
      await userRef.set({
        username: username.trim(),
        email: userEmail,
        isAdmin: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await userRef.update({
        username: username.trim(),
        email: userEmail, // Also update email if provided
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.json({ success: true, username: username.trim(), email: userEmail });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: `Failed to update profile: ${error.message}` });
  }
});

// Get profile (authenticated users)
app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.id).get();
    if (userDoc.exists) {
      res.json(userDoc.data());
    } else {
      res.json({
        username: req.user.givenName || req.user.email?.split('@')[0] || '',
        email: req.user.email || '',
        isAdmin: false
      });
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user progress (authenticated users - own data only)
app.post('/api/progress', authMiddleware, async (req, res) => {
  try {
    const { chapterId, completed, currentPage } = req.body;
    
    // Check if progress exists
    const existingSnapshot = await db.collection('userProgress')
      .where('userId', '==', req.user.id)
      .where('chapterId', '==', chapterId)
      .get();
    
    if (!existingSnapshot.empty) {
      // Update existing
      const docRef = existingSnapshot.docs[0].ref;
      await docRef.update({
        completed: completed !== undefined ? completed : false,
        currentPage: currentPage || 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      const doc = await docRef.get();
      res.json({ id: doc.id, ...doc.data() });
    } else {
      // Create new
      const docRef = await db.collection('userProgress').add({
        userId: req.user.id,
        chapterId,
        completed: completed !== undefined ? completed : false,
        currentPage: currentPage || 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      const doc = await docRef.get();
      res.status(201).json({ id: doc.id, ...doc.data() });
    }
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Get page read progress for a chapter
app.get('/api/chapters/:chapterId/progress/pages', authMiddleware, async (req, res) => {
  try {
    const snapshot = await db.collection('pageProgress')
      .where('userId', '==', req.user.id)
      .where('chapterId', '==', req.params.chapterId)
      .get();
    
    const progress = snapshot.docs.map(doc => ({
      pageId: doc.data().pageId,
      isRead: doc.data().isRead
    }));
    
    res.json(progress);
  } catch (error) {
    console.error('Error fetching page progress:', error);
    res.status(500).json({ error: 'Failed to fetch page progress' });
  }
});

// Mark a page as read
app.post('/api/progress/page', authMiddleware, async (req, res) => {
  try {
    const { chapterId, pageId, isRead } = req.body;
    
    const snapshot = await db.collection('pageProgress')
      .where('userId', '==', req.user.id)
      .where('pageId', '==', pageId)
      .get();
    
    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        isRead: isRead !== undefined ? isRead : true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await db.collection('pageProgress').add({
        userId: req.user.id,
        chapterId,
        pageId,
        isRead: isRead !== undefined ? isRead : true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating page progress:', error);
    res.status(500).json({ error: 'Failed to update page progress' });
  }
});

// Get completion status for a chapter
app.get('/api/chapters/:chapterId/progress', authMiddleware, async (req, res) => {
  try {
    const snapshot = await db.collection('userProgress')
      .where('userId', '==', req.user.id)
      .where('chapterId', '==', req.params.chapterId)
      .get();
    
    if (snapshot.empty) {
      return res.json({ isCompleted: false, isAudioFinished: false });
    }
    
    const data = snapshot.docs[0].data();
    res.json({ 
      isCompleted: data.completed || false,
      isAudioFinished: data.isAudioFinished || false
    });
  } catch (error) {
    console.error('Error fetching chapter progress:', error);
    res.status(500).json({ error: 'Failed to fetch chapter progress' });
  }
});

// Save user answer for a question
// Uses deterministic doc ID to avoid composite index requirement
app.post('/api/answers', authMiddleware, async (req, res) => {
  try {
    const { chapterId, questionId, answer } = req.body;
    
    if (!chapterId || !questionId) {
      return res.status(400).json({ error: 'chapterId and questionId are required' });
    }
    
    // Use deterministic document ID: {userId}_{chapterId}_{questionId}
    const docId = `${req.user.id}_${chapterId}_${questionId}`;
    const docRef = db.collection('userAnswers').doc(docId);
    
    await docRef.set({
      userId: req.user.id,
      chapterId,
      questionId,
      answer: answer || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving user answer:', error);
    res.status(500).json({ error: 'Failed to save answer' });
  }
});

// Get user answers for a chapter
app.get('/api/chapters/:chapterId/answers', authMiddleware, async (req, res) => {
  try {
    // Query by prefix pattern - all docs starting with {userId}_{chapterId}_
    const prefix = `${req.user.id}_${req.params.chapterId}_`;
    const snapshot = await db.collection('userAnswers')
      .where(admin.firestore.FieldPath.documentId(), '>=', prefix)
      .where(admin.firestore.FieldPath.documentId(), '<', prefix + '\uf8ff')
      .get();
    
    const answers = snapshot.docs.map(doc => ({
      questionId: doc.data().questionId,
      answer: doc.data().answer
    }));
    
    res.json(answers);
  } catch (error) {
    console.error('Error fetching user answers:', error);
    res.status(500).json({ error: 'Failed to fetch answers' });
  }
});

// Toggle chapter completion
app.post('/api/chapters/:chapterId/progress', authMiddleware, async (req, res) => {
  try {
    const { isCompleted } = req.body;
    
    const snapshot = await db.collection('userProgress')
      .where('userId', '==', req.user.id)
      .where('chapterId', '==', req.params.chapterId)
      .get();
    
    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        completed: isCompleted,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await db.collection('userProgress').add({
        userId: req.user.id,
        chapterId: req.params.chapterId,
        completed: isCompleted,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error toggling chapter completion:', error);
    res.status(500).json({ error: 'Failed to toggle chapter completion' });
  }
});

// Update audio progress
app.post('/api/chapters/:chapterId/progress/audio', authMiddleware, async (req, res) => {
  try {
    const { isAudioFinished } = req.body;
    
    const snapshot = await db.collection('userProgress')
      .where('userId', '==', req.user.id)
      .where('chapterId', '==', req.params.chapterId)
      .get();
    
    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        isAudioFinished: isAudioFinished,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await db.collection('userProgress').add({
        userId: req.user.id,
        chapterId: req.params.chapterId,
        isAudioFinished: isAudioFinished,
        completed: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating audio progress:', error);
    res.status(500).json({ error: 'Failed to update audio progress' });
  }
});

// Get detailed progress for all chapters
app.get('/api/progress/all', authMiddleware, async (req, res) => {
  try {
    const chaptersSnapshot = await db.collection('chapters').get();
    const chapters = chaptersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const progressSnapshot = await db.collection('userProgress')
      .where('userId', '==', req.user.id)
      .get();
    const progressMap = new Map(progressSnapshot.docs.map(doc => [doc.data().chapterId, doc.data()]));

    const pagesSnapshot = await db.collection('chapterPages').get();
    const pagesByChapter = new Map();
    pagesSnapshot.docs.forEach(doc => {
      const chapterId = doc.data().chapterId;
      if (!pagesByChapter.has(chapterId)) pagesByChapter.set(chapterId, []);
      pagesByChapter.get(chapterId).push(doc.id);
    });

    const readPagesSnapshot = await db.collection('pageProgress')
      .where('userId', '==', req.user.id)
      .get();
    const readPagesByChapter = new Map();
    readPagesSnapshot.docs.forEach(doc => {
      const chapterId = doc.data().chapterId;
      if (doc.data().isRead) {
        if (!readPagesByChapter.has(chapterId)) readPagesByChapter.set(chapterId, new Set());
        readPagesByChapter.get(chapterId).add(doc.data().pageId);
      }
    });

    const questionsSnapshot = await db.collection('questions').get();
    const questionsByChapter = new Map();
    questionsSnapshot.docs.forEach(doc => {
      const chapterId = doc.data().chapterId;
      if (!questionsByChapter.has(chapterId)) questionsByChapter.set(chapterId, []);
      questionsByChapter.get(chapterId).push(doc.id);
    });

    const answersSnapshot = await db.collection('userAnswers')
      .where('userId', '==', req.user.id)
      .get();
    const answersByChapter = new Map();
    answersSnapshot.docs.forEach(doc => {
      const chapterId = doc.data().chapterId;
      if (doc.data().answer && doc.data().answer.trim()) {
        if (!answersByChapter.has(chapterId)) answersByChapter.set(chapterId, new Set());
        answersByChapter.get(chapterId).add(doc.data().questionId);
      }
    });

    const result = {};
    chapters.forEach(chapter => {
      const prog = progressMap.get(chapter.id) || {};
      const chPages = pagesByChapter.get(chapter.id) || [];
      const chReadPages = readPagesByChapter.get(chapter.id) || new Set();
      const chQuestions = questionsByChapter.get(chapter.id) || [];
      const chAnswers = answersByChapter.get(chapter.id) || new Set();

      result[chapter.id] = {
        isCompleted: prog.completed || false,
        isAudioFinished: prog.isAudioFinished || false,
        readPagesCount: chReadPages.size,
        totalPagesCount: chPages.length,
        answeredQuestionsCount: chAnswers.size,
        totalQuestionsCount: chQuestions.length
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching detailed all progress:', error);
    res.status(500).json({ error: 'Failed to fetch detailed all progress' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    firebase: 'connected'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Firestore API Server running on port ${PORT}`);
  console.log(`Kinde Domain: ${kindeDomain}`);
  console.log(`API endpoints:`);
  console.log(`  GET    /api/chapters - List all chapters`);
  console.log(`  GET    /api/chapters/:id - Get chapter`);
  console.log(`  POST   /api/chapters - Create chapter (admin)`);
  console.log(`  PUT    /api/chapters/:id - Update chapter (admin)`);
  console.log(`  DELETE /api/chapters/:id - Delete chapter (admin)`);
  console.log(`  GET    /api/chapters/:id/questions - Get questions`);
  console.log(`  POST   /api/chapters/:id/questions - Create question (admin)`);
  console.log(`  GET    /api/chapters/:id/pages - Get pages`);
  console.log(`  POST   /api/chapters/:id/pages - Create page (admin)`);
  console.log(`  GET    /api/progress - Get user progress`);
  console.log(`  POST   /api/progress - Update user progress`);
  console.log(`  GET    /api/health - Health check`);
});
