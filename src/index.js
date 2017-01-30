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

		this.apiHost = `https://${region || 'us'}.api.battle.net/wow`;
		this.fetchOptions = { timeout: 5000 };
		this.queryOptions = { apikey: apiKey, locale: locale || 'en_US' };
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
	 * @param {integer} id - Achievement id
	 * @param {object} [queryParams] - Additional parameters to pass in a query string
	 */
	achievement(id, queryParams = {}) {
		return this.query(`achievement/${id}`, queryParams);
	}

	/**
	 * Two requests are performed.
	 * First, to retrieve the JSON path to cached data
	 * Second, to retrieve the specified JSON
	 * @param {string} realm - Realm slug
	 * @param {object} [queryParams] - Additional parameters to pass in a query string
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
	 * @param {integer} [id] - Boss id number or null for all boss data
	 * @param {object} [queryParams] - Additional parameters to pass in a query string
	 */
	boss(id = null, queryParams = {}) {
		return this.query(`boss/${id || ''}`, queryParams);
	}

	/**
	 * @param {string} realm - Realm slug or "region" for overall data
	 * @param {object} [queryParams] - Additional parameters to pass in a query string
	 */
	challenge(realm, queryParams = {}) {
		return this.query(`challenge/${realm}`, queryParams);
	}

	/**
	 * @param {string} realm - Realm on which the character is located
	 * @param {string} charName - Character name
	 * @param {object} [queryParams] - Additional parameters to pass in a query string
	 * @property {array} queryParams.fields - Array containing any of the following endpoints:
	 *   achievements, appearance, feed, guild, hunterPets,
	 *   items, mounts, pets, petSlots, professions, progression,
	 *   pvp, quests, reputation, statistics, stats, talents,
	 *   titles, audit
	 */
	character(realm, charName, queryParams = {}) {}

	/**
	 * @param {string} realm - Realm on which the guild is located
	 * @param {string} guildName - Guild name
	 * @param {object} [queryParams] - Additional parameters to pass in a query string
	 * @property {array} queryParams.fields - Array containing any of the following endpoints:
	 *   members, achievements, news, challenge
	 */
	guild(realm, guildName, queryParams = {}) {}

	/**
	 * @param {integer} id - Item id
	 * @param {object} [queryParams] - Additional parameters to pass in a query string
	 */
	item(id, queryParams = {}) {}

	/**
	 * @param {integer} id - Item set id
	 * @param {object} [queryParams] - Additional parameters to pass in a query string
	 */
	itemSet(id, queryParams = {}) {}

	/**
	 * All supported mounts
	 * @param {object} [queryParams] - Additional parameters to pass in a query string
	 */
	mount(queryParams = {}) {}

	/**
	 * @param {integer} id - Pet id
	 * @param {object} [queryParams] - Additional parameters to pass in a query string
	 */
	pet(id, queryParams = {}) {}

	/**
	 * @param {integer} id - Pet ability id
	 * @param {object} [queryParams] - Additional parameters to pass in a query string
	 */
	petAbilities(id, queryParams = {}) {}

	/**
	 * Pet species information
	 * @param {integer} id - Pet species id
	 * @param {object} [queryParams] - Additional parameters to pass in a query string
	 */
	petSpecies(id, queryParams = {}) {}

	/**
	 * Pet stats for specified species id
	 * @param {integer} id - Pet species id
	 * @param {object} [queryParams] - Additional parameters to pass in a query string
	 */
	petStats(id, queryParams = {}) {}
}

export default WoWCommunityAPI;
