import fs_extra from 'fs-extra';

import Datastore from "nestdb";

const db = new Datastore();

const geoJSON = fs_extra.readJsonSync('./data/1.json');

console.log('Full size : ' + geoJSON.features.length)

for (const feature of geoJSON.features) {
    db.insert(
        feature
    )
}

const geoJSON2 = fs_extra.readJsonSync('./data/2.json');

console.log('Full size : ' + (geoJSON.features.length + geoJSON2.features.length))

for (const feature of geoJSON2.features) {
    db.insert(
        feature
    )
}


db.find({"properties.Attributes.WorksStatus": {$regex: /закончены/}}, (err, docs) => {
    console.log(docs.length)
});

db.find({"properties.Attributes.WorksStatus": {$regex: /начаты/}}, (err, docs) => {
    console.log(docs.length)
});

db.find({"properties.Attributes.WorksStatus": {$regex: /идут/}}, (err, docs) => {
    console.log(docs.length)
});


db.find({"properties.Attributes.WorksStatus": {$regex: /закончены/}}, (err, docs) => {

});
