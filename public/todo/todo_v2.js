/**
 * TODO API V2 クラス
 * バックエンド API ( /api/v2/todos ) と通信を担当
 */
class TodoApiV2 {
  constructor(baseUrl = "/api/v2/todos") {
    this.baseUrl = baseUrl;
  }

  // REQ-V2-02 一覧取得 (クエリパラメータ対応)
  async list(filter = {}) {
    const params = new URLSearchParams();
    if (filter.completed !== undefined && filter.completed !== "all") {
      params.append("completed", filter.completed);
    }
    if (filter.priority && filter.priority !== "all") {
      params.append("priority", filter.priority);
    }

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

    const res = await fetch(url);
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "一覧の取得に失敗しました");
    }
    return result.data;
  }

  // REQ-V2-03 新規登録 (優先度対応)
  async create(title, priority = "normal") {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({title, priority}),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "登録に失敗しました");
    }
    return result.data;
  }

  // REQ-V2-04 部分更新 (isCompleted / priority)
  async update(id, updates) {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: "PATCH",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(updates),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "更新に失敗しました");
    }
    return result.data;
  }

  // REQ-V2-05 削除
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
    return true;
  }
}

// ------------------------------
// 画面制御・DOM操作
// ------------------------------
const apiV2 = new TodoApiV2();

// DOM要素参照
const todoForm = document.getElementById("todo-form");
const todoTitleInput = document.getElementById("todo-title");
const todoPrioritySelect = document.getElementById("todo-priority");
const filterStatusSelect = document.getElementById("filter-status");
const filterPrioritySelect = document.getElementById("filter-priority");
const todoListEl = document.getElementById("todo-list");
const messageEl = document.getElementById("message");
const totalCountEl = document.getElementById("total-count");

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
 * 優先度ラベルの日本語変換マッピング
 */
const priorityLabels = {
  high: "高",
  normal: "中",
  low: "低",
};

/**
 * TODOリストを描画する関数 (XSS対策のため textContent を使用)
 */
function renderTodoList(todos) {
  todoListEl.innerHTML = "";

  if (todos.length === 0) {
    const emptyLi = document.createElement("li");
    emptyLi.className = "empty-message";
    emptyLi.textContent = "条件に合うTODOがありません";
    todoListEl.appendChild(emptyLi);
    totalCountEl.textContent = "0";
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
        await apiV2.update(todo.id, {isCompleted: checkbox.checked});
        await loadAndRenderTodos();
      } catch (err) {
        showMessage(err.message, true);
        checkbox.checked = !checkbox.checked;
      }
    });

    // 優先度バッジ (表示用)
    const badge = document.createElement("span");
    badge.className = `badge badge-${todo.priority}`;
    badge.textContent = priorityLabels[todo.priority] || todo.priority;

    // タイトルテキスト
    const titleSpan = document.createElement("span");
    titleSpan.className = "todo-title";
    titleSpan.textContent = todo.title;

    // 優先度変更ドロップダウン
    const prioritySelect = document.createElement("select");
    prioritySelect.className = "priority-change-select";
    ["high", "normal", "low"].forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p;
      opt.textContent = priorityLabels[p];
      if (p === todo.priority) opt.selected = true;
      prioritySelect.appendChild(opt);
    });
    prioritySelect.addEventListener("change", async () => {
      try {
        await apiV2.update(todo.id, {priority: prioritySelect.value});
        showMessage("優先度を変更しました");
        await loadAndRenderTodos();
      } catch (err) {
        showMessage(err.message, true);
        prioritySelect.value = todo.priority;
      }
    });

    // 削除ボタン
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-delete";
    deleteBtn.textContent = "削除";
    deleteBtn.addEventListener("click", async () => {
      try {
        await apiV2.delete(todo.id);
        showMessage("削除しました");
        await loadAndRenderTodos();
      } catch (err) {
        showMessage(err.message, true);
      }
    });

    const actionsDiv = document.createElement("div");
    actionsDiv.className = "item-actions";
    actionsDiv.appendChild(prioritySelect);
    actionsDiv.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(badge);
    li.appendChild(titleSpan);
    li.appendChild(actionsDiv);
    todoListEl.appendChild(li);
  });

  totalCountEl.textContent = todos.length.toString();
}

/**
 * フィルター条件を取得してTODO一覧を再取得・描画
 */
async function loadAndRenderTodos() {
  try {
    const filter = {
      completed: filterStatusSelect.value,
      priority: filterPrioritySelect.value,
    };
    const todos = await apiV2.list(filter);
    renderTodoList(todos);
  } catch (err) {
    showMessage(err.message, true);
  }
}

// フォーム送信イベント (新規登録)
todoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = todoTitleInput.value.trim();
  const priority = todoPrioritySelect.value;

  if (!title) {
    showMessage("タイトルを入力してください", true);
    return;
  }

  try {
    await apiV2.create(title, priority);
    todoTitleInput.value = "";
    todoPrioritySelect.value = "normal";
    showMessage("登録しました");
    await loadAndRenderTodos();
  } catch (err) {
    showMessage(err.message, true);
  }
});

// 絞り込みフィルター変更イベント
filterStatusSelect.addEventListener("change", loadAndRenderTodos);
filterPrioritySelect.addEventListener("change", loadAndRenderTodos);

// 初期表示時にTODO一覧を取得
document.addEventListener("DOMContentLoaded", loadAndRenderTodos);
