const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// Serve static files from web-demo directory
app.use(express.static(path.join(__dirname, 'web-demo')));

// Handle all routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'web-demo', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});