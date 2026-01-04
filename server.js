/* global __dirname */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json',
};

// Asset extensions that should NOT fall back to index.html
const ASSET_EXTENSIONS = new Set(['.js', '.css', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.map']);

function log(message, data = {}) {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({ timestamp, message, ...data }));
}

function proxyToSefaria(endpoint, ref, res) {
  const url = `https://www.sefaria.org/api/${endpoint}/${encodeURIComponent(ref)}?context=0`;
  log('Proxying to Sefaria', { endpoint, ref, url });

  https.get(url, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    proxyRes.pipe(res);
  }).on('error', (err) => {
    log('Sefaria proxy error', { endpoint, ref, error: err.message });
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to fetch from Sefaria', message: err.message }));
  });
}

function proxyToSefariaTopics(slug, res) {
  const url = `https://www.sefaria.org/api/v2/topics/${encodeURIComponent(slug)}?with_refs=1`;
  log('Proxying to Sefaria Topics', { slug, url });

  https.get(url, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    proxyRes.pipe(res);
  }).on('error', (err) => {
    log('Sefaria topics proxy error', { slug, error: err.message });
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to fetch from Sefaria topics', message: err.message }));
  });
}

function serveStatic(filePath, res, req) {
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const isAsset = ASSET_EXTENSIONS.has(ext);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // For asset files (.js, .css, etc.), return 404 instead of falling back to index.html
      if (isAsset) {
        log('Asset file not found - returning 404', {
          filePath,
          ext,
          error: err.code,
          userAgent: req.headers['user-agent'],
          url: req.url
        });
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'File not found',
          path: filePath,
          requestedUrl: req.url
        }));
        return;
      }

      // For non-asset routes, serve index.html for client-side routing
      log('Serving index.html for client route', {
        originalPath: filePath,
        url: req.url
      });
      fs.readFile(path.join(DIST_DIR, 'index.html'), (err2, indexData) => {
        if (err2) {
          log('Failed to read index.html', { error: err2.message });
          res.writeHead(500);
          res.end('Server error');
          return;
        }
        res.writeHead(200, {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache'
        });
        res.end(indexData);
      });
      return;
    }

    // Set cache headers for assets
    const cacheControl = isAsset
      ? 'public, max-age=31536000, immutable'  // 1 year for hashed assets
      : 'no-cache';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': cacheControl
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const userAgent = req.headers['user-agent'] || 'unknown';

  // Log all requests with user agent info
  log('Request received', {
    method: req.method,
    pathname: url.pathname,
    search: url.search,
    userAgent: userAgent.substring(0, 100),
    isMobileSafari: /iPhone.*Safari/.test(userAgent) && !/CriOS|FxiOS/.test(userAgent)
  });

  // Handle API proxy to Sefaria texts
  if (url.pathname === '/api/sefaria-text') {
    const ref = url.searchParams.get('ref');
    if (!ref) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing ref parameter' }));
      return;
    }
    proxyToSefaria('texts', ref, res);
    return;
  }

  // Handle API proxy to Sefaria topics
  if (url.pathname === '/api/sefaria-topic') {
    const slug = url.searchParams.get('slug');
    if (!slug) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing slug parameter' }));
      return;
    }
    proxyToSefariaTopics(slug, res);
    return;
  }

  // Health check endpoint
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // Debug endpoint to check what files exist
  if (url.pathname === '/debug/files') {
    try {
      const files = fs.readdirSync(DIST_DIR);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ distDir: DIST_DIR, files }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Serve static files
  // Decode URL to handle percent-encoded characters (e.g., spaces, special chars)
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(url.pathname);
  } catch (e) {
    log('Failed to decode URL', { pathname: url.pathname, error: e.message });
    decodedPath = url.pathname;
  }

  let filePath = path.join(DIST_DIR, decodedPath);
  if (decodedPath === '/' || decodedPath === '') {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  // Security: prevent directory traversal
  if (!filePath.startsWith(DIST_DIR)) {
    log('Directory traversal attempt blocked', { filePath, decodedPath });
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden' }));
    return;
  }

  serveStatic(filePath, res, req);
});

server.listen(PORT, () => {
  log('Server started', { port: PORT, distDir: DIST_DIR });

  // Log available files on startup
  try {
    const files = fs.readdirSync(DIST_DIR);
    log('Available files in dist', { count: files.length, files: files.slice(0, 20) });
  } catch (err) {
    log('Could not read dist directory', { error: err.message });
  }
});
