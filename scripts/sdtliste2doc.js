#!/bin/node
const parse = require('csv-parse/lib/sync')
const slug = require('slug')
const fs = require('fs')


let lastIndex = require('../indexes/last_item_index.json').lastIndex

nextId = () => `q:Q${++lastIndex}`


rowToDoc = (row) => {
  if (!row[0] || row[0] == '' ) {
    return null
  }
  var fileName = slug(row[0].toLowerCase())
  fileName = fileName.slice(Math.max(0, fileName.length - 16))
  fileName += '.json'
  return {
      fileName: fileName,
      doc: {
      "@context": "semantic/context.json",
      "@id": nextId(),
      "@type": ["object", "wq:Q1397073"],
      // "@type": "object",
      "label": row[0],
      "description": row[1],
      "thematique": row[2],
      "typology": row[7],
      "sourceDataController": row[3],
      "accessMediator": row[4],
      "defi": row[5],
      "information": row[6],
      "access": row[8],
      "kind": row[9],
      "portable": row[10],
    }
  }

}

main = (csvSource) => {
  var csv = parse(fs.readFileSync(csvSource), {
    columns: false,
    skip_empty_lines: true
  })
  csv = csv.slice(1)
  console.log(csv)

  const docs = csv.map(rowToDoc).filter(doc => doc != null)

  console.log(docs)
  docs.forEach((doc) => {
    fs.writeFileSync("datamodels/sdt/" + doc.fileName, JSON.stringify(doc.doc, null, 2))
    console.log("wrote " + doc.fileName)
  })
}

console.log("toto")

main(process.argv[2])
