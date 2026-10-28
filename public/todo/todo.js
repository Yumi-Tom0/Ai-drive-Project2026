/**
 * TODO API クラス
 * バックエンド API ( /api/v1/todos ) と通信を担当
 */
class TodoApi {
  constructor(baseUrl = "/api/v1/todos") {
    this.baseUrl = baseUrl;
  }

  // REQ-01 一覧取得
  async list() {
    const res = await fetch(this.baseUrl);
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "一覧の取得に失敗しました");
    }
    return result.data;
  }

  // REQ-02 新規登録
  async create(title) {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({title}),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "登録に失敗しました");
    }
    return result.data;
  }

  // REQ-03 完了状態の更新
  async update(id, isCompleted) {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: "PATCH",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({isCompleted}),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "更新に失敗しました");
    }
    return result.data;
  }

  // REQ-04 削除
  async delete(id) {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      let message = "削除に失敗しました";
      try {
        const result = await res.json();
        message = result.message || message;
      } catch (_) {}
      throw new Error(message);
    }
    // 204 No Content のため json() は呼ばずに true を返す
    return true;
  }
}

// ------------------------------
// 画面制御・DOM操作
// ------------------------------
const api = new TodoApi();

// DOM要素参照
const todoForm = document.getElementById("todo-form");
const todoTitleInput = document.getElementById("todo-title");
const todoListEl = document.getElementById("todo-list");
const messageEl = document.getElementById("message");
const totalCountEl = document.getElementById("total-count");
const completedCountEl = document.getElementById("completed-count");

/**
 * メッセージを表示する補助関数
 */
function showMessage(text, isError = false) {
  messageEl.textContent = text;
  messageEl.className = `message ${isError ? "error" : "success"}`;
  messageEl.style.display = "block";
  setTimeout(() => {
    messageEl.style.display = "none";
  }, 4000);
}

/**
 * 件数カウントを更新
 */
function updateCounts(todos) {
  totalCountEl.textContent = todos.length;
  const completed = todos.filter((t) => t.isCompleted).length;
  completedCountEl.textContent = completed;
}

/**
 * TODOリストを描画する関数 (XSS対策のため textContent を使用)
 */
function renderTodoList(todos) {
  todoListEl.innerHTML = "";

  if (todos.length === 0) {
    const emptyLi = document.createElement("li");
    emptyLi.className = "empty-message";
    emptyLi.textContent = "TODOがありません";
    todoListEl.appendChild(emptyLi);
    updateCounts([]);
    return;
  }

  todos.forEach((todo) => {
    const li = document.createElement("li");
    li.className = `todo-item ${todo.isCompleted ? "completed" : ""}`;

    // チェックボックス (完了切り替え)
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.isCompleted;
    checkbox.addEventListener("change", async () => {
      try {
        await api.update(todo.id, checkbox.checked);
        await loadAndRenderTodos();
      } catch (err) {
        showMessage(err.message, true);
        checkbox.checked = !checkbox.checked; // 元に戻す
      }
    });

    // タイトルテキスト
    const titleSpan = document.createElement("span");
    titleSpan.className = "todo-title";
    titleSpan.textContent = todo.title; // 安全にエスケープ描画

    // 削除ボタン
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-delete";
    deleteBtn.textContent = "削除";
    deleteBtn.addEventListener("click", async () => {
      try {
        await api.delete(todo.id);
        showMessage("削除しました");
        await loadAndRenderTodos();
      } catch (err) {
        showMessage(err.message, true);
      }
    });

    li.appendChild(checkbox);
    li.appendChild(titleSpan);
    li.appendChild(deleteBtn);
    todoListEl.appendChild(li);
  });

  updateCounts(todos);
}

/**
 * TODO一覧を再取得して描画
 */
async function loadAndRenderTodos() {
  try {
    const todos = await api.list();
    renderTodoList(todos);
  } catch (err) {
    showMessage(err.message, true);
  }
}

// フォーム送信イベント (新規登録)
todoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = todoTitleInput.value.trim();

  if (!title) {
    showMessage("タイトルを入力してください", true);
    return;
  }

  try {
    await api.create(title);
    todoTitleInput.value = "";
    showMessage("登録しました");
    await loadAndRenderTodos();
  } catch (err) {
    showMessage(err.message, true);
  }
});

// 初期表示時にTODO一覧を取得
document.addEventListener("DOMContentLoaded", loadAndRenderTodos);
