class TodoApi {
    constructor() {
        this.baseUrl = '/api/v1/todo_tasks';
    }

    /**
     * TODO一覧を取得する
     */
    async fetchTodos() {
        const response = await fetch(this.baseUrl);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || '一覧の取得に失敗しました');
        }
        return await response.json();
    }

    /**
     * 新しいTODOを登録する
     */
    async createTodo(title) {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || '登録に失敗しました');
        }
        return await response.json();
    }

    /**
     * TODOの完了状態を更新する
     */
    async updateStatus(id, completed) {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ completed })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || '更新に失敗しました');
        }
        return await response.json();
    }

    /**
     * TODOを削除する
     */
    async deleteTodo(id) {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || '削除に失敗しました');
        }
        // 204 No Content はレスポンスボディが空なのでパースしない
        return;
    }
}