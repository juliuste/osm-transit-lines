'use strict'

const queryOsm = require('@derhuerst/query-overpass')
const range = require('lodash/range')
const groupBy = require('lodash/groupBy')
const uniqBy = require('lodash/uniqBy')
const flatten = require('lodash/flatten')
const merge = require('lodash/merge')

const buildQuery = require('./build-query')
const createLines = require('./create-lines')
const syncAttributes = require('./sync-attributes')

// split bounding box into several boxes with max. dimension 1 deg lon x 1 deg lat
// note that those boxes won't share the same area size and one could make this method more task-efficient by creating larger chunks close to the poles, but this shouldn't matter too much anyway
const splitBbox = bbox => {
	const maxWidth = 2 // in deg lon
	const maxHeight = 2 // in deg lat
	const xFactor = Math.ceil((bbox.east - bbox.west) / maxWidth)
	const yFactor = Math.ceil((bbox.north - bbox.south) / maxHeight)

	const smallerBboxes = []
	for (let x of range(xFactor)) {
		for (let y of range(yFactor)) {
			const west = bbox.west + (x * maxWidth)
			const east = Math.min(bbox.east, west + maxWidth)
			const south = bbox.south + (y * maxWidth)
			const north = Math.min(bbox.north, south + maxHeight)
			smallerBboxes.push({ west, east, north, south })
		}
	}

	return smallerBboxes
}

const defaults = {
	logging: false
}

const osmTransitLines = async (bbox, opt = {}) => {
	const options = merge({}, defaults, opt)
	const bboxes = splitBbox(bbox)

	const allLines = []

	let counter = 0
	for (let bbox of bboxes) {
		const query = buildQuery(bbox)
		const result = await queryOsm(query)
		const lines = createLines(result)
		allLines.push(...lines)
		if (options.logging) {
			console.error(`${++counter} of ${bboxes.length} requests finished, fetched ${lines.length} lines for the current bbox.`) // writing to stderr for logging *sigh*
		}
	}

	const groupedLines = Object.values(groupBy(allLines, 'id'))
	const lines = groupedLines.map(lineGroup => {
		const [line] = lineGroup
		const duplicatedRoutes = flatten(lineGroup.map(l => l.routes))
		line.routes = uniqBy(duplicatedRoutes, 'id')
		return line
	})

	lines.forEach(syncAttributes)

	return lines
}

module.exports = osmTransitLines
