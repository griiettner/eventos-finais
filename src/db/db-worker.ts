import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

const log = (...args: unknown[]) => console.log('[DB Worker]', ...args);
const error = (...args: unknown[]) => console.error('[DB Worker]', ...args);

let db: any;

const initDB = async () => {
  try {
    const sqlite3 = await sqlite3InitModule({
      print: log,
      printErr: error,
    });

    log('SQLite3 version', sqlite3.version.libVersion);

    if ('opfs' in sqlite3) {
      db = new sqlite3.oo1.OpfsDb('/eventos-finais.db');
      log('OPFS database initialized');
    } else {
      db = new sqlite3.oo1.DB('/eventos-finais-local.db', 'ct');
      log('Transient database initialized (OPFS not available)');
    }

    // Initialize tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS chapters (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        audio_url TEXT,
        order_index INTEGER
      );

      CREATE TABLE IF NOT EXISTS user_answers (
        chapter_id INTEGER,
        question_id INTEGER,
        answer TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0,
        PRIMARY KEY (chapter_id, question_id)
      );

      CREATE TABLE IF NOT EXISTS progress (
        chapter_id INTEGER PRIMARY KEY,
        is_read INTEGER DEFAULT 0,
        audio_progress REAL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        username TEXT,
        email TEXT,
        is_verified INTEGER DEFAULT 0
      );
    `);

    postMessage({ type: 'READY' });
  } catch (err) {
    error('Failed to initialize database:', err);
    postMessage({ type: 'ERROR', error: err instanceof Error ? err.message : String(err) });
  }
};

onmessage = async (e) => {
  const { type, payload, id } = e.data;

  if (type === 'INIT') {
    await initDB();
    return;
  }

  if (!db) {
    postMessage({ id, type: 'ERROR', error: 'Database not initialized' });
    return;
  }

  try {
    switch (type) {
      case 'exec': {
        const result = db.exec(payload.sql, {
          bind: payload.params,
          returnValue: 'resultRows',
          columnNames: [],
        });
        postMessage({ id, type: 'SUCCESS', result });
        break;
      }

      case 'get': {
        const row = db.selectObject(payload.sql, payload.params);
        postMessage({ id, type: 'SUCCESS', result: row });
        break;
      }

      case 'getAll': {
        const rows = db.selectObjects(payload.sql, payload.params);
        postMessage({ id, type: 'SUCCESS', result: rows });
        break;
      }

      default:
        postMessage({ id, type: 'ERROR', error: 'Unknown message type' });
    }
  } catch (err) {
    error('Query error:', err);
    postMessage({ id, type: 'ERROR', error: err instanceof Error ? err.message : String(err) });
  }
};
