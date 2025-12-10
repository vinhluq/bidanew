import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Log to verify server startup in Cloud Run logs
console.log(`Starting server configuration...`);

// Serve static files from the 'dist' directory (Vite build output)
app.use(express.static(join(__dirname, 'dist')));

// Handle client-side routing: return index.html for all non-static requests
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// Explicitly bind to 0.0.0.0 to ensure external access in container
app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});