#!/bin/node
const parse = require('csv-parse/lib/sync')
const slug = require('slug')
const fs = require('fs')

const uuid = require('uuid/v4')

const DEFIS = {
  "Ados": {
    D1 : "S'évaluer autrement",
    D2 : "Se sensibiliser aux usages numériques",
    D3 : "Développer son esprit civique",
    D4 : "Gérer ses demandes administratives, se faciliter le quotidien (parents, enfants, enseignants)"
  },
  "TEE": {
    D1: "Réduire la production de déchets alimentaires",
    D2: "Consommer local et de saison",
    D3 : "Calculer et/ou réduire l'empreinte carbone de mon alimentation",
    D4 :"Maîtriser mon budget énergie",
    D5: "Trier et recycler",
    D6: "Adopter des éco-gestes",
    D7: "Connaître et bénéficier des aides ''transition énergétique''  auxquelles j'ai droit",
    D8: "Calculer l'empreinte carbone de mon logement",
    D9: "Aider à identifier le potentiel de production d'énergies propres sur mon territoire",
  },
  "Mobilité": {}
}

nextId = () => "q:Q" + uuid()

rowToDoc = (row) => {
  if (!row[0] || row[0] == '' ) {
    return null
  }
  var fileName = slug(row[0].toLowerCase())
  fileName = fileName.slice(Math.max(0, fileName.length - 16))
  fileName += '.json'

  const thematique = row[2]
  let defis = row[5].split('+')
  defis = defis.map((defi) => (DEFIS[thematique] && DEFIS[thematique][defi.trim()]) ?
    DEFIS[thematique][defi.trim()] : defi.trim()
  )

  return {
      fileName: fileName,
      doc: {
      "@context": "semantic/context.json",
      "@id": nextId(),
      "@type": ["object", "wq:Q1397073"],
      // "@type": "object",
      "label": row[0],
      "description": row[1],
      "thematique": thematique,
      "typology": row[8],
      "sourceDataController": row[3],
      "support": row[4],
      "defi": defis,
      "kind": row[6],
      "information": row[7],
      "access": row[9],
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
