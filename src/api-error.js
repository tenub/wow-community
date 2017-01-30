class FetchError extends Error {
	constructor(code, message) {
		super(message);
		this.code = code;
		this.message = message;
		this.name = 'FetchError';
	}
}

export default FetchError;
