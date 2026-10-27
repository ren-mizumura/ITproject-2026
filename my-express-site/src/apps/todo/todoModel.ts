// ※既存の db.ts のエクスポート形式に合わせてインポートを調整してください。
// 例: export const pool = ... とされている場合を想定しています。
import {pool} from '../../../db';

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * TODO一覧をIDの昇順で取得する
 */
export const getTodos = async (): Promise<Todo[]> => {
  const result = await pool.query('SELECT * FROM todos ORDER BY id ASC');
  return result.rows;
};

/**
 * 新しいTODOを登録する
 */
export const createTodo = async (title: string): Promise<Todo> => {
  const result = await pool.query(
    'INSERT INTO todos (title) VALUES ($1) RETURNING *',
    [title]
  );
  return result.rows[0];
};

/**
 * IDを指定してTODOを1件取得する
 */
export const getTodoById = async (id: number): Promise<Todo | null> => {
  const result = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/**
 * TODOの完了状態を更新する
 */
export const updateTodoStatus = async (id: number, completed: boolean): Promise<Todo> => {
  const result = await pool.query(
    'UPDATE todos SET completed = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
    [completed, id]
  );
  return result.rows[0];
};

/**
 * TODOを削除する
 */
export const deleteTodo = async (id: number): Promise<void> => {
  await pool.query('DELETE FROM todos WHERE id = $1', [id]);
};