# osm-transit-lines

Fetch public transit lines from OpenStreetMap for a given area (bounding box).

[![npm version](https://img.shields.io/npm/v/osm-transit-lines.svg)](https://www.npmjs.com/package/osm-transit-lines)
[![Build Status](https://travis-ci.org/juliuste/osm-transit-lines.svg?branch=master)](https://travis-ci.org/juliuste/osm-transit-lines)
[![Greenkeeper badge](https://badges.greenkeeper.io/juliuste/osm-transit-lines.svg)](https://greenkeeper.io/)
[![dependency status](https://img.shields.io/david/juliuste/osm-transit-lines.svg)](https://david-dm.org/juliuste/osm-transit-lines)
[![license](https://img.shields.io/github/license/juliuste/osm-transit-lines.svg?style=flat)](license)
[![chat on gitter](https://badges.gitter.im/juliuste.svg)](https://gitter.im/juliuste)

## Installation

```bash
npm install osm-transit-lines
```

## Usage

```js
const osmTransitLines = require('osm-transit-lines')

// bounding box for Berlin (🇪🇺)
const boundingBox = {
	south: 52.3418234221,
	west: 13.0882097323,
	north: 52.6697240587,
	east: 13.7606105539
}

const options = {
	logging: false, // logs current request count to stderr when enabled
	wikidata: false // fetch claims for lines (not routes) that have a wikidata attribute into line.wikidataClaims
}

osmTransitLines(bbox, { wikidata: true }) // returns a Promise
	.then(console.log)
	.catch(console.error)
```

Note that - depending on your bounding box - the request might take quite long, even some minutes. You should save/cache the result of this query for some time and refresh the data after some interval you deep appropriate (depending on how fast people might change line information on OSM 😜). Also, the request body is handled in-memory at the time, so the process might get killed if you query a giant bounding box and don't have enough memory.

The method returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/promise) that will resolve in a list of lines (that match `route_master` relations in OSM) which in turn contain a list of routes (corresponding to normal `route` relations in OSM) which in turn contain stopLocations, a list of coordinates representing the route's stops. All attributes except for `id`, `type`, `stopLocations` and `routes` are copied from OSM.

Note that this module additionally alters the data to enhance quality in the following ways:
- Creates an additional attribute `transitMode` which contains the `route_master` or `route` mode from OpenStreetMap (they represent the same data type but have different attribute names depending on if they're part of a `route` or a `route_master`)
- Creates additional lines from `route` relations that don't have a `route_master` parent relation and inserts the same route as the only entry in that line's `routes` attribute.
- Harmonizes the some attributes (`network`, `wikidata`, `colour`, `operator`, `ref`, `transitMode`) between lines and routes in the following ways:
	- Do all routes/line contain the same value *or null* for this attribute? -> Copy the value to all routes/line (effectively adding information for those that had `null` before)
	- Do all routes contain the same value *or null*, but the line has a different value? -> Copy the value to all routes (effectively adding information for those that had `null` before) *and overwrite the current value in the line*.

Example output for Berlin:

```js
{
	"colour": "#055A99",
	"id": 58424,
	"interval": "5",
	"name": "U-Bahnlinie U8",
	"network": "Verkehrsverbund Berlin-Brandenburg",
	"network:metro": "u-bahn",
	"operator": "Berliner Verkehrsbetriebe",
	"public_transport:version": "2",
	"ref": "U8",
	"route_master": "subway",
	"routes": [
		{
			"colour": "#055A99",
			"from": "S+U Hermannstraße",
			"id": 2679013,
			"interval": "5",
			"name": "U-Bahnlinie U8: S+U Hermannstraße => S+U Wittenau",
			"network": "Verkehrsverbund Berlin-Brandenburg",
			"network:metro": "u-bahn",
			"operator": "Berliner Verkehrsbetriebe",
			"public_transport:version": "2",
			"ref": "U8",
			"route": "subway",
			"stopLocations": [
				{
					"id": 4655299661,
					"latitude": 52.467777,
					"longitude": 13.4312136,
					"type": "location"
				},
				{
					"id": 29494306,
					"latitude": 52.4729946,
					"longitude": 13.4284168,
					"type": "location"
				}
				// …
			],
			"to": "S+U Wittenau",
			"transitMode": "subway",
			"type": "route"
		},
		{
			"colour": "#055A99",
			"from": "S+U Wittenau",
			"id": 2679014,
			"interval": "5",
			"name": "U-Bahnlinie U8: S+U Wittenau => S+U Hermannstraße",
			"network": "Verkehrsverbund Berlin-Brandenburg",
			"network:metro": "u-bahn",
			"operator": "Berliner Verkehrsbetriebe",
			"public_transport:version": "2",
			"ref": "U8",
			"route": "subway",
			"stopLocations": [
				{
					"id": 4655218849,
					"latitude": 52.5879234,
					"longitude": 13.3258231,
					"type": "location"
				},
				{
					"id": 4655264250,
					"latitude": 52.5784067,
					"longitude": 13.3334638,
					"type": "location"
				}
				// …
			],
			"to": "S+U Hermannstraße",
			"transitMode": "subway",
			"type": "route",
			"wikidata": "Q99729"
		}
	],
	"transitMode": "subway",
	"type": "line",
	"wikidata": "Q99729",
	"wikidataClaims": {
		"P154": ["Berlin U8.svg"],
		"P373": ["U-Bahnlinie U8 (Berlin)"],
		"P465": ["00609E"] // line color
		// …
	},
	"wikipedia": "de:U-Bahn-Linie 8 (Berlin)"
}
```

## Contributing

If you found a bug or want to propose a feature, feel free to visit [the issues page](https://github.com/juliuste/osm-transit-lines/issues).
