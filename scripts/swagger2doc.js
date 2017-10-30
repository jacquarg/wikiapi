#!/bin/node
// From a list of document of the same doctype, build documentation tree.
// usage : node scripts/doctypes2docs inDoctypes outJSONLD [syntheticset]

const PLD = require('prototype-ld')
const fs = require('fs')
const { get } = require('walktree')

let lastIndex = require('../indexes/last_item_index.json').lastIndex

const properties = {}
const optionalProperties = {}

nextId = () => `q:Q${++lastIndex}`

buildProp = (propName, value) => {
  // Find existing props, with same propName
  const props = PLD.listInstanceOf('q:Q104')
  const candiateExistingProps = PLD.where({ propName: propName }, props)
  const prop = {
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
  PLD.allItems[prop['@id']] = prop
  return prop
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

buildArrayProp = (propName, value) => {
  return {
    "label": propName,
    "propName": propName,
    "@id": nextId(),
    "@type": "array",
    "description": "TODO",
    "kind": "TODO",
    "items": []
  }
}


browseProp = (obj, prefix, options) => {
  switch(obj.type) {
    case 'object':
  }
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


buildProperty = (propName, definition) => {
  switch(definition.type) {
    case 'object': {
      const objProp = buildObjectProp(propName)
      buildObject(objProp, definition.properties)
      return objProp
    }
    case 'array': {
      const arrayProp = buildArrayProp(propName)
      arrayProp.items = buildProperty(`${propName}Item`, definition.items)
      return arrayProp
    }
    default: return buildProp(propName)
  }
}


buildObject = (subject, definitions) => {
  subject.hasProperty = Object.keys(definitions)
    .map(propName => buildProperty(propName, definitions[propName]))
}

buildDoc = (name, definition) => {
  const doc = {
    "@context": "semantic/context.json",
    "@id": nextId(),
    "@type": "q:Q102",
    "generatedBy": "TODO id",
    "usedBy": ["TODO url"],
    "label": name,
    "description": get(definition, 'get', 'description'),
    "typology": "TODO",
    "sourceDataController": "TODO",
    "updateFrequency": "TODO P1D",
    "updateLatency": "TODO P1D",
    "cozyDoctypeName": "TODO io.cozy",
    "syntheticSet": ["https://raw.githubusercontent.com/jacquarg/mesinfos-dev3/master/data/todo.json"],
    "cozyIndex": "TODO [\"_id\"]",
    "cozySelector": "TODO {\"_id\": { \"$gte\": null } }",
  }

  const schema = get(definition, 'get', 'responses', '200', 'schema')
  if (!schema) {
    console.warn(`no properties for ${name}`)
    return null
  }

  switch (schema.type) {
    case 'object' : buildObject(doc, schema.properties); break;
    case 'array' : doc.hasProperty = buildProperty(name, schema); break;
    default:  doc.hasProperty = buildProperty(name, schema); break;
  }

  console.log(JSON.stringify(doc, null, 2))
  // console.log(JSON.stringify(doc, null, 2))
  // console.log(Object.keys(optionalProperties).sort())
  return doc
}

readDefinitions = (swagger) => {
  swagger.definitions
}

init = () => {
  PLD.allItems = require('../build/items.json')
  delete PLD.allItems['@context']
}
// main

init()
// const fs = require('fs')
// const yaml = require('js-yaml')
// const swagger = yaml.safeLoad(fs.readFileSync(process.argv[2])
const SwaggerParser = require('swagger-parser')

SwaggerParser.dereference(process.argv[2])
.then((swagger) => {
  const docs = Object.keys(swagger.paths).map(pathName => buildDoc(pathName, swagger.paths[pathName])).filter(doc => doc != null)

  // readPath(swagger)
  docs.forEach((doc, index) => {
    fs.writeFileSync(`doc${index}.json-ld`, JSON.stringify(doc, null, 2))
  })
})
