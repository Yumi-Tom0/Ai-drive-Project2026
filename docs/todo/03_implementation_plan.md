# TODOアプリ V1 実装手順書

ファイルパス: `docs/todo/03_implementation_plan.md`

## 概要
本手順書は、`docs/todo/01_requirements.md` および `docs/todo/02_design.md` に基づき、TODO管理機能を小分けの工程で安全に実装するための手順です。
既存の `index.ts` や `db.ts` を破損させないよう、1工程ごとに動作確認を行いながら実装を進めます。

---

## 機能ごとの完了定義（受け入れ判定基準）

* **REQ-01 一覧取得**: データ0件ならGET `/api/v1/todos` の `data` が空配列になり、画面に「TODOがありません」と表示されること。
* **REQ-02 登録**: 1〜100文字のタイトルを送信すると `201` が返り、画面およびDBの一覧に登録したTODOが正しく追加されること。
* **REQ-03 完了状態の部分更新**: 対象IDへ `isCompleted` を送信すると `200` が返り、該当TODOの完了状態が切り替わること。
* **REQ-04 削除**: 対象IDを指定して削除すると `204`（本文なし）が返り、画面およびDBから該当TODOが消去されること。

---

## 実装工程一覧

### 工程1: 作業ブランチの作成と環境確認
* **対象ファイル**: なし
* **作業内容**: `main` ブランチを最新化し、作業用ブランチ `feature/todo-app` を作成・切り替え後にローカル環境の正常動作を確認する。
* **確認コマンド**:
  ```bash
  git switch main
  git pull origin main
  git switch -c feature/todo-app
  npm ci
  npm run build
  npm run dev
  ```
* **期待結果**: エラーなくビルド・起動し、`http://localhost:3000/` および `/api/db-check` が正常に開けること。
* **失敗時に最初に見る場所**: `.env` の `DATABASE_URL` 設定、ターミナルの起動ログ。

---

### 工程2: SQLファイルの作成とGit保存
* **対象ファイル**: `sql/todo/020_create_todo_tasks.sql`
* **作業内容**: テーブル作成用SQLファイルを作成し、`todo_tasks` テーブルのDDLを記述してGit管理下に追加する。
* **確認コマンド**:
  ```bash
  git status