class TodoApi {
    constructor() {
        this.baseUrl = '/api/v1/todos';
    }

    /**
     * APIレスポンスの共通処理（JSONチェックとエラーハンドリング）
     */
    async _handleResponse(response) {
        // 204 No Content（削除成功時など）はパース不要
        if (response.status === 204) {
            return;
        }

        const contentType = response.headers.get('content-type');
        // レスポンスがJSON形式かチェック
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('サーバーからJSON以外の応答がありました:', text);
            // throw new Error('サーバーから予期せぬ応答（HTML等）が返されました。F12キーのConsoleタブを確認してください。');
            throw new Error('サーバーエラーが発生しました');
        }

        // ステータスがエラー(400, 500等)の場合
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || '通信に失敗しました');
        }

        return await response.json();
    }

    async fetchTodos() {
        const response = await fetch(this.baseUrl);
        return await this._handleResponse(response);
    }

    async createTodo(title) {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        });
        return await this._handleResponse(response);
    }

    async updateStatus(id, completed) {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed })
        });
        return await this._handleResponse(response);
    }

    async deleteTodo(id) {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: 'DELETE'
        });
        return await this._handleResponse(response);
    }
}