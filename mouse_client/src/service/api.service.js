export class ApiService {
	#apiPath = `http://localhost:7000`;

	#getTokenHeader() {
		const token = localStorage.getItem('token');
		return token ? { Authorization: `Bearer ${token}` } : {};
	}

	#makeRequest(url, options = {}) {
		const headers = {
			...(options.headers || {}),
			...this.#getTokenHeader(),
		};

		return fetch(this.#apiPath + url, {
			...options,
			headers,
		}).then(async (res) => {
			const contentType = res.headers.get('content-type');

			if (!res.ok) {
				throw new Error(`HTTP ${res.status}: ${res.statusText}`);
			}

			if (res.status === 204 || !contentType?.includes('application/json')) {
				return null;
			}

			return res.json();
		});
	}

	async get(url) {
		return this.#makeRequest(url, { method: 'GET' });
	}

	async getBlob(url) {
		const res = await fetch(this.#apiPath + url, {
			method: 'GET',
			headers: this.#getTokenHeader(),
		});
		if (!res.ok) {
			throw new Error(`Network response was not ok (${res.status})`);
		}
		return res.blob();
	}

	async getArrayBuffer(url) {
		const res = await fetch(this.#apiPath + url, {
			method: 'GET',
			headers: this.#getTokenHeader(),
		});
		if (!res.ok) {
			throw new Error(`Network response was not ok (${res.status})`);
		}
		return res.arrayBuffer();
	}

	async delete(url) {
		return this.#makeRequest(url, { method: 'DELETE' });
	}

	async post(url, data) {
		return this.#makeRequest(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});
	}

	async postFormData(url, formData) {
		return fetch(this.#apiPath + url, {
			method: 'POST',
			body: formData,
			headers: this.#getTokenHeader(),
		}).then(res => {
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return res.json();
		});
	}

	async put(url, data) {
		return this.#makeRequest(url, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});
	}

	async patch(url, data) {
		return this.#makeRequest(url, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});
	}

	async patchFormData(url, formData) {
		return fetch(this.#apiPath + url, {
			method: 'PATCH',
			body: formData,
			headers: this.#getTokenHeader(),
		}).then(res => {
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return res.json();
		});
	}

	async getUserInfo() {
		return this.#makeRequest('/auth/user-info', { method: 'GET' });
	}
}

export const API_SERVICE = new ApiService();
