//Install express server
const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const appName = 'tcc-client';
const port = process.env.PORT || 4200;
const outputPath = path.join(__dirname, 'dist', appName, 'browser');

app.use(compression());
app.use(express.static(outputPath));

app.get('/*', function(req, res) {
  res.sendFile(path.join(outputPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
