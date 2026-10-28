# TODOアプリ V1 設計書

ファイルパス: `docs/todo/02_design.md`

## 1 作るものとファイルの役割

本設計書は `docs/todo/01_requirements.md` の各要件（REQ-01〜REQ-04）に基づき、TODO管理機能の構造および実装詳細を定義します[cite: 1, 1]。

### ファイル構成（授業テキストに合わせた配置）
* `index.ts`: 既存のTOP（`/`）および接続確認（`/api/db-check`）ルートを残し、`express.json()` の後に `app.use('/api/v1/todos', todoRouter)` でルーティングを登録する[cite: 1, 1]。不正JSONをハンドリングするミドルウェアを追加する[cite: 1]。
* `db.ts`: 既存のPostgreSQL接続処理および `DATABASE_URL` を利用する[cite: 1, 1]。
* `src/apps/todo/todoRouter.ts`: API（`/api/v1/todos`）および画面表示（`/todo`）のルーティングを定義する[cite: 1, 1]。
* `src/apps/todo/todoController.ts`: リクエストの検証（バリデーション）、HTTPステータスおよびレスポンスJSONの生成、エラーハンドリングを行う[cite: 1, 1]。
* `src/apps/todo/todoModel.ts`: パラメーター化クエリ（`$1` 等）によるDB操作、およびDB列名（snake_case）とJSONプロパティ名（camelCase）の相互変換を行う[cite: 1, 1]。
* `views/todo/index.ejs`: TODO画面のHTMLテンプレート[cite: 1, 1]。入力フォーム、未完了一覧、完了操作、削除操作、処理中・エラー・0件表示を備える[cite: 1]。
* `public/todo/todo.js`: クライアント側のDOM操作および通信処理を集約した `TodoApi` クラスを実装する[cite: 1, 1]。
* `sql/todo/020_create_todo_tasks.sql`: テーブル定義SQL[cite: 1, 1]。
* `docs/todo/`: 関連ドキュメント（01_requirements.md, 02_design.md, 03_implementation_plan.md, 04_test_results.md）[cite: 1, 1]。

---

## 2 リクエストはどこを通るか

リクエスト処理の流れ（シーケンス）は以下の通りです[cite: 1]。

1. **画面アクセス (`GET /todo`)**:
   ブラウザ → `index.ts` → `todoRouter` (`GET /todo`) → `todoController` → `views/todo/index.ejs` をレンダリングして返却[cite: 1, 1]。
2. **APIアクセス (`/api/v1/todos`)**:
   ブラウザ (`public/todo/todo.js` 内の `TodoApi`) → `index.ts` (`express.json()` ミドルウェア通過) → `todoRouter` (`/api/v1/todos`) → `todoController` (入力不備の検知) → `todoModel` (SQL実行) → `db.ts` (Neon DB) → 統一フォーマットのJSONレスポンスを返却[cite: 1, 1]。

---

## 3 DBの設計

### 3.1 テーブル定義 (`todo_tasks`)
* **テーブル名**: `todo_tasks`[cite: 1, 1]
* **SQLスクリプト配置**: `sql/todo/020_create_todo_tasks.sql`[cite: 1, 1]

```sql
CREATE TABLE IF NOT EXISTS todo_tasks (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL CHECK (
    char_length(title) BETWEEN 1 AND 100
    AND char_length(btrim(title)) > 0
  ),
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```[cite: 1]

### 3.2 SQL設計方針
* SQLクエリはすべてパラメーター化（`$1`, `$2` 等のプレースホルダ）を使用し、SQLインジェクションを防止する[cite: 1]。
* 一覧取得時は `ORDER BY id` を明示する[cite: 1]。
* 登録および更新処理では `RETURNING id, title, is_completed, created_at` を使用して実行結果の行を取得する[cite: 1]。
* 削除処理では `DELETE FROM todo_tasks WHERE id = $1 RETURNING id;` により対象行の有無を判断する[cite: 1]。
* DB列名（snake_case: `is_completed`, `created_at`）とJSONキー（camelCase: `isCompleted`, `createdAt`）の相互変換は `todoModel.ts` 内で行う[cite: 1, 1]。

---

## 4 APIの共通ルール

* **ベースURL**: `/api/v1/todos`[cite: 1, 1]
* **成功時のレスポンス構造（200 / 201）**:
  ```json
  {
    "status": "success",
    "data": ...
  }
  ```[cite: 1]
* **DELETE成功時 (204)**: ステータスコード `204 No Content` を返し、レスポンス本文は空（JSONとして解析しない）とする[cite: 1, 1]。
* **エラー時の統一レスポンス構造（400 / 422 / 404 / 500 / 503）**:
  ```json
  {
    "status": "error",
    "code": "エラーコード",
    "message": "エラーメッセージ",
    "details": []
  }
  ```[cite: 1]
  ※ 内部のSQL文や接続文字列などはレスポンスに含めず、ログに出力する[cite: 1]。

---

## 5 機能別詳細設計

### 5.1 REQ-01 TODO一覧を取得する
| 項目 | 内容 |
| :--- | :--- |
| **参照要件** | REQ-01 一覧取得[cite: 1] |
| **HTTPメソッド / URL** | `GET /api/v1/todos`[cite: 1] |
| **リクエスト本文** | なし[cite: 1] |
| **成功ステータス / JSON例** | `200 OK`<br>`{"status":"success","data":[{"id":1,"title":"課題を提出する","isCompleted":false,"createdAt":"2026-10-14T00:00:00.000Z"}]}`<br>※ 0件時は `{"status":"success","data":[]}`[cite: 1] |
| **失敗ステータス / JSON例** | `500 INTERNAL_ERROR` または `503 DB_UNAVAILABLE`<br>`{"status":"error","code":"INTERNAL_ERROR","message":"内部エラーが発生しました","details":[]}`[cite: 1] |
| **DB処理 (SQL)** | `SELECT id, title, is_completed, created_at FROM todo_tasks ORDER BY id;`[cite: 1] |
| **TodoApiメソッド** | `TodoApi.list()`[cite: 1] |
| **確認方法** | ブラウザConsoleで `const list = await fetch('/api/v1/todos'); console.log(list.status, await list.json());` を実行し、200と `data` 配列を確認する[cite: 1]。 |

### 5.2 REQ-02 TODOを登録する
| 項目 | 内容 |
| :--- | :--- |
| **参照要件** | REQ-02 登録[cite: 1] |
| **HTTPメソッド / URL** | `POST /api/v1/todos`[cite: 1] |
| **リクエスト本文** | `{"title":"課題を提出する"}`[cite: 1] |
| **成功ステータス / JSON例** | `201 Created`<br>`{"status":"success","data":{"id":1,"title":"課題を提出する","isCompleted":false,"createdAt":"2026-10-14T00:00:00.000Z"}}`[cite: 1] |
| **失敗ステータス / JSON例** | `400 BAD_REQUEST`（JSON不正、`title` の欠落、型違い）<br>`422 VALIDATION_ERROR`（前後空白除去後の `title` が空文字、または101文字以上）<br>`500 INTERNAL_ERROR` / `503 DB_UNAVAILABLE`[cite: 1] |
| **DB処理 (SQL)** | `INSERT INTO todo_tasks (title) VALUES ($1) RETURNING id, title, is_completed, created_at;` ※$1は前後の空白を除去(trim)した文字列[cite: 1] |
| **TodoApiメソッド** | `TodoApi.create(title)`[cite: 1] |
| **確認方法** | ブラウザConsoleで `POST` リクエストを送信し、201と作成されたIDを含むTODOオブジェクトを確認する[cite: 1]。 |

### 5.3 REQ-03 完了状態を変える
| 項目 | 内容 |
| :--- | :--- |
| **参照要件** | REQ-03 完了状態の部分更新[cite: 1] |
| **HTTPメソッド / URL** | `PATCH /api/v1/todos/:id`[cite: 1] |
| **リクエスト本文** | `{"isCompleted":true}`[cite: 1] |
| **成功ステータス / JSON例** | `200 OK`<br>`{"status":"success","data":{"id":1,"title":"課題を提出する","isCompleted":true,"createdAt":"2026-10-14T00:00:00.000Z"}}`[cite: 1] |
| **失敗ステータス / JSON例** | `400 BAD_REQUEST`（不正なID形式［1未満や非整数］、`isCompleted` の欠落・型違い）<br>`404 NOT_FOUND`（対象のIDが存在しない）<br>`500 INTERNAL_ERROR` / `503 DB_UNAVAILABLE`[cite: 1] |
| **DB処理 (SQL)** | `UPDATE todo_tasks SET is_completed = $1 WHERE id = $2 RETURNING id, title, is_completed, created_at;`[cite: 1] |
| **TodoApiメソッド** | `TodoApi.update(id, isCompleted)`[cite: 1] |
| **確認方法** | ブラウザConsoleで登録済みのIDに対して `PATCH` を送信し、200と `isCompleted` が変更されたオブジェクトを確認する[cite: 1]。 |

### 5.4 REQ-04 TODOを削除する
| 項目 | 内容 |
| :--- | :--- |
| **参照要件** | REQ-04 削除[cite: 1] |
| **HTTPメソッド / URL** | `DELETE /api/v1/todos/:id`[cite: 1] |
| **リクエスト本文** | なし[cite: 1] |
| **成功ステータス / JSON例** | `204 No Content`（レスポンス本文なし）[cite: 1] |
| **失敗ステータス / JSON例** | `400 BAD_REQUEST`（不正なID形式）<br>`404 NOT_FOUND`（対象のIDが存在しない）<br>`500 INTERNAL_ERROR` / `503 DB_UNAVAILABLE`[cite: 1] |
| **DB処理 (SQL)** | `DELETE FROM todo_tasks WHERE id = $1 RETURNING id;`[cite: 1] |
| **TodoApiメソッド** | `TodoApi.delete(id)`[cite: 1] |
| **確認方法** | ブラウザConsoleで `DELETE` を実行し、ステータス204を確認する（`res.json()` は呼ばない）[cite: 1]。 |

---

## 6 画面とTodoApiの設計

### 6.1 TodoApi クラスの設計 (`public/todo/todo.js`)
ブラウザ側のAPI呼び出しを集約・抽象化します[cite: 1]。画面イベントハンドラー内でAPI URLを重複記述しません[cite: 1]。

```javascript
class TodoApi {
  constructor(baseUrl = '/api/v1/todos') {
    this.baseUrl = baseUrl;
  }

  async list() {
    const res = await fetch(this.baseUrl);
    const body = await res.json();
    if (!res.ok) throw body;
    return body.data; // 配列を返す
  }

  async create(title) {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    const body = await res.json();
    if (!res.ok) throw body;
    return body.data; // 登録されたTODOを返す
  }

  async update(id, isCompleted) {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCompleted })
    });
    const body = await res.json();
    if (!res.ok) throw body;
    return body.data; // 更新されたTODOを返す
  }

  async delete(id) {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const body = await res.json();
      throw body;
    }
    // 204時はres.json()を解析せずに正常終了する
  }
}
```[cite: 1]

### 6.2 画面（`views/todo/index.ejs`）およびDOM操作の設計
* **主要要素**: 入力フォーム、未完了一覧表示エリア、完了切り替え操作（チェックボックス/ボタン）、削除ボタン、状態表示エリア（処理中、エラー、0件メッセージ）[cite: 1]。
* **描画時の安全対策**: 動的な文字列表示には `textContent` を使用し、スクリプト注入を防止する[cite: 1]。
* **操作後の画面更新**: 各操作完了後に `TodoApi.list()` を実行して一覧を再取得・表示更新する[cite: 1]。

---

## 7 エラーはどこで処理するか

1. **不正JSON（ミドルウェア段階）**:
   `express.json()` で構文エラーが発生した場合、アプリが標準HTMLエラー画面を返さず、ステータス `400` と統一JSON `{"status":"error","code":"BAD_REQUEST",...}` を返すエラーハンドラを `index.ts` に追加する[cite: 1]。
2. **コントローラー段階（`todoController.ts`）**:
   必須項目欠落、型違い、1未満・非整数のID形式は `400`（`BAD_REQUEST`）、空白のみや101文字以上のタイトルは `422`（`VALIDATION_ERROR`）としてレスポンスを生成する[cite: 1]。
3. **モデル / DB段階（`todoModel.ts`）**:
   UPDATE/DELETE操作時に対象行が存在しない場合は `404`（`NOT_FOUND`）を返し、DB接続タイムアウトやクエリエラーは `500`（`INTERNAL_ERROR`）または `503`（`DB_UNAVAILABLE`）として制御する[cite: 1]。接続文字列やSQLエラー詳細はログに留め、画面・API応答には含めない[cite: 1]。
4. **ブラウザ段階（`public/todo/todo.js`）**:
   `TodoApi` 内で `res.ok` を評価し、エラー発生時はレスポンスJSON（`code`, `message`）を `throw` する[cite: 1]。画面側イベント処理で `catch` し、ユーザーへメッセージを表示する[cite: 1]。

---

## 8 実装への注意事項

1. **`index.ts` の変更を最小限にする**:
   ```typescript
   // express.json() の後に登録（既存ルートより前に評価されないよう注意）
   app.use(express.json());
   app.use('/api/v1/todos', todoRouter);
   ```[cite: 1]
   既存の `/` および `/api/db-check` のルート定義は消さずに残す[cite: 1, 1]。
2. **ビルドと起動手順**:
   `npm run build` → `npm start` を実行し、コンパイル後の環境で EJS、CSS、JavaScript（`public/todo/todo.js`）が正しく配信されることを確認する[cite: 1]。
3. **進捗とドキュメントの同期**:
   作業単位ごとに変更箇所・テスト結果を `docs/todo/03_implementation_plan.md` および `docs/todo/04_test_results.md` に追記して管理する[cite: 1]。