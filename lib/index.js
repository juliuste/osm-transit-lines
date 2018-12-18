'use strict'

const queryOsm = require('@derhuerst/query-overpass')
const buildQuery = require('./build-query')
const omit = require('lodash/omit')
const flatMap = require('lodash/flatMap')

const createLocation = node => ({
	type: 'location',
	id: node.id,
	longitude: node.lon,
	latitude: node.lat
})

const itemIsStopNode = item => item.type === 'node' && item.role === 'stop'

const createCreateRoute = locations => relation => ({
	...relation.tags,
	id: relation.id,
	transitMode: relation.tags.route,
	stopLocations: relation.members.filter(itemIsStopNode).map(m => {
		const location = locations.find(l => m.ref === l.id)
		if (!location) throw new Error('Node contained in route, but not found in stops!')
		return location
	})
})

const createCreateLine = allRoutes => relation => ({
	...relation.tags,
	id: relation.id,
	type: 'line',
	transitMode: relation.tags.route_master,
	routes: allRoutes.filter(r => {
		const routes = relation.members.map(m => m.ref).includes(r.id)
		if (routes.length === 0) throw new Error('Line and routes not matching!')
		return routes
	})
})

const createLineFromRoute = route => {
	const line = omit(route, ['stopLocations', 'route', 'type'])
	line.type = 'line'
	line.routes = [route]
	return line
}

const osmTransitLines = async (bbox, opt = {}) => {
	const query = buildQuery(bbox)
	const result = await queryOsm(query)

	// create locations from nodes
	const locations = result.filter(n => n.type === 'node').map(createLocation)

	// create routes from `route`s
	const createRoute = createCreateRoute(locations)
	const routes = result
		.filter(r => r.type === 'relation' && Array.isArray(r.members) && r.members.filter(itemIsStopNode).length > 1)
		.map(createRoute)

	// create lines from `route_master`s
	const createLine = createCreateLine(routes)
	const lines = result
		.filter(l => l.type === 'relation' && l.tags.type === 'route_master')
		.map(createLine)

	const routeIdsPartOfLines = flatMap(lines, l => l.routes.map(r => r.id))
	const routesNotPartOfLines = routes.filter(r => !routeIdsPartOfLines.includes(r.id))
	lines.push(...routesNotPartOfLines.map(createLineFromRoute))

	return lines
}

module.exports = osmTransitLines
