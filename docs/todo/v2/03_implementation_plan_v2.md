# TODOアプリ V2 実装手順書

ファイルパス: `docs/todo/v2/03_implementation_plan_v2.md`

## 1. 開発順序

1. **DB環境の構築 (Step 1)**: `sql/todo/021_create_todo_tasks_v2.sql` の作成・Neon実行。
2. **バックエンド実装 (Step 2)**:
   * `src/apps/todo/v2/todoModelV2.ts`
   * `src/apps/todo/v2/todoControllerV2.ts`
   * `src/apps/todo/v2/todoRouterV2.ts`
   * `index.ts` への V2 ルーターおよび `/todo-v2` 画面ルートの追加。
3. **フロントエンド実装 (Step 3)**:
   * `public/todo/todo_v2.js`
   * `views/todo/index_v2.ejs`
4. **ローカルテスト & V1 回帰テスト (Step 4)**:
   * V2 の正常系・異常系テスト。
   * V1 機能（`/todo` および `/api/v1/todos`）が影響を受けていないかの回帰テスト。
5. **Vercel デプロイ & Preview/Production 検証 (Step 5)**.

## 2. チェックリスト

* [ ] `main` から `feature/todo-v2` ブランチを作成したか
* [ ] SQL `021` を Neon で実行し、`v2_todo_tasks` テーブルを作成したか
* [ ] `sql/README.md` に実行ログを記録したか
* [ ] V2 API で 400, 422, 404 エラーが期待通り返るか
* [ ] V1 の API/画面 が依然として問題無く動作するか
* [ ] `docs/todo/v2/04_test_results_v2.md` に全テスト結果を記録したか