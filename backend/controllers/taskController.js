import pool from "../config/db.js"; // Add .js extension if using ES modules

// GET all tasks
export const getAllTasks = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM tasks ORDER BY order_position ASC, created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET single task
export const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// CREATE task
export const createTask = async (req, res) => {
    try {
        const { title, description, priority, due_date } = req.body;
        
        // Get next order position
        const orderResult = await pool.query(
            'SELECT COALESCE(MAX(order_position), 0) + 1 as next_order FROM tasks'
        );
        const order_position = orderResult.rows[0].next_order;
        
        const result = await pool.query(
            `INSERT INTO tasks (title, description, priority, due_date, order_position, status) 
             VALUES ($1, $2, $3, $4, $5, 'pending') 
             RETURNING *`,
            [title, description, priority, due_date, order_position]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATE task
export const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status, priority, due_date } = req.body;
        
        const result = await pool.query(
            `UPDATE tasks 
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 status = COALESCE($3, status),
                 priority = COALESCE($4, priority),
                 due_date = COALESCE($5, due_date),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $6 
             RETURNING *`,
            [title, description, status, priority, due_date, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE task
export const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATE order (for drag & drop)
// UPDATE order (for drag & drop)
export const updateTaskOrder = async (req, res) => {
    const client = await req.db.connect(); // Get client from pool
    
    try {
        const { tasks } = req.body;
        
        await client.query('BEGIN');
        
        for (const task of tasks) {
            await client.query(
                'UPDATE tasks SET order_position = $1 WHERE id = $2',
                [task.order_position, task.id]
            );
        }
        
        await client.query('COMMIT');
        res.json({ message: 'Order updated successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release(); // Release client back to pool
    }
};