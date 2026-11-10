import express from 'express';
import { pool } from './db.js';
import type { Request, Response } from 'express';
import path from 'path';
import { todoPageRouter, todoApiRouter } from './src/apps/todo/todoRouter.js';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ESモジュール環境で現在のファイルの場所(__dirname)を取得する記述
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express(); // Expressアプリケーションを作成
const port: number = 3000; // ローカルで使用するポート番号


// // 実行環境（ローカルの src/、ビルド後の dist/src/、Vercel上）によって
// // 階層が変わるため、実際のファイル位置を基準に views フォルダを探す
// let projectRoot = process.cwd();
// if (fs.existsSync(path.join(__dirname, './views'))) {
//     projectRoot = path.join(__dirname, './');       // ローカル (src配下) の場合
// } else if (fs.existsSync(path.join(__dirname, '../views'))) {
//     projectRoot = path.join(__dirname, '../../');    // ビルド後 (dist/src配下) の場合
// }


// ------------------------------
// Expressの基本設定
// ------------------------------
app.use(express.urlencoded({ extended: true }));

// public フォルダのパス解決
let publicPath = path.join(__dirname, 'public');
if (!fs.existsSync(publicPath)) {
  publicPath = path.join(__dirname, '../public');
}
app.use(express.static(publicPath));

app.set('view engine', 'ejs');

// views フォルダのパス解決（コメントアウトを解除・調整）
let viewsPath = path.join(__dirname, 'views');
if (!fs.existsSync(viewsPath)) {
  viewsPath = path.join(__dirname, '../views');
}
app.set('views', viewsPath);

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
