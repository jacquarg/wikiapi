#!/bin/node
var qIndex = require('../indexes/last_item_index.json').lastIndex;

var rowToProperty = function (row) {
  return {
    "name": row.Nom,
    "@id": `q:Q${++qIndex}`,
    "@type": "q:Q104",
    "description": row.Description,
    "exampleValue": row.Exemple,
    "kind": row.Nature,
    "format": row.format,
    "availability": row.Mise_à_disposition,
  };
};


var list = require('../../../Bureau/tableaux_MI.json')['Liste des données'];

var filtered = list.filter((item) => item.DocType === "VideoStream" && item.Détenteur === "Orange");
var properties = filtered.map(rowToProperty);
console.log(JSON.stringify(properties, null, 2));
console.log(filtered.length)
