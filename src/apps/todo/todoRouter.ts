import {Router} from "express";
import {
  getTodosHandler,
  createTodoHandler,
  updateTodoHandler,
  deleteTodoHandler,
} from "./todoController";

export const todoRouter = Router();

// ------------------------------
// 画面表示用ルーティング
// ------------------------------
// GET /todo - TODO画面のレンダリング
todoRouter.get('/todo', (_req, res) => {
  res.render('todo/index');
});

// REQ-01 一覧取得
todoRouter.get("/", getTodosHandler);

// REQ-02 登録
todoRouter.post("/", createTodoHandler);

// REQ-03 完了状態の部分更新
todoRouter.patch("/:id", updateTodoHandler);

// REQ-04 削除
todoRouter.delete("/:id", deleteTodoHandler);
