import express from 'express';
import {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskOrder
} from '../controllers/taskController.js';

const router = express.Router();

router.route('/')
    .get(getAllTasks)
    .post(createTask);

router.route('/:id')
    .get(getTaskById)
    .put(updateTask)
    .delete(deleteTask);

router.put('/order/update', updateTaskOrder);

export default router;