const fs = require('fs');
const mkdirp = require('mkdirp');

const { promisify } = require('util');
const statAsync = promisify(fs.stat); //get file metadata
const unlinkAsync = promisify(fs.unlink); //deletes file
const accessAsync = promisify(fs.access); //checks if file exists


class StorageFS {

	constructor(basePath) {
		this.basePath = basePath;
	}

	async init() {
		return mkdirp(this.basePath);
	}

	/**
	 *
	 * @param {string} filename
	 * @param {ReadableStream} content
	 * @returns {Promise<void>}
	 */
	save(filename, content) {
		return new Promise((resolve, reject) => {
			const writeStream = fs.createWriteStream(this._getPath(filename));
			content.pipe(writeStream)
				.on('finish', resolve)
				.on('error', reject);
		});
	}

	/**
	 *
	 * @param {String} filename
	 * @param {Object} [range]
	 * @returns {ReadStream} content
	 */
	load(filename, range) {
		return range ?
			fs.createReadStream(this._getPath(filename), { start: range.start, end: range.end })
			: fs.createReadStream(this._getPath(filename));
	}

	getReadStreamProvider(filename) {
		return {
			getStream: function (range) {
				return this.load(filename, range);
			}
		};
	}

	/**
	 *
	 * @param {String} filename
	 * @returns {Promise<void>}
	 */
	remove(filename) {
		return unlinkAsync(this._getPath(filename));
	}

	/**
	 *
	 * @param filename
	 * @returns {Promise<boolean>}
	 */
	async exists(filename) {
		try {
			await accessAsync(this._getPath(filename));
			return true;
		} catch (e) {
			return false;
		}
	}

	async getFilesize(filename) {
		const stats = await statAsync(this._getPath(filename));
		return stats.size;
	}

	_getPath(filename) {
		return `${this.basePath}/${filename}`;
	}

	/**
	 * Creates WritableStream for given filename
	 * @param {string} filename
	 * @returns {{writeStream: WritableStream, resultPromise : Promise}}
	 */
	initWritableStream(filename) {
		const writeStream = fs.createWriteStream(this._getPath(filename));
		const resultPromise = new Promise((resolve, reject) => {
			writeStream
				.on('finish', resolve)
				.on('error', reject);
		});
		return {
			writeStream,
			resultPromise
		};
	}

}

module.exports = StorageFS;
