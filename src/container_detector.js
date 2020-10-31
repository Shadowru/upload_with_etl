import fs_extra from 'fs-extra';
import * as turf from '@turf/turf'
import OverpassFrontend from "overpass-frontend";

// you may specify an OSM file as url, e.g. 'test/data.osm.bz2'
const overpassFrontend = new OverpassFrontend('//overpass.kumi.systems/api/interpreter')

const geoJSON = fs_extra.readJsonSync('./data/1.json');

function convertToCoord(geometry) {

    const coord = [];

    for (const geometryElement of geometry) {
        coord.push(
            [
                geometryElement.lon,
                geometryElement.lat
            ]
        )
    }

    return coord;
}

const geojsonPromises = [];

const max_feature = 3;
let curr_feature = 0;

for (const feature of geoJSON.features) {

    const featureBbox = turf.bbox(feature);

    //console.log(featureBbox);

    const processPromise = new Promise((resolve, reject) => {
        overpassFrontend.BBoxQuery(
            'node["highway"]; way["highway"];relation["highway"];',
            {minlat: featureBbox[1], maxlat: featureBbox[3], minlon: featureBbox[0], maxlon: featureBbox[2]},
            {
                properties: OverpassFrontend.ALL
            },
            function (err, result) {
                try {
                    console.log('* ' + result.tags.name + ' (' + result.id + ')')

                    const filteredGEOJSON = turf.lineString(
                        convertToCoord(result.geometry),
                        result.data
                    );

                    resolve(filteredGEOJSON);
                } catch (ex) {
                    console.log(ex);
                }
            },
            function (err) {
                if (err) {
                    console.log(err)
                    reject(err);
                }
            }
        )
    });

    geojsonPromises.push(processPromise);

    if (curr_feature++ > max_feature)
        break;
}

Promise.all(geojsonPromises).then(value => {
    fs_extra.writeJsonSync('./data/moscow_roads.json', turf.featureCollection(
        value
    ), {spaces: 4});
}, reason => {
    console.log(reason)
});
