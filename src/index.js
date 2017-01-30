import qs from 'querystring';
import Promise from 'bluebird';
import fetch from 'node-fetch';

import APIError from './api-error';

fetch.Promise = Promise;

/**
 * Simple World of Warcraft community API wrapper
 */
class WoWCommunityAPI {
	constructor({ apiKey, locale, region }) {
		if (!apiKey) {
			throw new Error('API key not provided');
		}

		if (region && !/^(?:us|eu)$/.test(region)) {
			throw new Error('Region must be "eu" or "us"');
		}

		if (locale && !/^(?:en_US|es_MX|pt_BR)$/) {
			throw new Error('Locale must be "en_US", "es_MX", or "pt_BR"');
		}

		this.apiKey = apiKey;
		this.locale = locale || 'en_US';
		this.region = region || 'us';

		this.apiHost = `https://${this.region}.api.battle.net/wow`;
		this.fetchOptions = { timeout: 5000 };
		this.queryOptions = {
			apikey: apiKey,
			locale: this.locale || 'en_US',
		};
	}

	/**
	 * @param {string} path - API endpoint, ie. relative path
	 * @param {object} [params] - Parameters to pass in a query string
	 */
	query(path, params) {
		const url = `${this.apiHost}/${path}?${qs.stringify(Object.assign(this.queryOptions, params))}`;
		return new Promise((resolve, reject) => (
			fetch(url, this.fetchOptions)
				.bind({})
				.then(function (res) {
					this.status = res.status;
					return res.json();
				})
				.then(function (body) {
					return /^2\d{2}$/.test(this.status) ? resolve(body) : reject(new APIError(this.status, body.reason));
				})
				.catch((err) => (
					reject(err)
				))
		));
	}

	/**
	 * @param {integer} id - Achievement id number for which to retrieve data
	 * @param {object} [params] - Additional parameters to pass in a query string
	 */
	achievement(id, queryParams = {}) {
		return this.query(`achievement/${id}`, queryParams);
	}

	/**
	 * Two requests are performed.
	 * First, to retrieve the JSON path to cached data
	 * Second, to retrieve the specified JSON
	 * @param {string} realm - Realm slug for which to retrieve recent auction data
	 * @param {object} [params] - Additional parameters to pass in a query string
	 */
	auction(realm, queryParams = {}) {
		const fetchOptions = this.fetchOptions;
		return new Promise((resolve, reject) => {
			this.query(`auction/data/${realm}`, queryParams)
				.bind({})
				.then(function (body) {
					if (body.files && body.files.length && body.files[0].url) {
						this.lastModified = body.files[0].lastModified;
						return fetch(body.files[0].url, fetchOptions);
					}

					return reject(new APIError(500, 'Malformed auction response'));
				})
				.then(function (res) {
					this.status = res.status;
					return res.json();
				})
				.then(function (body) {
					return /^2\d{2}$/.test(this.status) ? resolve(
						Object.assign({
							lastModified: this.lastModified
						}, body)
					) : reject(
						new APIError(this.status, body.reason)
					);
				})
				.catch((err) => (
					reject(err)
				));
		});
	}

	/**
	 * If extra query params are desired for full boss data,
	 * a falsy value must be passed for the first parameter
	 * @param {integer} [id] - Boss id number for which to retrieve data or null for all boss data
	 * @param {object} [params] - Additional parameters to pass in a query string
	 */
	boss(id = null, queryParams = {}) {
		return this.query(`boss/${id || ''}`, queryParams);
	}

	/**
	 * @param {string} realm - Realm slug for which to retrieve data or "region" for overall data
	 * @param {object} [params] - Additional parameters to pass in a query string
	 */
	challenge(realm, queryParams = {}) {
		return this.query(`challenge/${realm}`, queryParams);
	}
}

export default WoWCommunityAPI;
