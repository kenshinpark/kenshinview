import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const UPSTREAM = process.env.UPSTREAM || 'https://7movies.ac';

app.use('/api', createProxyMiddleware({
  target: UPSTREAM,
  changeOrigin: true,
  secure: true,
  onProxyReq: (proxyReq) => {
    proxyReq.setHeader('Origin', UPSTREAM);
    proxyReq.setHeader('Referer', UPSTREAM + '/');
  }
}));

app.use(express.static(path.join(__dirname, 'dist')));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));