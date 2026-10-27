# TODOアプリ V1 実装計画書

本計画書は、要件定義書（01_requirements.md）および設計書（02_design.md）に基づき、既存のExpressアプリケーションにTODO機能を組み込むための手順を定義します。
既存のルートや設定ファイル（`index.ts`, `db.ts`, `tsconfig.json`, `package.json`）を壊さないよう、追加ファイルは専用のディレクトリ（`src/apps/todo/`, `views/todo/`, `public/todo/`）に集約し、小さな単位で実装を進めます。

---

## 工程1: DBスキーマ定義用SQLの作成（Git保存用）
データベースの構造をコードとして管理するため、SQLファイルを作成します。

- **対象ファイル**: `src/apps/todo/schema.sql` (新規)
- **作業内容**: 
  - `todos` テーブルのCREATE文を記述します。
  - カラム: `id` (SERIAL PRIMARY KEY), `title` (VARCHAR(100) NOT NULL), `completed` (BOOLEAN DEFAULT FALSE), `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP), `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)。
- **確認コマンド**: `cat src/apps/todo/schema.sql`
- **期待結果**: ファイルの内容がターミナルに出力され、正しいSQL文が確認できること。
- **失敗時に最初に見る場所**: コマンド実行時のカレントディレクトリとファイルパスのスペルミス。

## 工程2: DBへのスキーマ適用（手動実行）
工程1で作成したSQLを、実際のデータベースに適用します。

- **対象ファイル**: なし（Neon SQL Editor上での操作）
- **作業内容**:
  - `schema.sql` の内容をクリップボードにコピーします。
  - Neonダッシュボードを開き、対象プロジェクトの SQL Editor に貼り付けて実行(Run)します。
- **確認コマンド**: Neon SQL Editor上で `SELECT * FROM todos;` を実行。
- **期待結果**: クエリが成功し、0件のデータ（カラム名のみ）が結果セットとして表示されること。
- **失敗時に最初に見る場所**: Neonの接続先データベース(Preview/Production)が正しいか。既存テーブルとの名前競合がないか。

## 工程3: バックエンド - 型定義とDBモデルの作成
データベース操作をカプセル化するロジックを実装します。

- **対象ファイル**: `src/apps/todo/todoModel.ts` (新規)
- **作業内容**:
  - `Todo` のインターフェース（型定義）を作成します。
  - 既存の `db.ts` をインポートします。
  - DBアクセス用関数 `getTodos()`, `createTodo(title)`, `updateTodoStatus(id, completed)`, `deleteTodo(id)` を実装しエクスポートします。
- **確認コマンド**: `npx tsc --noEmit`
- **期待結果**: 型エラーが出力されず、正常に終了すること。
- **失敗時に最初に見る場所**: `db.ts` への相対パスが正しいか。SQLクエリ内のパラメータ(`$1`, `$2`)と渡している配列の要素数が一致しているか。

## 工程4: バックエンド - APIコントローラーの作成
HTTPリクエストを受け取り、バリデーションとレスポンス生成を行う層を実装します。

- **対象ファイル**: `src/apps/todo/todoController.ts` (新規)
- **作業内容**:
  - `todoModel.ts` の関数を利用するコントローラー関数（一覧取得、作成、更新、削除）を実装します。
  - 要件定義にある文字数制限、型チェック、必須チェックを行い、400や422エラーを返却するロジックを含めます。
  - `try...catch` で500/503エラーをハンドリングします。
- **確認コマンド**: `npx tsc --noEmit`
- **期待結果**: 型エラーが出力されず、正常に終了すること。
- **失敗時に最初に見る場所**: Expressの `Request`, `Response` 型のインポート漏れ。HTTPステータスコードの指定忘れ。

## 工程5: バックエンド - ルーターの作成
画面用とAPI用のルーティングを定義します。

- **対象ファイル**: `src/apps/todo/todoRouter.ts` (新規)
- **作業内容**:
  - `express.Router()` を使用し、`todoPageRouter` と `todoApiRouter` の2つを作成しエクスポートします。
  - `todoPageRouter`: `GET /` に対し `res.render('todo/index')` を返す処理。
  - `todoApiRouter`: `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` に対し、工程4のコントローラー関数を紐付けます。
- **確認コマンド**: `npx tsc --noEmit`
- **期待結果**: 型エラーが出力されず、正常に終了すること。
- **失敗時に最初に見る場所**: コントローラーのインポートパスと、ルーターのメソッド（get, post等）の引数の型の不一致。

## 工程6: バックエンド - エントリーポイントへの組み込み
既存のアプリケーションにTODOアプリのルートを登録します。

- **対象ファイル**: `index.ts` または `src/index.ts` (既存)
- **作業内容**:
  - `todoRouter.ts` から `todoPageRouter` と `todoApiRouter` をインポートします。
  - 既存のルート定義（`/` や `/api/db-check`）の近くに以下を追記します。
    - `app.use('/todo', todoPageRouter);`
    - `app.use('/api/v1/todos', todoApiRouter);`
- **確認コマンド**: 開発サーバーを起動（`npm run dev`等）し、別ターミナルで `curl -i http://localhost:3000/api/v1/todos` を実行。
- **期待結果**: `HTTP/1.1 200 OK` と `{"data":[]}` というJSONレスポンスが返ってくること。
- **失敗時に最初に見る場所**: `index.ts` 内での `app.use` の記述順序（エラーハンドリングミドルウェアより前に書かれているか）。

## 工程7: フロントエンド - EJSテンプレートの作成
ユーザーが操作する画面のマークアップを作成します。

- **対象ファイル**: `views/todo/index.ejs` (新規)
- **作業内容**:
  - TODOアプリの基本UI（タイトル入力用input、追加button、エラーメッセージ表示用div、TODO一覧表示用ul）をHTMLで記述します。
  - 既存のレイアウト（ヘッダー/フッター等）があればそれを読み込みます。
  - ページ下部で `/todo/TodoApi.js` と `/todo/main.js` を読み込む `<script>` タグを配置します。
- **確認コマンド**: ブラウザで `http://localhost:3000/todo` にアクセス。
- **期待結果**: TODOのUIが表示されること。（コンソールにJSの404エラーが出るのは次工程で解消するため許容）
- **失敗時に最初に見る場所**: `app.set('views', ...)` で指定されているディレクトリ階層と、実際の `todo/index.ejs` の配置場所。

## 工程8: フロントエンド - API通信クラスの作成
フロントエンドからバックエンドAPIを呼び出す専用クラスを作成します。

- **対象ファイル**: `public/todo/TodoApi.js` (新規)
- **作業内容**:
  - `TodoApi` クラスを定義し、`fetchTodos()`, `createTodo(title)`, `updateStatus(id, completed)`, `deleteTodo(id)` メソッドを実装します。
  - `fetch` 関数を使用し、レスポンスの `ok` プロパティが偽の場合は例外をスロー（`throw new Error(...)`）するエラーハンドリングを実装します。
- **確認コマンド**: ブラウザの開発者ツールのConsoleタブで、`const api = new TodoApi(); api.fetchTodos().then(console.log);` を実行。
- **期待結果**: サーバーから空の配列 `{ data: [] }` が取得でき、コンソールに表示されること。
- **失敗時に最初に見る場所**: Fetch APIのURL指定（`/api/v1/todos`）のタイポ、JSONパース（`res.json()`）の書き忘れ。

## 工程9: フロントエンド - UI制御スクリプトの作成
画面とAPI通信を繋ぎ、動的なアプリケーションとして完成させます。

- **対象ファイル**: `public/todo/main.js` (新規)
- **作業内容**:
  - `DOMContentLoaded` イベントで初期表示処理（`TodoApi` のインスタンス化、一覧取得、リスト描画）を実装します。
  - 追加ボタンの `click` イベントを購読し、API呼び出し後に一覧を再描画（またはDOM要素を追加）します。
  - リスト内のチェックボックス操作（`change` イベント）および削除ボタン（`click` イベント）に対するAPI呼び出しと画面更新処理を実装します。
  - エラー発生時はエラー領域にテキストを表示し、数秒後に消すなどの処理を入れます。
- **確認コマンド**: ブラウザで `http://localhost:3000/todo` を開き、TODOの追加・チェック・削除の一連の操作を行う。
- **期待結果**: 全ての操作が画面リロードなしで即座に反映され、ブラウザをリロードしても操作後の状態が維持されていること。
- **失敗時に最初に見る場所**: ブラウザの開発者ツールのConsoleタブ（JSの構文エラーや未定義変数アクセス）、Networkタブ（リクエスト内容とレスポンスエラーの詳細）。