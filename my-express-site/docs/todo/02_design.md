# TODOアプリ V1 設計書

## 1 作るものとファイルの役割
- **画面**: TODOリストの表示・追加・状態変更・削除を行うWeb画面 (`/todo`)
- **API**: フロントエンドから呼び出されるREST API (`/api/v1/todos`)

### ファイル構成（授業テキストに合わせた配置）
既存プロジェクトのディレクトリ構成に合わせた適切な配置を行います。
※以下は仮の配置案であり、実際のディレクトリ・ファイル名については**【要確認】**とします。

- `index.ts`: アプリケーションのエントリポイント（APIおよび画面のルーター追加のみの最小限の修正とする）
- 【要確認】画面用テンプレート (例: `views/todo.ejs` など)
- 【要確認】画面用フロントエンドスクリプト (例: `public/js/todo.js` や `public/js/TodoApi.js` など)
- 【要確認】APIルーティング・コントローラー (例: `routes/todo.ts` や `controllers/todoController.ts` など)
- 【要確認】DB操作ロジック (例: `models/todoModel.ts` など)

## 2 リクエストはどこを通るか
1. ユーザーがブラウザで `/todo` にアクセスし、画面（EJS等）を読み込む。
2. 画面上のユーザー操作（追加、チェック、削除）をフロントエンドJSが検知する。
3. フロントエンドJS (`TodoApi` クラス等) が `Fetch API` を使用してExpressサーバー (`/api/v1/todos`) にリクエストを送信する。
4. Expressのルーターがリクエストを受け取り、コントローラー（またはルートハンドラ）へ処理を渡す。
5. サーバー側でバリデーションを行い、DB (Neon PostgreSQL) に対してSQLクエリを発行する。
6. DBからの結果を受け取り、JSON形式でフロントエンドへレスポンスを返す。
7. フロントエンドJSがレスポンスを受け取り、画面のDOMを更新（エラー時はエラーを表示）する。

## 3 DBの設計
既存のDB (Neon PostgreSQL) にTODO用のテーブルを追加します。

**テーブル名**: `todos`

| カラム名 | データ型 | 制約 | 備考 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER (SERIAL) | PRIMARY KEY | 1以上の整数 |
| `title` | VARCHAR(100) | NOT NULL | 1〜100文字 |
| `completed` | BOOLEAN | NOT NULL DEFAULT FALSE | 完了状態 |
| `created_at` | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | 作成日時 |
| `updated_at` | TIMESTAMP | NOT NULL DEFAULT CURRENT_TIMESTAMP | 更新日時 |

## 4 APIの共通ルール
- **ベースURL**: `/api/v1/todos`
- **リクエスト/レスポンス形式**: `application/json`
- **成功レスポンス**: GET(一覧以外), POST, PATCHの成功時は `{ "data": { ... } }` の形式で単一のオブジェクトを返す。一覧取得は配列を返す。
- **エラーレスポンス**: エラー時は `{ "error": { "code": "...", "message": "..." } }` の形式で返す。
- **ステータスコード基準**:
  - `200 OK`: 成功（取得、部分更新）
  - `201 Created`: 成功（作成）
  - `204 No Content`: 成功（削除、レスポンスボディなし）
  - `400 Bad Request`: 不正なJSON構文、パスパラメータ不正(整数でない等)、必須キー欠落、型違い
  - `404 Not Found`: 操作対象のIDが存在しない
  - `422 Unprocessable Entity`: 業務バリデーション違反（title空文字、101文字以上など）
  - `500 Internal Server Error`: 予期せぬサーバー内部エラー
  - `503 Service Unavailable`: DB接続失敗、クエリタイムアウト等

## 5.1 REQ-01 TODO一覧を取得する
- **メソッド**: `GET`
- **エンドポイント**: `/api/v1/todos`
- **処理**: DBの `todos` テーブルから全件を取得し、IDの昇順で返す。
- **成功レスポンス**: `200 OK`
  ```json
  {
    "data": [
      { "id": 1, "title": "...", "completed": false, "created_at": "...", "updated_at": "..." }
    ]
  }
  ```
  ※ 0件の場合は `{"data": []}` を返す。

## 5.2 REQ-02 TODOを登録する
- **メソッド**: `POST`
- **エンドポイント**: `/api/v1/todos`
- **リクエストボディ**:
  ```json
  { "title": "TODOのタイトル" }
  ```
- **処理**: 前後の空白を除去した上で1〜100文字か検証し、DBに登録する。
- **成功レスポンス**: `201 Created`
  ```json
  {
    "data": { "id": 2, "title": "TODOのタイトル", "completed": false, "created_at": "...", "updated_at": "..." }
  }
  ```

## 5.3 REQ-03 完了状態を変える
- **メソッド**: `PATCH`
- **エンドポイント**: `/api/v1/todos/:id`
- **リクエストボディ**:
  ```json
  { "completed": true }
  ```
- **処理**: `:id` が整数か検証し、対象の存在を確認後、`completed` の値と `updated_at` を更新する。
- **成功レスポンス**: `200 OK`
  ```json
  {
    "data": { "id": 1, "title": "...", "completed": true, "created_at": "...", "updated_at": "..." }
  }
  ```

## 5.4 REQ-04 TODOを削除する
- **メソッド**: `DELETE`
- **エンドポイント**: `/api/v1/todos/:id`
- **処理**: `:id` が整数か検証し、対象の存在を確認後、DBから削除する。
- **成功レスポンス**: `204 No Content` (レスポンスボディなし)

## 6 画面とTodoApiの設計
- **画面**: `/todo` にアクセスした際、TODO一覧画面を表示する。
  - 初期表示時に Fetch API でTODO一覧を取得し、リスト要素をDOMに構築する。
  - エラー発生時に内容を表示する「エラーメッセージ領域」を配置する。
- **TodoApiクラス (フロントエンド)**:
  - 画面からのAPI通信処理を隠蔽するクラスとして設計する。
  - メソッド例: `fetchTodos()`, `createTodo(title)`, `updateStatus(id, completed)`, `deleteTodo(id)`
  - ※これらのフロントエンドスクリプトの具体的なファイル分割ルール（EJS内に直接書くか、外部JSファイルにするかなど）については**【要確認】**。

## 7 エラーはどこで処理するか
- **サーバー側**:
  - APIのエンドポイントで `try...catch` を用い、エラーを捕捉する。
  - 発生したエラーの種類に応じて、共通のエラーレスポンスフォーマット（ステータスコードおよび `{"error": {...}}`）に変換して返す。
- **フロントエンド側**:
  - `TodoApi` クラス内でFetchリクエストを実行後、レスポンスの `ok` プロパティをチェックする。エラーレスポンスの場合は例外をスローする。
  - 画面側のイベント処理部分で例外を `catch` し、画面内のエラーメッセージ領域にエラーテキストを表示する。

## 8 実装への注意事項
- **`index.ts` の変更を最小限に**: ルーティング設定（`/todo` 用の画面ルートと `/api/v1/todos` 用のAPIルートのマウント）の追加のみに留め、具体的な処理ロジックは別ファイルに切り出すこと。
- **入力値のバリデーション徹底**: クライアント側の制御だけでなく、API側でも必ず型・文字数・必須項目等のチェックを行う。
- **ダミーデータの使用**: プレビューや本番環境で動作検証を行う際は、個人情報を含まない架空のダミーデータを使用すること。