import {Request, Response} from "express";
import {
  getAllTodos,
  createTodo,
  updateTodoStatus,
  deleteTodo,
} from "./todoModel";

/**
 * REQ-01: GET /api/v1/todos - TODO一覧取得
 */
export async function getTodosHandler(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const todos = await getAllTodos();
    res.status(200).json({
      status: "success",
      data: todos,
    });
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({
      status: "error",
      code: "INTERNAL_ERROR",
      message: "内部エラーが発生しました",
      details: [],
    });
  }
}

/**
 * REQ-02: POST /api/v1/todos - TODO新規登録
 */
export async function createTodoHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const {title} = req.body;

    // 1. 必須・型チェック（未定義または文字列以外は400 BAD_REQUEST）
    if (typeof title !== "string") {
      res.status(400).json({
        status: "error",
        code: "BAD_REQUEST",
        message: "title は必須であり文字列で指定してください",
        details: [],
      });
      return;
    }

    // 前後の空白を除去
    const trimmedTitle = title.trim();

    // 2. 文字数チェック（空白のみ、または101文字以上は422 VALIDATION_ERROR）
    if (trimmedTitle.length === 0 || trimmedTitle.length > 100) {
      res.status(422).json({
        status: "error",
        code: "VALIDATION_ERROR",
        message: "title は前後の空白を除いて1〜100文字で指定してください",
        details: [],
      });
      return;
    }

    // 3. DB登録実行
    const newTodo = await createTodo(trimmedTitle);

    res.status(201).json({
      status: "success",
      data: newTodo,
    });
  } catch (error) {
    console.error("Error creating todo:", error);
    res.status(500).json({
      status: "error",
      code: "INTERNAL_ERROR",
      message: "内部エラーが発生しました",
      details: [],
    });
  }
}

/**
 * REQ-03: PATCH /api/v1/todos/:id - 完了状態の部分更新
 */
export async function updateTodoHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const rawId = req.params.id;
    const id = Number(rawId);

    // 1. IDの数値・範囲チェック（1未満や非整数、NaNは400 BAD_REQUEST）
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({
        status: "error",
        code: "BAD_REQUEST",
        message: "IDは1以上の整数で指定してください",
        details: [],
      });
      return;
    }

    const {isCompleted} = req.body;

    // 2. isCompleted の存在・型チェック（boolean型以外は400 BAD_REQUEST）
    if (typeof isCompleted !== "boolean") {
      res.status(400).json({
        status: "error",
        code: "BAD_REQUEST",
        message: "isCompleted は boolean 型で指定してください",
        details: [],
      });
      return;
    }

    // 3. DB更新実行
    const updatedTodo = await updateTodoStatus(id, isCompleted);

    // 4. 存在しないIDの場合は 404 NOT_FOUND
    if (!updatedTodo) {
      res.status(404).json({
        status: "error",
        code: "NOT_FOUND",
        message: "指定されたIDのTODOが見つかりません",
        details: [],
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: updatedTodo,
    });
  } catch (error) {
    console.error("Error updating todo:", error);
    res.status(500).json({
      status: "error",
      code: "INTERNAL_ERROR",
      message: "内部エラーが発生しました",
      details: [],
    });
  }
}

/**
 * REQ-04: DELETE /api/v1/todos/:id - TODO削除
 */
export async function deleteTodoHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const rawId = req.params.id;
    const id = Number(rawId);

    // 1. IDの数値・範囲チェック（1未満や非整数、NaNは400 BAD_REQUEST）
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({
        status: "error",
        code: "BAD_REQUEST",
        message: "IDは1以上の整数で指定してください",
        details: [],
      });
      return;
    }

    // 2. DB削除実行
    const deleted = await deleteTodo(id);

    // 3. 存在しないIDの場合は 404 NOT_FOUND
    if (!deleted) {
      res.status(404).json({
        status: "error",
        code: "NOT_FOUND",
        message: "指定されたIDのTODOが見つかりません",
        details: [],
      });
      return;
    }

    // 4. 削除成功時は 204 No Content（本文なし）
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting todo:", error);
    res.status(500).json({
      status: "error",
      code: "INTERNAL_ERROR",
      message: "内部エラーが発生しました",
      details: [],
    });
  }
}
