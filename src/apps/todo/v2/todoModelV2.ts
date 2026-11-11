import {pool} from "../../../../db";

export type Priority = "low" | "normal" | "high";

export interface TodoV2 {
  id: number;
  title: string;
  isCompleted: boolean;
  priority: Priority;
  createdAt: string;
}

interface TodoV2Row {
  id: number;
  title: string;
  is_completed: boolean;
  priority: Priority;
  created_at: Date;
}

function mapRowToTodoV2(row: TodoV2Row): TodoV2 {
  return {
    id: row.id,
    title: row.title,
    isCompleted: row.is_completed,
    priority: row.priority,
    createdAt: row.created_at.toISOString(),
  };
}

/**
 * REQ-V2-02: 条件指定付きTODO一覧取得
 */
export async function getTodosV2(filter?: {
  completed?: boolean;
  priority?: Priority;
}): Promise<TodoV2[]> {
  const conditions: string[] = [];
  const params: any[] = [];

  if (filter?.completed !== undefined) {
    params.push(filter.completed);
    conditions.push(`is_completed = $${params.length}`);
  }

  if (filter?.priority !== undefined) {
    params.push(filter.priority);
    conditions.push(`priority = $${params.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const query = `
    SELECT id, title, is_completed, priority, created_at
    FROM v2_todo_tasks
    ${whereClause}
    ORDER BY id ASC;
  `;

  const result = await pool.query<TodoV2Row>(query, params);
  return result.rows.map(mapRowToTodoV2);
}

/**
 * REQ-V2-03: TODO新規登録 (優先度付き)
 */
export async function createTodoV2(
  title: string,
  priority: Priority = "normal",
): Promise<TodoV2> {
  const query = `
    INSERT INTO v2_todo_tasks (title, priority)
    VALUES ($1, $2)
    RETURNING id, title, is_completed, priority, created_at;
  `;
  const result = await pool.query<TodoV2Row>(query, [title, priority]);
  return mapRowToTodoV2(result.rows[0]);
}

/**
 * REQ-V2-04: TODO部分更新 (isCompleted / priority)
 */
export async function updateTodoV2(
  id: number,
  updates: {isCompleted?: boolean; priority?: Priority},
): Promise<TodoV2 | null> {
  const setClauses: string[] = [];
  const params: any[] = [];

  if (updates.isCompleted !== undefined) {
    params.push(updates.isCompleted);
    setClauses.push(`is_completed = $${params.length}`);
  }

  if (updates.priority !== undefined) {
    params.push(updates.priority);
    setClauses.push(`priority = $${params.length}`);
  }

  if (setClauses.length === 0) {
    return null;
  }

  params.push(id);
  const query = `
    UPDATE v2_todo_tasks
    SET ${setClauses.join(", ")}
    WHERE id = $${params.length}
    RETURNING id, title, is_completed, priority, created_at;
  `;

  const result = await pool.query<TodoV2Row>(query, params);
  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToTodoV2(result.rows[0]);
}

/**
 * REQ-V2-05: TODO削除
 */
export async function deleteTodoV2(id: number): Promise<boolean> {
  const query = `
    DELETE FROM v2_todo_tasks
    WHERE id = $1
    RETURNING id;
  `;
  const result = await pool.query<TodoV2Row>(query, [id]);
  return result.rowCount !== null && result.rowCount > 0;
}
