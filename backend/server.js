import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';
import taskRoutes from './routes/tasks.js';
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Make db available to routes
app.use((req, res, next) => {
    req.db = pool;
    next();
});

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, "../frontend")));

// Route for homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// API Routes
app.use('/api/tasks', taskRoutes);

// Test route
app.get('/api/test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as time');
        res.json({ message: 'Database connected!', time: result.rows[0].time });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 404 handler
app.use((req, res) => {
    console.log(`404 - Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${process.env.DB_NAME} on ${process.env.DB_HOST}`);
    console.log(`📁 Serving static files from: ${path.join(__dirname, "../frontend")}`);
});
