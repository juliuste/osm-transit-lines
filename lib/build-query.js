'use strict'

const isObject = require('lodash/isObject')
const isNumber = require('lodash/isNumber')

const validateBbox = bbox => {
	if (!(isObject(bbox) && isNumber(bbox.west) && isNumber(bbox.east) && isNumber(bbox.north) && isNumber(bbox.south))) throw new Error('Invalid `bbox`, must be Object containing `north`, `west`, `south` and `east` as Number.')
}

const buildQuery = (bbox) => {
	validateBbox(bbox) // validate input
	const queryBbox = `(${bbox.south},${bbox.west},${bbox.north},${bbox.east})`

	// @todo timeout
	const query = `
	[out:json][timeout:1200];
	relation${queryBbox}["type"="route"]->.routes;
	rel(br.routes)->.parentRelations;
	relation.parentRelations["type"="route_master"]->.routeMasters;
	node(r.routes)->.stops;
	(
		.routes;
		.routeMasters;
		.stops;
	);
	out;
	`

	return query
}

module.exports = buildQuery
