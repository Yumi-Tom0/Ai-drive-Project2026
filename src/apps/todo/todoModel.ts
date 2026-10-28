import {pool} from "../../../db";

export interface Todo {
  id: number;
  title: string;
  isCompleted: boolean;
  createdAt: string;
}

// DBの行データ型（snake_case）
interface TodoRow {
  id: number;
  title: string;
  is_completed: boolean;
  created_at: Date;
}

/**
 * DBの行オブジェクト（snake_case）をAPIレスポンス用オブジェクト（camelCase）へ変換
 */
function mapRowToTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    isCompleted: row.is_completed,
    createdAt: row.created_at.toISOString(),
  };
}

/**
 * REQ-01: TODO一覧を取得
 */
export async function getAllTodos(): Promise<Todo[]> {
  const query = `
    SELECT id, title, is_completed, created_at
    FROM todo_tasks
    ORDER BY id ASC;
  `;
  const result = await pool.query<TodoRow>(query);
  return result.rows.map(mapRowToTodo);
}

/**
 * REQ-02: 新規TODOを登録
 * @param title 前後空白除去済みのタイトル文字列
 */
export async function createTodo(title: string): Promise<Todo> {
  const query = `
    INSERT INTO todo_tasks (title)
    VALUES ($1)
    RETURNING id, title, is_completed, created_at;
  `;
  const result = await pool.query<TodoRow>(query, [title]);
  return mapRowToTodo(result.rows[0]);
}

/**
 * REQ-03: TODOの完了状態を更新 (PATCH)
 * @param id 対象TODOのID
 * @param isCompleted 変更後の完了フラグ
 * @returns 更新されたTODO、または存在しない場合はnull
 */
export async function updateTodoStatus(
  id: number,
  isCompleted: boolean,
): Promise<Todo | null> {
  const query = `
    UPDATE todo_tasks
    SET is_completed = $1
    WHERE id = $2
    RETURNING id, title, is_completed, created_at;
  `;
  const result = await pool.query<TodoRow>(query, [isCompleted, id]);

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToTodo(result.rows[0]);
}

/**
 * REQ-04: TODOを削除 (DELETE)
 * @param id 対象TODOのID
 * @returns 削除に成功した場合はtrue、対象が存在しない場合はfalse
 */
export async function deleteTodo(id: number): Promise<boolean> {
  const query = `
    DELETE FROM todo_tasks
    WHERE id = $1
    RETURNING id;
  `;
  const result = await pool.query<TodoRow>(query, [id]);
  return result.rowCount !== null && result.rowCount > 0;
}
