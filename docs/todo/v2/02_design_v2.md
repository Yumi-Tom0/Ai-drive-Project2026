# TODOアプリ V2 詳細設計書

ファイルパス: `docs/todo/v2/02_design_v2.md`

## 1. データベース設計

### テーブル名: `v2_todo_tasks`

| カラム名 | 型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY, GENERATED ALWAYS AS IDENTITY` | 自動採番ID |
| `title` | `TEXT` | `NOT NULL, CHECK (1..100文字, トリム後空不可)` | TODOタイトル |
| `is_completed` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | 完了フラグ |
| `priority` | `TEXT` | `NOT NULL DEFAULT 'normal', CHECK (IN ('low', 'normal', 'high'))` | 優先度 |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT NOW()` | 作成日時 |

---

## 2. API 仕様 (`/api/v2/todos`)

### 2.1 GET `/api/v2/todos` (一覧取得・絞り込み)

* **クエリパラメータ**:
  * `completed` (任意): `'true'` | `'false'`
  * `priority` (任意): `'low'` | `'normal'` | `'high'`
* **ステータスコード & レスポンス**:
  * **200 OK**:
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": 1,
          "title": "タスク名",
          "isCompleted": false,
          "priority": "high",
          "createdAt": "2026-11-04T00:00:00.000Z"
        }
      ]
    }
    ```
  * **400 Bad Request**: `completed` に `'true'`/`'false'` 以外の値が指定された場合
  * **422 Unprocessable Entity**: `priority` に許容値外の値が指定された場合

### 2.2 POST `/api/v2/todos` (新規登録)

* **リクエストボディ**:
  ```json
  {
    "title": "買い物に行く",
    "priority": "high" // 任意（デフォルト: "normal"）
  }
  ```
* **ステータスコード**:
  * **201 Created**: 登録成功
  * **400 Bad Request**: `title` が存在しない、または文字列でない場合
  * **422 Unprocessable Entity**: `title` が空文字・100文字超、または `priority` が不正値の場合

### 2.3 PATCH `/api/v2/todos/:id` (部分更新)

* **リクエストボディ** (`isCompleted`, `priority` の少なくとも一方が必要):
  ```json
  {
    "isCompleted": true,
    "priority": "low"
  }
  ```
* **ステータスコード**:
  * **200 OK**: 更新成功
  * **400 Bad Request**: IDが不正、または更新対象のプロパティが一切指定されていない場合
  * **422 Unprocessable Entity**: `priority` の値が不正な場合
  * **404 Not Found**: 対象IDが存在しない場合

### 2.4 DELETE `/api/v2/todos/:id` (削除)

* **ステータスコード**:
  * **204 No Content**: 削除成功（本文なし）
  * **400 Bad Request**: IDが不正な場合
  * **404 Not Found**: 対象IDが存在しない場合

---

## 3. エラーコード定義表

| ステータス | code | 条件 |
| :--- | :--- | :--- |
| `400` | `BAD_REQUEST` | クエリ形式不正、JSON破綻、ID範囲外、必須フィールド欠落 |
| `422` | `VALIDATION_ERROR` | タイトル文字数違反、許容外の priority 値指定 |
| `404` | `NOT_FOUND` | 指定された ID のレコードが存在しない |
| `500` | `INTERNAL_ERROR` | DBエラー等の予期せぬ内部エラー |

---

## 4. フロントエンド設計 (`TodoApiV2`)

`public/todo/todo_v2.js` にて `TodoApiV2` クラスを定義する。

```javascript
class TodoApiV2 {
  constructor(baseUrl = '/api/v2/todos') {
    this.baseUrl = baseUrl;
  }
  async list(completed, priority) { /* GET /api/v2/todos?completed=...&priority=... */ }
  async create(title, priority = 'normal') { /* POST /api/v2/todos */ }
  async update(id, { isCompleted, priority }) { /* PATCH /api/v2/todos/:id */ }
  async delete(id) { /* DELETE /api/v2/todos/:id */ }
}
```