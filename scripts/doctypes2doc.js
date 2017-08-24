#!/bin/node
const PLD = require('prototype-ld')
const fs = require('fs')
// From a list of document of the same doctype, build documentation tree :



// TODO next : find . suggest re-use properties !

PLD.where = (queries, items) => {
  items = items || Object.keys(PLD.allItems).map(id => PLD.allItems[id])

  return items.filter(item =>
    Object.keys(queries).every(predicate => item[predicate] == queries[predicate])
  )
}


PLD.getUpperClasses = item => PLD.mapOnObject(item['@type'], (classId) => {
  try {
    return PLD.getItem(classId)
  } catch(e) {
    console.info(`Can't find item: ${classId} locally, fallback to schema:Thing`)
    return { '@type': 'schema:Thing', '@id': 'schema:Thing' }
  }
})



PLD.isSubclassOf = (item, classId) => {
  try {
    item = PLD.getItem(item)
  } catch(e) {
    console.info(`Can't find item: ${item} locally, abort`)
    // or fallback to 'schema:Thing' ?
    return false
  }
  // if (PLD.isType(item, 'schema:Thing')) return false

  if (!PLD.isType(item, classId)) {
    const res = PLD.mapOnObject(item['@type'], upperClass => PLD.isSubclassOf(upperClass, classId))

    return res === true || res instanceof Array && res.some(v => v)
  }

  return true
}

PLD.listInstanceOf = (classId, items) => {
  items = items || Object.keys(PLD.allItems).map(id => PLD.allItems[id])
  return items.filter((item) => PLD.isSubclassOf(item, classId))
}


let lastIndex = require('../indexes/last_item_index.json').lastIndex

const properties = {}
const optionalProperties = {}

nextId = () => `q:Q${++lastIndex}`

buildProp = (propName, value) => {
  // Find existing props, with same propName
  const props = PLD.listInstanceOf('q:Q104')
  const candiateExistingProps = PLD.where({ propName: propName }, props)

  return {
    "label": propName,
    "propName": propName,
    "@id": nextId(),
    "@type": "q:Q104",
    "description": "TODO",
    "exampleValue": [value], // TODO : push ...
    "values": [value],
    "kind": "TODO",
    "TODO : candiates existing properties": candiateExistingProps
  }
}

buildObjectProp = (propName, value) => {
  return {
    "label": propName,
    "propName": propName,
    "@id": nextId(),
    "@type": "object",
    "description": "TODO",
    "kind": "TODO",
    "hasProperty": [],
    "hasOptionalProperty": []
  }
}


browseObject = (obj, prefix, options) => {
  for (let propName in obj) {
    const value = obj[propName]
    if (typeof value === 'object') {
      if (value instanceof Array) {
        // TODO
      }
      browseProp(propName, value, prefix, { init: options.init, notViewed: options.notViewed, type: 'object' })
      browseObject(value, `${prefix}${propName}/`, options)

    } else {
      browseProp(propName, value, prefix, { init: options.init, notViewed: options.notViewed, type: 'any' })
    }
  }
}

browseProp = (propName, value, prefix, options) => {
  const key = `${prefix}${propName}`
  if (options.init) {
    properties[key] = options.type === 'object' ? buildObjectProp(propName, value) : buildProp(propName, value)
  } else {
    if (key in properties) {
      options.notViewed.delete(propName)
      if (options.type === 'any') {
        properties[key].values.push(value)
        properties[key].exampleValue.push(value)
      }
    } else if (key in optionalProperties && options.type === 'any') {
      optionalProperties[key].exampleValue.push(value)
      optionalProperties[key].values.push(value)
    } else {
      optionalProperties[key] = options.type === 'object' ? buildObjectProp(propName, value) : buildProp(propName, value)
    }
  }
}

indexProperties = (documents) => {
  let init = true
  let notViewed = null
  documents.forEach(
    (document) => {
      if (!init) {
        notViewed = new Set(Object.keys(properties))
      }
      browseObject(document, '', { init, notViewed })
      if (!init) {
        notViewed.forEach(propName => {
          optionalProperties[propName] = properties[propName]
          delete properties[propName]
        })
      } else {
        init = false
      }
    })
}

buildObject = (subject, prefix) => {
  const propertiesForThisLevel = propMap => Object.keys(propMap)
  .filter(key => (key.indexOf(prefix) === 0) && (key.split('/').length === prefix.split('/').length))
  .map(propName => propMap[propName])

  const buildTree = (props) => props.forEach((prop) => {
    console.log(prop)
    if (PLD.isType(prop, 'object')) {
      buildObject(prop, `${prefix}${prop.propName}/`)
    }
  })

  subject.hasProperty = propertiesForThisLevel(properties)
  buildTree(subject.hasProperty)

  subject.hasOptionalProperty = propertiesForThisLevel(optionalProperties)
  buildTree(subject.hasOptionalProperty)
}

buildDoc = () => {
  const doc = {
    "@context": "semantic/context.json",
    "@id": nextId(),
    "@type": "q:Q102",
    "generatedBy": "TODO id",
    "usedBy": ["TODO url"],
    "label": "TODO",
    "description": "TODO",
    "typology": "TODO",
    "sourceDataController": "TODO",
    "updateFrequency": "TODO P1D",
    "updateLatency": "TODO P1D",
    "cozyDoctypeName": "TODO io.cozy",
    "syntheticSet": ["https://raw.githubusercontent.com/jacquarg/mesinfos-dev3/master/data/todo.json"],
    "cozyIndex": "TODO [\"_id\"]",
    "cozySelector": "TODO {\"_id\": { \"$gte\": null } }",
  }

  buildObject(doc, '')
  // console.log(JSON.stringify(doc, null, 2))
  console.log(Object.keys(optionalProperties).sort())
  return doc
}

init = () => {
  PLD.allItems = require('../build/items.json')
  delete PLD.allItems['@context']
}
// main

init()
const rawDocuments = require(process.argv[2])
const documents = rawDocuments.rows.map(item => item.doc)
indexProperties(documents)

fs.writeFileSync(process.argv[3], JSON.stringify(buildDoc(), null, 2))
