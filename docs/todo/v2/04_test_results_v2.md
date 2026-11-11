# TODOアプリ V2 テスト結果記録書

ファイルパス: `docs/todo/v2/04_test_results_v2.md`

## 1. 実施概要

* **実施日**: 2026-11-04 (予定)

* **実施者**: 開発担当者

* **対象ブランチ**: `feature/todo-v2`

* **動作環境**: Local (`http://localhost:3000`), Vercel Preview, Vercel Production

## 2. テスト項目と結果一覧

### 2.1 V2 API / 画面テスト

| No | テスト内容 | 期待結果 | Local | Preview | Production | 
| ----- | ----- | ----- | ----- | ----- | ----- | 
| V2-01 | `POST /api/v2/todos` (優先度指定) | `201` 指定優先度で登録されること | 合格 | 未実施 | 未実施 | 
| V2-02 | `POST /api/v2/todos` (優先度省略) | `201` `normal` として登録されること | 合格 | 未実施 | 未実施 | 
| V2-03 | `POST /api/v2/todos` (不正なpriority) | `422 VALIDATION_ERROR` が返ること | 合格 | 未実施 | 未実施 | 
| V2-04 | `GET /api/v2/todos` (条件なし) | `200` 全V2件数が返ること | 合格 | 未実施 | 未実施 | 
| V2-05 | `GET /api/v2/todos?completed=false&priority=high` | `200` 条件に合致するデータのみ返ること | 合格 | 未実施 | 未実施 | 
| V2-06 | `GET /api/v2/todos?completed=invalid` | `400 BAD_REQUEST` が返ること | 合格 | 未実施 | 未実施 | 
| V2-07 | `PATCH /api/v2/todos/:id` (priority更新) | `200` 優先度が更新されること | 合格 | 未実施 | 未実施 | 
| V2-08 | `PATCH /api/v2/todos/:id` (不正なpriority) | `422 VALIDATION_ERROR` が返ること | 合格 | 未実施 | 未実施 | 
| V2-09 | `PATCH /api/v2/todos/999999` (存在しないID) | `404 NOT_FOUND` が返ること | 合格 | 未実施 | 未実施 | 
| V2-10 | `DELETE /api/v2/todos/:id` | `204 No Content` が返ること | 合格 | 未実施 | 未実施 | 
| V2-11 | `/todo-v2` 画面操作 | 登録・絞り込み・更新・削除が正常に行えること | 合格 | 未実施 | 未実施 | 

### 2.2 V1 回帰テスト (壊れていないことの確認)

| No | テスト内容 | 期待結果 | Local | Preview | Production | 
| ----- | ----- | ----- | ----- | ----- | ----- | 
| V1-01 | `GET /api/v1/todos` | `200` V1のデータが返り、影響がないこと | 合格 | 未実施 | 未実施 | 
| V1-02 | `POST /api/v1/todos` | `201` V1の登録が問題なく行えること | 合格 | 未実施 | 未実施 | 
| V1-03 | `/todo` 画面アクセス | 従来通りV1画面が正しく動作すること | 合格 | 未実施 | 未実施 | 
