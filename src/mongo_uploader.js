import fs_extra from 'fs-extra';

import {MongoClient} from "mongodb";

const uri = "mongodb+srv://stellar:Ntcctkzwbz200@cluster0.nxiqh.mongodb.net/<dbname>?retryWrites=true&w=majority";
const client = new MongoClient(uri, {useNewUrlParser: true});
client.connect(err => {
    const unifiedStorage = client.db("hack2020").collection("unified_storage");

    unifiedStorage.find({}).toArray(function(err, docs) {
        console.log(err);
        console.log(docs);
    });

    const geoJSON = fs_extra.readJsonSync('./data/1.json');

    //console.log('Full size : ' + geoJSON.features.length)

    unifiedStorage.insertMany(geoJSON.features, function (err, result) {
        console.log(err);
        console.log(result);

        client.close();
    });
});
