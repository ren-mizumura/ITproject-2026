document.addEventListener('DOMContentLoaded', () => {
    const api = new TodoApi();
    const todoList = document.getElementById('todo-list');
    const titleInput = document.getElementById('todo-title');
    const addBtn = document.getElementById('add-btn');
    const errorMessage = document.getElementById('error-message');

    // エラーメッセージを表示して数秒後に消す関数
    const showError = (message) => {
        errorMessage.textContent = message;
        setTimeout(() => {
            errorMessage.textContent = '';
        }, 5000);
    };

    // TODO一覧を取得して画面に描画する関数
    const renderTodos = async () => {
        try {
            const { data } = await api.fetchTodos();
            todoList.innerHTML = ''; // リストを一旦クリア
            
            data.forEach(todo => {
                const li = document.createElement('li');
                li.style.marginBottom = '8px';

                // 完了状態切り替え用チェックボックス
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = todo.completed;
                checkbox.addEventListener('change', async (e) => {
                    try {
                        await api.updateStatus(todo.id, e.target.checked);
                        await renderTodos(); // 成功したら一覧を再描画
                    } catch (error) {
                        e.target.checked = !e.target.checked; // 失敗時は元の状態に戻す
                        showError(error.message);
                    }
                });

                // タイトル表示（完了時は取り消し線を引く）
                const titleSpan = document.createElement('span');
                titleSpan.textContent = todo.title;
                titleSpan.style.margin = '0 10px';
                if (todo.completed) {
                    titleSpan.style.textDecoration = 'line-through';
                    titleSpan.style.color = '#888';
                }

                // 削除用ボタン
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = '削除';
                deleteBtn.addEventListener('click', async () => {
                    try {
                        await api.deleteTodo(todo.id);
                        await renderTodos(); // 成功したら一覧を再描画
                    } catch (error) {
                        showError(error.message);
                    }
                });

                li.appendChild(checkbox);
                li.appendChild(titleSpan);
                li.appendChild(deleteBtn);
                todoList.appendChild(li);
            });
        } catch (error) {
            showError(error.message);
        }
    };

    // 追加ボタンクリック時の処理
    addBtn.addEventListener('click', async () => {
        const title = titleInput.value;
        try {
            // API経由で登録
            await api.createTodo(title);
            // 成功したら入力欄をクリアし、一覧を再描画
            titleInput.value = '';
            await renderTodos();
        } catch (error) {
            showError(error.message);
        }
    });

    // 画面ロード時に初期データを取得・表示
    renderTodos();
});