import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';
import taskroutes from './routes/tasks.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5070;

// Middleware
app.use(cors());
app.use(express.json());

// Make db available to routes
app.use((req, res, next) => {
    req.db = pool;
    next();
});

// Routes
app.use('/api/tasks', taskroutes);

// Test route to check database connection
app.get('/api/test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as time');
        res.json({ message: 'Database connected!', time: result.rows[0].time });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${process.env.DB_NAME} on ${process.env.DB_HOST}`);
});