'use strict'

const { fetch } = require('fetch-ponyfill')()
const wikidata = require('wikidata-sdk')
const Queue = require('p-queue')
const merge = require('lodash/merge')

const createRequestFunction = url => async () => {
	const result = await (fetch(url).then(res => res.json()))
	const entities = wikidata.simplify.entities(result.entities)
	return entities
}

const fetchEntities = async ids => {
	const urls = wikidata.getManyEntities({
		ids,
		languages: ['en'],
		props: ['claims'],
		format: 'json'
	})
	const queue = new Queue({ concurrency: 1 })
	const resultList = await queue.addAll(urls.map(createRequestFunction))
	return merge({}, ...resultList)
}

module.exports = fetchEntities
