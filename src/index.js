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
	 * Async fetch wrapper that rejects on API error or timeout
	 * @param {String} path - API endpoint (relative path)
	 * @param {Object} [params] - Extra parameters to pass in a query string
	 * @returns {Promise} Resolves on fetch completion
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
	 * Retrieves achievement information by id
	 * @param {Number} id
	 * @param {Object} [queryParams] - Additional parameters to pass in query string
	 * @returns {Promise}
	 */
	achievement(id, queryParams = {}) {
		return this.query(`achievement/${id}`, queryParams);
	}

	/**
	 * Retrieves recent auction data by realm slug
	 * Two requests are performed:
	 * 1. retrieve JSON path to cached data
	 * 2. retrieve specified JSON
	 * @param {String} realm
	 * @param {Object} [queryParams] - Additional parameters to pass in query string
	 * @returns {Promise}
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
	 * Retrieves encounter information by id or a list of all encounters if id is not a number
	 * An id must be passed if extra query params are desired
	 * @param {Number} [id]
	 * @param {Object} [queryParams] - Additional parameters to pass in query string
	 * @returns {Promise}
	 */
	boss(id = null, queryParams = {}) {
		return this.query(`boss/${Number.isInteger(id) ? id : ''}`, queryParams);
	}

	/**
	 * Retrieves current top times for each map in specified realm
	 * @param {String} realm - Realm slug or "region" for top results in the region
	 * @param {Object} [queryParams] - Additional parameters to pass in query string
	 * @returns {Promise}
	 */
	challenge(realm, queryParams = {}) {
		return this.query(`challenge/${realm}`, queryParams);
	}

	/**
	 * Retrieve character information by name located on specified realm
	 * Fields must be passed in query param to receive information
	 * @param {String} realm
	 * @param {String} charName
	 * @param {Object} [queryParams] - Additional parameters to pass in query string
	 * @property {Array} queryParams.fields - Array containing any of the following endpoints:
	 *   achievements, appearance, feed, guild, hunterPets,
	 *   items, mounts, pets, petSlots, professions, progression,
	 *   pvp, quests, reputation, statistics, stats, talents,
	 *   titles, audit
	 * @returns {Promise}
	 */
	character(realm, charName, queryParams = {}) {
		return this.query(`character/${realm}/${charName}`, queryParams);
	}

	/**
	 * Retrieve guild information by name located on specified realm
	 * Fields must be passed in query param to receive information
	 * @param {String} realm
	 * @param {String} guildName
	 * @param {Object} [queryParams] - Additional parameters to pass in query string
	 * @property {Array} queryParams.fields - Array containing any of the following endpoints:
	 *   members, achievements, news, challenge
	 * @returns {Promise}
	 */
	guild(realm, guildName, queryParams = {}) {
		return this.query(`guild/${realm}/${guildName}`, queryParams);
	}

	/**
	 * Retrieve item information by id
	 * @param {Number} id
	 * @param {Object} [queryParams] - Additional parameters to pass in query string
	 * @returns {Promise}
	 */
	item(id, queryParams = {}) {
		return this.query(`item/${id}`, queryParams);
	}

	/**
	 * Retrieve item set information by set id
	 * @param {Number} id
	 * @param {Object} [queryParams] - Additional parameters to pass in query string
	 * @returns {Promise}
	 */
	itemSet(id, queryParams = {}) {
		return this.query(`item/set/${id}`, queryParams);
	}

	/**
	 * Retrieve a list of all supported mounts
	 * @param {Object} [queryParams] - Additional parameters to pass in query string
	 * @returns {Promise}
	 */
	mount(queryParams = {}) {
		return this.query('mount/', queryParams);
	}

	/**
	 * Retrieve a list of all pets
	 * @param {Object} [queryParams] - Additional parameters to pass in query string
	 * @returns {Promise}
	 */
	pet(queryParams = {}) {
		return this.query('pet/', queryParams);
	}

	/**
	 * Retrieve pet ability information by ability id
	 * @param {Number} id
	 * @param {Object} [queryParams] - Additional parameters to pass in query string
	 * @returns {Promise}
	 */
	petAbility(id, queryParams = {}) {
		return this.query(`pet/ability/${id}`, queryParams);
	}

	/**
	 * Retrieve pet species information by species id
	 * @param {Number} id
	 * @param {Object} [queryParams] - Additional parameters to pass in query string
	 * @returns {Promise}
	 */
	petSpecies(id, queryParams = {}) {
		return this.query(`pet/species/${id}`, queryParams);
	}

	/**
	 * Retrieve pet stats by species id
	 * @param {Number} id
	 * @param {Object} [queryParams] - Additional parameters to pass in query string
	 * @returns {Promise}
	 */
	petStats(id, queryParams = {}) {
		return this.query(`pet/stats/${id}`, queryParams);
	}

	/**
	 * Retrieve leaderboard for specified pvp bracket
	 * @param {String} bracket - Bracket short name. One of: 2v2, 3v3, 5v5, rbg
	 * @param {Object} [queryParams] - Additional parameters to pass in query string
	 * @returns {Promise}
	 */
	pvp(bracket, queryParams = {}) {
		return this.query(`leaderboard/${bracket}`, queryParams);
	}

	/**
	 * Retrieve quest information for specified quest id
	 * @param {Number} id
	 * @param {Object} [queryParams] - Additional parameters to pass in query string
	 * @returns {Promise}
	 */
	quest(id, queryParams = {}) {
		return this.query(`quest/${id}`, queryParams);
	}

	/**
	 * Retrieve realm status for specified realms or all realms if a falsy value is passed
	 * Pass a string or array of strings for the first parameter to filter realm status
	 * A value must be passed for this first parameter if additional query parameters are used
	 * @param {String|Array} [realms] - Realm slugs
	 * @param {Object} [queryParams] - Additional parameters to pass in query string
	 * @returns {Promise}
	 */
	realm(realms = null, queryParams = {}) {
		return this.query('realm/status', Object.assign(
			realms && realms.constructor === 'string' ? { realms } : realms && realms.constructor === Array ? { realms: realms.join(',') } : {}, queryParams
		));
	}

	/**
	 * Retrieve recipe information for specified recipe id
	 * @param {Number} id
	 * @param {Object} [queryParams] - Additional parameters to pass in query string
	 * @returns {Promise}
	 */
	recipe(id, queryParams = {}) {
		return this.query(`recipe/${id}`, queryParams);
	}

	/**
	 * Retrieve spell information for specified spell id
	 * @param {Number} id
	 * @param {Object} [queryParams] - Additional parameters to pass in query string
	 * @returns {Promise}
	 */
	spell(id, queryParams = {}) {
		return this.query(`spell/${id}`, queryParams);
	}

	/**
	 * Retrieve zone information for specified zone id or all zone information if id is falsy
	 * A zone value must be passed if additional query parameters are used
	 * @param {Number|null} [id]
	 * @param {Object} [queryParams] - Additional parameters to pass in query string
	 * @returns {Promise}
	 */
	zone(id = null, queryParams = {}) {
		return this.query(`zone/${Number.isInteger(id) ? id : ''}`, queryParams);
	}

	/**
	 * Retrieve game data information for certain resources
	 * Possible resource values are:
	 *   battlegroups, races, classes, achievements, rewards, perks,
	 *   guildAchievements, itemClasses, talents, petTypes
	 * @param {String} resource
	 * @param {Object} [queryParams] - Additional parameters to pass in query string
	 * @returns {Promise}
	 */
	data(resource, queryParams = {}) {
		return this.query(`data/${(() => {
			switch (resource) {
				case 'talents':
					return resource;
				case 'battlegroups':
					return 'battlegroups/';
				case 'races':
					return 'character/races';
				case 'classes':
					return 'character/classes';
				case 'achievements':
					return 'character/achievements';
				case 'rewards':
					return 'guild/rewards';
				case 'perks':
					return 'guild/perks';
				case 'guildAchievements':
					return 'guild/achievements';
				case 'itemClasses':
					return 'item/classes';
				case 'petTypes':
					return 'pet/types';
				default:
					return '';
			}
		})()}`, queryParams);
	}
}

export default WoWCommunityAPI;
