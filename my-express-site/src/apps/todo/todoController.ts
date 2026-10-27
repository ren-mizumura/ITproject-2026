import type { Request, Response } from 'express';
import * as todoModel from './todoModel.js';

/**
 * TODO一覧取得ハンドラー
 */
export const getTodosHandler = async (req: Request, res: Response) => {
  try {
    const todos = await todoModel.getTodos();
    res.status(200).json({ data: todos });
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'サーバー内部エラーが発生しました' } });
  }
};

/**
 * TODO登録ハンドラー
 */
export const createTodoHandler = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;

    // バリデーション: 存在・型チェック
    if (title === undefined) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'titleは必須です' } });
    }
    if (typeof title !== 'string') {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'titleは文字列である必要があります' } });
    }

    // バリデーション: 文字数チェック（空白除去後）
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0 || trimmedTitle.length > 100) {
      return res.status(422).json({ error: { code: 'UNPROCESSABLE_ENTITY', message: 'titleは1〜100文字で入力してください' } });
    }

    const newTodo = await todoModel.createTodo(trimmedTitle);
    res.status(201).json({ data: newTodo });
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'サーバー内部エラーが発生しました' } });
  }
};

/**
 * TODO状態更新ハンドラー (PATCH)
 */
export const updateTodoHandler = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: '有効なIDを指定してください' } });
    }

    const { completed } = req.body;
    if (typeof completed !== 'boolean') {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'completedは真偽値である必要があります' } });
    }

    // 存在チェック (404)
    const existingTodo = await todoModel.getTodoById(id);
    if (!existingTodo) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '指定されたTODOが見つかりません' } });
    }

    const updatedTodo = await todoModel.updateTodoStatus(id, completed);
    res.status(200).json({ data: updatedTodo });
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'サーバー内部エラーが発生しました' } });
  }
};

/**
 * TODO削除ハンドラー (DELETE)
 */
export const deleteTodoHandler = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: '有効なIDを指定してください' } });
    }

    // 存在チェック (404)
    const existingTodo = await todoModel.getTodoById(id);
    if (!existingTodo) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: '指定されたTODOが見つかりません' } });
    }

    await todoModel.deleteTodo(id);
    // 204 No Content は本文を空にして返す
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'サーバー内部エラーが発生しました' } });
  }
};