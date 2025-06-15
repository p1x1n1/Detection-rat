export class ApiService {
	#apiPath = `http://localhost:7000`;//приватное поле #

	#makeRequest(url, options = {}) {
	const token = localStorage.getItem('token');

	const headers = {
		...(options.headers || {}),
		...(token ? { Authorization: `Bearer ${token}` } : {}),
	};

	return fetch(this.#apiPath + url, {
		...options,
		headers
	}).then(async (res) => {
		const contentType = res.headers.get('content-type');

		if (!res.ok) {
			throw new Error(`HTTP ${res.status}: ${res.statusText}`);
		}

		if (res.status === 204 || !contentType || !contentType.includes('application/json')) {
			return null;
		}

		return res.json();
	});
}



	get(url) {
		console.log(this.#apiPath);
		return this.#makeRequest(url, {
			method: 'GET'
		})
	}

	/**
  * GET-запрос, возвращающий Blob (для Excel, PDF и т.д.)
  * @param {string} url путь относительный к this.#apiPath
  * @returns {Promise<Blob>}
  */
	async getBlob(url) {
		const res = await fetch(this.#apiPath + url, {
			method: 'GET'
		});
		if (!res.ok) {
			throw new Error(`Network response was not ok (${res.status})`);
		}
		return res.blob();
	}

	/**
	 * GET-запрос, возвращающий ArrayBuffer (иногда удобнее)
	 * @param {string} url
	 * @returns {Promise<ArrayBuffer>}
	 */
	async getArrayBuffer(url) {
		const res = await fetch(this.#apiPath + url, {
			method: 'GET'
		});
		if (!res.ok) {
			throw new Error(`Network response was not ok (${res.status})`);
		}
		return res.arrayBuffer();
	}



	delete(url) {
		return this.#makeRequest(url, { method: 'DELETE' })
	}

	post(url, data) {
		return this.#makeRequest(url, {
			headers: {//указывается что именно json
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data),
			method: 'POST'
		})
	}
	postFormData(url, formData) {
		return fetch(this.#apiPath + url, {
			method: 'POST',
			body: formData,
		}).then(res => res.json());
	}

	put(url, data) {
		return this.#makeRequest(url, {
			headers: {//указывается что именно json
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data),
			method: 'PUT'
		})
	}

	patch(url, data) {
		return this.#makeRequest(url, {
			headers: {//указывается что именно json
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data),
			method: 'PATCH'
		})
	}

	patchFormData(url, formData) {
		return fetch(this.#apiPath + url, {
			body: formData,
			method: 'PATCH'
		}).then(res => res.json());
	}

	async getUserInfo(token) {
		const options = {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`, // Передаем токен в заголовке
			},
		};
		return this.#makeRequest('/auth/user-info', options);
	}
}

export const API_SERVICE = new ApiService();