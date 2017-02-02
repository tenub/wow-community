class FetchError extends Error {
	constructor(code, message) {
		super(message);
		this.statusCode = code;
		this.message = message;
		this.name = 'FetchError';
	}
}

export default FetchError;
