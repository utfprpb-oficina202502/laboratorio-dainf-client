//Install express server
const express = require('express');
const path = require('path');
const compression = require('compression');
const rateLimit = require('express-rate-limit'); // <-- 1. Import rate-limit

const app = express();
const appName = 'tcc-client';
const port = process.env.PORT || 4200;
const outputPath = path.join(__dirname, 'dist', appName, 'browser');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limita request por IP
  standardHeaders: true, // Retorna info do rate limit no header `RateLimit-*`
  legacyHeaders: false, // Desabilita o header `X-RateLimit-*`
});

app.use(limiter);
app.use(compression());
app.use(express.static(outputPath));

app.get('/*', function(req, res) {
  res.sendFile(path.join(outputPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
