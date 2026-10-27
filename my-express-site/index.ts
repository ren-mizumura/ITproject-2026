import express from 'express';
import { pool } from './db.js';
import type { Request, Response } from 'express';
import path from 'path';
import { todoPageRouter, todoApiRouter } from './src/apps/todo/todoRouter.js';


const app = express(); // Expressアプリケーションを作成
const port: number = 3000; // ローカルで使用するポート番号


// ------------------------------
// Expressの基本設定
// ------------------------------
app.use(express.urlencoded({ extended: true })); // フォームから送信されたデータを受け取れるようにする
app.use(express.static(path.join(process.cwd(), 'public'))); // CSSや画像などの静的ファイルを公開する
app.set('view engine', 'ejs'); // テンプレートエンジンにEJSを設定
app.set('views', path.join(process.cwd(), 'views')); // EJSファイルを保存するフォルダーを指定

app.use(express.json());


// ------------------------------
// ルーティング
// ------------------------------


// 「/」にアクセスされたときの処理
app.get('/', (req, res) => {
     res.render('todo/index');
});

// 「api/db-check」アクセス時 
app.get('/api/db-check', async (_req, res) => {
  try {
    const result = await pool.query('SELECT 1 AS connection_test');
    res.json({
      status: 'ok',
      database: result.rows[0].connection_test === 1 ? 'connected' : 'error',
    });
  } catch (error) {
    console.error('DB接続確認に失敗しました', error);
    res.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

// ==========================================
// TODOアプリ用に追加したルート
// ==========================================
app.use('/todo', todoPageRouter);
app.use('/api/v1/todos', todoApiRouter);


// ------------------------------
// サーバー起動
// ------------------------------


app.listen(port, (): void => {
  console.log(`Server started: http://localhost:${port}`);
});
