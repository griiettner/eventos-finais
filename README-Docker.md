# Eventos Finais - Docker Setup

## 🐳 Docker Configuration

This app is now fully dockerized with automatic database synchronization between devices.

### Architecture

```
┌─────────────────────────────────────────┐
│ Docker Container                        │
│ ├─ Nginx (Frontend) - Port 80           │
│ ├─ Express Server (API) - Port 3000     │
│ └─ SQLite Database (Shared)              │
└─────────────────────────────────────────┘
```

### Quick Start

1. **Build and run:**
   ```bash
   docker-compose up --build
   ```

2. **Access the app:**
   - Frontend: http://localhost:80
   - API: http://localhost:3000
   - Health check: http://localhost:3000/api/health

### Database Synchronization

The app now automatically syncs data between all users:

**Admin creates/edits content:**
1. Saves to local SQLite
2. Uploads to server database
3. All users get latest data

**Users access content:**
1. App checks server for updates
2. Downloads latest database if needed
3. Works offline with local cache

### API Endpoints

- `GET /api/db` - Download the shared database
- `POST /api/db` - Upload database (admin operations)
- `GET /api/db/timestamp` - Check for updates
- `GET /api/health` - Server health status

### Data Persistence

Database is persisted in `./data/eventos-finais.db` on the host machine.

### Production Deployment

**Option 1: Vercel + Railway**
```bash
# Deploy frontend to Vercel
vercel --prod

# Deploy backend to Railway
railway login
railway up
```

**Option 2: Single Server**
```bash
# Deploy to any cloud provider
docker-compose up -d
```

**Option 3: Local Network**
```bash
# Run on local network server
docker-compose up -d
# Access via: http://YOUR_SERVER_IP
```

### Environment Variables

```bash
NODE_ENV=production
PORT=3000
```

### Monitoring

Check container status:
```bash
docker-compose ps
docker-compose logs eventos-finais
```

### Backup Database

```bash
# Backup
cp data/eventos-finais.db data/backup-$(date +%Y%m%d).db

# Restore
cp data/backup-20240101.db data/eventos-finais.db
docker-compose restart
```

### Troubleshooting

**Database not found:**
```bash
# Check if database file exists
ls -la data/

# Restart container to recreate
docker-compose down
docker-compose up --build
```

**Port conflicts:**
```bash
# Change ports in docker-compose.yml
ports:
  - "8080:80"  # Frontend
  - "3001:3000" # Backend
```

**Sync issues:**
```bash
# Check server logs
docker-compose logs eventos-finais

# Verify API is working
curl http://localhost:3000/api/health
```

### Security Notes

- Add authentication to `/api/db` POST endpoint for production
- Use HTTPS in production
- Consider database encryption for sensitive data
- Regular backups recommended
