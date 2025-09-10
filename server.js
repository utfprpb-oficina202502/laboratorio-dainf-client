//Install express server
const express = require('express');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 4200;

const appName = process.env.APP_NAME || 'tcc-client';
const distRoot = path.join(__dirname, 'dist');
const candidatePaths = [
  process.env.OUTPUT_PATH,
  path.join(distRoot, appName, 'browser'),
  path.join(distRoot, appName),
  distRoot
].filter(Boolean);

const outputPath = candidatePaths.find(p => fs.existsSync(p));

if (!outputPath) {
  console.error('❌ ERROR: Could not find the Angular build output directory.');
  console.error('Checked the following paths:', candidatePaths);
  process.exit(1);
}
console.log(`✅ Serving files from: ${outputPath}`);

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

