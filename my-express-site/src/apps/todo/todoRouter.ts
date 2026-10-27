import { Router } from 'express';
import { getTodosHandler, createTodoHandler, updateTodoHandler, deleteTodoHandler } from './todoController.js';

export const todoPageRouter = Router();
export const todoApiRouter = Router();

// 画面表示用ルーティング
todoPageRouter.get('/', (req, res) => {
  res.render('public/todo/main');
});

// REST API用ルーティング (一覧と登録のみ)
todoApiRouter.get('/', getTodosHandler);
todoApiRouter.post('/', createTodoHandler);
todoApiRouter.patch('/:id', updateTodoHandler);
todoApiRouter.delete('/:id', deleteTodoHandler);