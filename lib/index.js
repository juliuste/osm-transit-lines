'use strict'

const queryOsm = require('@derhuerst/query-overpass')
const buildQuery = require('./build-query')
const createLines = require('./create-lines')

const osmTransitLines = async (bbox, opt = {}) => {
	const query = buildQuery(bbox)
	const result = await queryOsm(query)
	const lines = createLines(result)
	return lines
}

module.exports = osmTransitLines
