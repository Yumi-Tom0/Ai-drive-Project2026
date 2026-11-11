import {Router} from "express";
import {
  getTodosV2Handler,
  createTodoV2Handler,
  updateTodoV2Handler,
  deleteTodoV2Handler,
} from "./todoControllerV2";

export const todoRouterV2 = Router();

// 一覧取得 (条件指定対応)
todoRouterV2.get("/", getTodosV2Handler);

// 新規登録
todoRouterV2.post("/", createTodoV2Handler);

// 部分更新
todoRouterV2.patch("/:id", updateTodoV2Handler);

// 削除
todoRouterV2.delete("/:id", deleteTodoV2Handler);
