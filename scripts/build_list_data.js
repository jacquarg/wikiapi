// Generate a json file of the mesinfos datasets, with the following format :
// {
//   "Nom" : <-- propertyName // , "Sociétaire Maif",
//   "Description" : <-- description // "Identification et moyen de contact du souscripteur : Nom, prénom, adresse, date de naissance, ...",
//   "Exemple" : <-- exampleValue // "",
//   "Typologie" : <-- dataset.typology //"Profil",
//   "DocType" : <-- dataset.cozyDoctypeName //"Client",
//   "Nature" : <-- kind // "Subset",
//   "Format" : // TODO ! "",
//   "Détenteur" : <-- dataset.sourceDataController // "Maif",
//   "Fréquence" : <-- dataset.updateFrequency // "Rare",
//   "Latence" : <-- dataset.updateLatency // "24h",
//   "Mise_à_disposition" : <-- availability // "2016-09"
// },

const moment = require('moment')
const $ = { extend: require('node.extend') }
const fs = require('fs')

moment.locale('fr')

const items = require('../build/items.json')

const datasets = require('../indexes/mesinfos_datasets.json')['schema:itemListElement']

getItem = (item, allItems) => {
  // TODO : clean this !
  // const MetaObject = require('../models/metaobject')
  let attrs = {}
  if (typeof item === 'string') { // it's an id !
    attrs = allItems[item]
  } else {
    attrs = allItems[item['@id']]
  }

  return new MetaObject(attrs)
}

mapOnPropValue = (propValue, fun) => {
  if (propValue instanceof Array) {
    return propValue.map(fun)
  }
  return fun(propValue)
}


mapByProp = (prop, items, allItems) => {
  return items.reduce((agg, id) => {
    try {
      const item = getItem(id, allItems)
      agg[item[prop]] = item
      return agg
    } catch (e) {
      console.error(`semantic_utils : Error in map by prop on id: ${id}`, e)
      throw e
    }
  }, {})
}

class MetaObject {
  constructor(attrs) {
    $.extend(this, attrs)
  }

  get allProperties () {
    let props = []
    if (this.hasProperty) {
      mapOnPropValue(this.hasProperty, (prop) => props.push(prop))
    }

    if (this.hasOptionalProperty) {
        mapOnPropValue(this.hasOptionalProperty, (prop) => props.push(prop))
    }
    return props
  }
}



let res = []

datasets.forEach((datasetId) => {
  const dataset = getItem(datasetId, items)

  const updateFrequency = moment.duration(dataset.updateFrequency).humanize()
  const updateLatency = moment.duration(dataset.updateLatency).humanize()


  res.push({
    "Nom": dataset.label,
    "Description": dataset.description,
    "Exemple": "",
    "Typologie": dataset.typology,
    "DocType": dataset.cozyDoctypeName,
    "Nature": "Subset",
    "Format": "",
    "Détenteur": dataset.sourceDataController,
    "Fréquence": updateFrequency,
    "Latence" : updateLatency,
    "Mise_à_disposition": ""
  })

  // Doctype
  res.push({
    "Nom": dataset.cozyDoctypeName,
    "Description": dataset.description,
    "Exemple": "",
    "Typologie": dataset.typology,
    "DocType": dataset.cozyDoctypeName,
    "Nature": "DocType",
    "Format": "",
    "Détenteur": dataset.sourceDataController,
    "Fréquence": updateFrequency,
    "Latence" : updateLatency,
    "Mise_à_disposition": ""
  })

  dataset.allProperties.forEach((prop) => {
    prop = getItem(prop, items)
    res.push({
      "Nom": prop.propName,
      "Description": prop.description,
      "Exemple": prop.exampleValue,
      "Typologie": dataset.typology,
      "DocType": dataset.cozyDoctypeName,
      "Nature": prop.kind,
      "Format": "",
      "Détenteur": dataset.sourceDataController,
      "Fréquence": updateFrequency,
      "Latence" : updateLatency,
      "Mise_à_disposition": prop.availability
    })
  })
})

// write to file.
fs.writeFileSync('build/list_data.json', JSON.stringify({ export: res }, null, 2));
