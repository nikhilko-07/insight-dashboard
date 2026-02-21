const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files with proper MIME types
app.use(express.static(path.join(__dirname), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.pcd')) {
            res.setHeader('Content-Type', 'text/plain');
        }
    }
}));

app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});