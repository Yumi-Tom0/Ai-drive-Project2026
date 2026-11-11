import {Request, Response} from "express";
import {
  getTodosV2,
  createTodoV2,
  updateTodoV2,
  deleteTodoV2,
  Priority,
} from "./todoModelV2";

const VALID_PRIORITIES: Priority[] = ["low", "normal", "high"];

/**
 * REQ-V2-02: GET /api/v2/todos - 条件指定付き一覧取得
 */
export async function getTodosV2Handler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const {completed, priority} = req.query;
    const filter: {completed?: boolean; priority?: Priority} = {};

    // completed のバリデーション
    if (completed !== undefined) {
      if (completed === "true") {
        filter.completed = true;
      } else if (completed === "false") {
        filter.completed = false;
      } else {
        res.status(400).json({
          status: "error",
          code: "BAD_REQUEST",
          message:
            'completed パラメータは "true" または "false" で指定してください',
          details: [],
        });
        return;
      }
    }

    // priority のバリデーション
    if (priority !== undefined) {
      if (
        typeof priority === "string" &&
        VALID_PRIORITIES.includes(priority as Priority)
      ) {
        filter.priority = priority as Priority;
      } else {
        res.status(422).json({
          status: "error",
          code: "VALIDATION_ERROR",
          message:
            'priority は "low", "normal", "high" のいずれかで指定してください',
          details: [],
        });
        return;
      }
    }

    const todos = await getTodosV2(filter);
    res.status(200).json({
      status: "success",
      data: todos,
    });
  } catch (error) {
    console.error("Error fetching V2 todos:", error);
    res.status(500).json({
      status: "error",
      code: "INTERNAL_ERROR",
      message: "内部エラーが発生しました",
      details: [],
    });
  }
}

/**
 * REQ-V2-03: POST /api/v2/todos - TODO新規登録
 */
export async function createTodoV2Handler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const {title, priority} = req.body;

    if (typeof title !== "string") {
      res.status(400).json({
        status: "error",
        code: "BAD_REQUEST",
        message: "title は必須であり文字列で指定してください",
        details: [],
      });
      return;
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0 || trimmedTitle.length > 100) {
      res.status(422).json({
        status: "error",
        code: "VALIDATION_ERROR",
        message: "title は前後の空白を除いて1〜100文字で指定してください",
        details: [],
      });
      return;
    }

    let targetPriority: Priority = "normal";
    if (priority !== undefined) {
      if (
        typeof priority === "string" &&
        VALID_PRIORITIES.includes(priority as Priority)
      ) {
        targetPriority = priority as Priority;
      } else {
        res.status(422).json({
          status: "error",
          code: "VALIDATION_ERROR",
          message:
            'priority は "low", "normal", "high" のいずれかで指定してください',
          details: [],
        });
        return;
      }
    }

    const newTodo = await createTodoV2(trimmedTitle, targetPriority);
    res.status(201).json({
      status: "success",
      data: newTodo,
    });
  } catch (error) {
    console.error("Error creating V2 todo:", error);
    res.status(500).json({
      status: "error",
      code: "INTERNAL_ERROR",
      message: "内部エラーが発生しました",
      details: [],
    });
  }
}

/**
 * REQ-V2-04: PATCH /api/v2/todos/:id - 部分更新
 */
export async function updateTodoV2Handler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({
        status: "error",
        code: "BAD_REQUEST",
        message: "IDは1以上の整数で指定してください",
        details: [],
      });
      return;
    }

    const {isCompleted, priority} = req.body;

    if (isCompleted === undefined && priority === undefined) {
      res.status(400).json({
        status: "error",
        code: "BAD_REQUEST",
        message:
          "isCompleted または priority の少なくとも一方を指定してください",
        details: [],
      });
      return;
    }

    const updates: {isCompleted?: boolean; priority?: Priority} = {};

    if (isCompleted !== undefined) {
      if (typeof isCompleted !== "boolean") {
        res.status(400).json({
          status: "error",
          code: "BAD_REQUEST",
          message: "isCompleted は boolean 型で指定してください",
          details: [],
        });
        return;
      }
      updates.isCompleted = isCompleted;
    }

    if (priority !== undefined) {
      if (
        typeof priority === "string" &&
        VALID_PRIORITIES.includes(priority as Priority)
      ) {
        updates.priority = priority as Priority;
      } else {
        res.status(422).json({
          status: "error",
          code: "VALIDATION_ERROR",
          message:
            'priority は "low", "normal", "high" のいずれかで指定してください',
          details: [],
        });
        return;
      }
    }

    const updatedTodo = await updateTodoV2(id, updates);
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
    console.error("Error updating V2 todo:", error);
    res.status(500).json({
      status: "error",
      code: "INTERNAL_ERROR",
      message: "内部エラーが発生しました",
      details: [],
    });
  }
}

/**
 * REQ-V2-05: DELETE /api/v2/todos/:id - 削除
 */
export async function deleteTodoV2Handler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({
        status: "error",
        code: "BAD_REQUEST",
        message: "IDは1以上の整数で指定してください",
        details: [],
      });
      return;
    }

    const deleted = await deleteTodoV2(id);
    if (!deleted) {
      res.status(404).json({
        status: "error",
        code: "NOT_FOUND",
        message: "指定されたIDのTODOが見つかりません",
        details: [],
      });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting V2 todo:", error);
    res.status(500).json({
      status: "error",
      code: "INTERNAL_ERROR",
      message: "内部エラーが発生しました",
      details: [],
    });
  }
}
