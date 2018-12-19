'use strict'

const tapeWithoutPromise = require('tape')
const addPromiseSupport = require('tape-promise').default
const tape = addPromiseSupport(tapeWithoutPromise)
const { BE: berlin } = require('german-states-bbox')
const validate = require('validate-fptf')()
const isUndefined = require('lodash/isUndefined')

const osmTransitLines = require('.')

tape('osm-transit-lines', async t => {
	const bbox = { south: berlin.minLat, west: berlin.minLon, north: berlin.maxLat, east: berlin.maxLon }

	const lines = await osmTransitLines(bbox, { wikidata: true })
	t.ok(lines.length >= 10, 'lines count')

	// U8 mapped with route_master
	const u8Candidates = lines.filter(l => l.ref === 'U8')
	t.ok(u8Candidates.length === 1, 'U8 line count')
	const [u8] = u8Candidates
	t.ok(u8.type === 'line', 'line type')
	t.ok(u8.colour === '#055A99', 'line colour')
	t.ok(u8.transitMode === 'subway', 'line transitMode')
	t.ok(u8.wikidata === 'Q99729', 'line wikidata')
	t.ok(u8.wikidataClaims, 'line wikidata claims')
	t.ok(Array.isArray(u8.wikidataClaims.P465) && u8.wikidataClaims.P465[0] === '00609E', 'like wikidata claims line-color')
	t.ok(u8.routes.length === 2, 'line routes length')
	const [u8Route] = u8.routes
	t.ok(u8Route.ref === 'U8', 'route ref')
	t.ok(u8Route.type === 'route', 'route type')
	t.ok(u8Route.colour === '#055A99', 'route colour')
	t.ok(u8Route.transitMode === 'subway', 'route transitMode')
	t.ok(u8Route.stopLocations.length >= 15, 'route stopLocations')
	for (let u8Stop of u8Route.stopLocations) {
		t.ok(u8Stop.type === 'location', 'route stop type')
		t.doesNotThrow(() => validate(u8Stop), 'route stop valid')
	}

	// Tram 12, mapped with route_master
	const tram12Candidates = lines.filter(l => l.ref === '12' && l.network === 'Verkehrsverbund Berlin-Brandenburg' && l.transitMode === 'tram')
	t.ok(tram12Candidates.length === 1, 'Tram 12 line count')
	const [tram12] = tram12Candidates
	t.ok(tram12.type === 'line', 'line type')
	t.ok(tram12.colour === '#996699', 'line colour')
	t.ok(tram12.transitMode === 'tram', 'line transitMode')
	// routes have operator Berliner Verkehrsbetriebe, line has operator BVG, this verifies the syncinc
	t.ok(tram12.operator === 'Berliner Verkehrsbetriebe', 'line attributes synced') // @todo improve testing
	t.ok(tram12.routes.length === 2, 'line routes length')
	const [tram12Route] = tram12.routes
	t.ok(tram12Route.ref === '12', 'route ref')
	t.ok(tram12Route.type === 'route', 'route type')
	t.ok(tram12Route.colour === '#996699', 'route colour')
	t.ok(tram12Route.transitMode === 'tram', 'route transitMode')
	t.ok(tram12Route.stopLocations.length >= 15, 'route stopLocations')
	for (let tram12Stop of tram12Route.stopLocations) {
		t.ok(tram12Stop.type === 'location', 'route stop type')
		t.doesNotThrow(() => validate(tram12Stop), 'route stop valid')
	}

	// Bus 114, not mapped with route_master (for now)
	const bus114Candidates = lines.filter(l => l.ref === '114' && l.operator === 'Berliner Verkehrsbetriebe' && l.transitMode === 'bus')
	t.ok(bus114Candidates.length === 1, 'Bus 114 line count')
	const [bus114] = bus114Candidates
	t.ok(bus114.type === 'line', 'line type')
	t.ok(isUndefined(bus114.colour), 'line colour')
	t.ok(bus114.transitMode === 'bus', 'line transitMode')
	t.ok(bus114.routes.length === 1, 'line routes length')
	const [bus114Route] = bus114.routes
	t.ok(bus114Route.ref === '114', 'route ref')
	t.ok(bus114Route.type === 'route', 'route type')
	t.ok(isUndefined(bus114Route.colour), 'route colour')
	t.ok(bus114Route.transitMode === 'bus', 'route transitMode')
	t.ok(bus114Route.stopLocations.length >= 10, 'route stopLocations')
	for (let bus114Stop of bus114Route.stopLocations) {
		t.ok(bus114Stop.type === 'location', 'route stop type')
		t.doesNotThrow(() => validate(bus114Stop), 'route stop valid')
	}

	t.end()
})
