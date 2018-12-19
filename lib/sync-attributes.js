'use strict'

const get = require('lodash/get')
const set = require('lodash/set')
const uniq = require('lodash/uniq')

// harmonize attributes between routes and lines (in case they don't contradict each other)
// in a perfect world, this step removes information and is bad, but sadly we don't live in this
// world yet, and often data quality in OSM is bad, so for now this step should be rather useful
const createSyncAttribute = line => attribute => {
	// first check: do all routes/line share the same value (or null) for this attribute?
	// if so, set it for all routes/line (affecting those that had null before), and return
	const allValues = [get(line, attribute), ...line.routes.map(route => get(route, attribute))]
	const uniqValues = uniq(allValues.filter(x => !!x))
	if (uniqValues.length === 1) {
		const [value] = uniqValues
		set(line, attribute, value)
		line.routes.forEach(route => set(route, attribute, value))
		return
	}

	// second check: there are different values, but if all routes share the same value (or null)
	// this value will overwrite the line value (as well as the route values that were null before)
	const routeValues = line.routes.map(route => get(route, attribute))
	const uniqRouteValues = uniq(routeValues.filter(x => !!x))
	if (uniqRouteValues.length === 1) {
		const [value] = uniqRouteValues
		set(line, attribute, value)
		line.routes.forEach(route => set(route, attribute, value))
	}
}

const syncAttributes = line => {
	const syncAttribute = createSyncAttribute(line)
	// anything `get`able with lodash.get
	const attributesToSync = [
		'ref', // @todo ref:*, e.g. ref:VRN
		'operator', // @todo operator:*, e.g. operator:short
		'network', // @todo network:*, e.g. network:short
		'colour',
		'wikidata',
		'transitMode'
	]
	attributesToSync.forEach(syncAttribute)
}

module.exports = syncAttributes
