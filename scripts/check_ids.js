'use-strict'

const fs = require('fs')
const glob = require('glob')
const jsonld = require('jsonld').promises

const context = require('../semantic/context.json')

const processAFile = (filePath) => {
  return new Promise((resolve, reject) => fs.readFile(filePath, {encoding: 'utf-8'}, (err, data) => (err) ? reject(err) : resolve(data)))
  .then((data) => data.match(/"@id": "q:Q[0-9]+"/g).map(id => ({ id, filePath})))
}

const processFiles = (files) => {

  return Promise.all(files.map(processAFile))
  .then((idsLists) => {
    const ids = idsLists.reduce((res, list) => res.concat(list), []).sort((a, b) => a.id > b.id ? -1 : 1)

    fs.writeFileSync('indexes/last_item_index.json', JSON.stringify({ lastIndex: Number(ids[0].id.match(/[0-9]+/)[0]) }), null, 2)

    const duplicates = ids.reduce((res, item) => {
      if (item.id === res.previous.id) {
        res.duplicates.push(res.previous)
        res.duplicates.push(item)
      }
      res.previous = item
      return res
    }, { previous: "", duplicates: [] })

    if (duplicates.duplicates.length > 0) {
      console.log(duplicates.duplicates)
      return Promise.reject(`${duplicates.duplicates.length} duplicates found`)
    }
  })
}

glob('datamodels/mesinfos/**/*.json', { absolute: true }, (err, files) => {
  if (err) { return console.error(err) }
  processFiles(files)
  .catch(() => process.exit(1))
})
