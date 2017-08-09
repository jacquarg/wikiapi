'use-strict'

const fs = require('fs')
const glob = require('glob')
const jsonld = require('jsonld').promises

const context = require('../semantic/context.json')

// walk the all tree, and, each times, add flatten.

// const files = [
//   //"../semantic/properties.json",
//   "../datamodels/mesinfos/cozy/doctype_property.json",
//   "../datamodels/mesinfos/cozy/doctype.json",
//
//   "../datamodels/mesinfos/EDF/consommation_gaz.json",
//   "../datamodels/mesinfos/EDF/consommationelectricite.json",
//   "../datamodels/mesinfos/EDF/estimations_electricite_edelia.json",
//   "../datamodels/mesinfos/EDF/cozy-konnector-edf.json",
//   "../datamodels/mesinfos/EDF/estimations_gaz_edelia.json",
//   "../datamodels/mesinfos/fing/consumptionStatement.json",
// ]

const processFiles = (files) => {
  const result = { '@context': context['@context'], '@graph': {} }
  let res = result['@graph']
  // const res = {}
  // test = require(files[0]);
  // jsonld.flatten(test)


  Promise.all(files.map((path) => {
    console.log(path)
    let doc = require(path)
    doc['@context'] = context['@context']
    return jsonld.flatten(doc)
    // .then(d => jsonld.compact(d, context['@context'] ))
  }))
  // .then(data => console.log(JSON.stringify(data[3], null, 2)))
  .then(flats => flats.forEach(flat => flat.forEach(item => res[item['@id']] = item )))
  .then(() => jsonld.compact(result, context['@context'] ))

  // // Works, and looks compliant.
  // .then((flats) => {
  //   let res = []
  //   flats.forEach(flat => res = res.concat(flat))
  //   const result = { '@context': context['@context'], '@graph': res }
  //   return result
  // })
  // .then(d => jsonld.compact(d, context['@context'] ))
  // //

  // .then(() => result)
  // .then(data => console.log(JSON.stringify(data, null, 2)))
  .then((data) => {
    fs.writeFileSync('build/items.json', JSON.stringify(data, null, 2));
    console.log(`Writen : ${Object.keys(res).length} objects in build/items.json`)

  })
  // .then(data => console.log(JSON.stringify(res, null, 2)))
}

glob('datamodels/mesinfos/**/*.json', { absolute: true }, (err, files) => {
  if (err) { return console.error(err) }
  processFiles(files)
})
