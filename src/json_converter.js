import fs_extra from 'fs-extra';
import * as turf from '@turf/turf'


const geoJSON = fs_extra.readJsonSync('./data/1.json');
//const geoJSON = fs_extra.readJsonSync('./data/odh20200928');

const exportFeatures = [];

function getStartEndPoint(feature) {

    const coordinates = feature.geometry.coordinates[0];

    //TODO: Check type and many multilines

    const startPoint = coordinates[0];

    const coordinates_end = feature.geometry.coordinates[feature.geometry.coordinates.length - 1];

    const endPoint = coordinates_end[coordinates_end.length - 1];

    return {
        startPoint: startPoint,
        endPoint: endPoint
    };
}

function convertLineToPolygonBuffer(feature, roadWidth) {
    return turf.buffer(feature, roadWidth, {units: 'meters'});
}

function convertLineToPolygon(feature, roadWidth) {

    const starboard = turf.lineOffset(
        feature,
        roadWidth,
        {units: 'meters'}
    )

    const portboard = turf.lineOffset(
        feature,
        -roadWidth,
        {units: 'meters'}
    )

    const polygonCoords = [];

    const starboardCoords = starboard.geometry.coordinates[0];

    for (const starboardCoord of starboardCoords) {
        polygonCoords.push(starboardCoord);
    }

    const portboardCoords = portboard.geometry.coordinates[0];
    let index = portboardCoords.length;

    //Custom Iterator
    const reversedIterator = {
        next: function () {
            index--;
            return {
                done: index < 0,
                value: portboardCoords[index]
            }
        }
    }

    reversedIterator[Symbol.iterator] = function () {
        return this;
    }

    for (let portboardCoord of reversedIterator) {
        polygonCoords.push(portboardCoord);
    }

    polygonCoords.push(polygonCoords[0]);

    return turf.polygon([polygonCoords], feature.properties);

}

function calcEpsilon(feature) {

    var bbox = turf.bbox(feature);

    const dim1 = turf.distance([bbox[0], bbox[1]], [bbox[2], bbox[1]], {units: 'meters'});
    const dim2 = turf.distance([bbox[0], bbox[1]], [bbox[0], bbox[3]], {units: 'meters'});

    const min = Math.min(dim1, dim2);
    const max = Math.min(dim1, dim2);

    const uniformity = max / min;

    const l = turf.length(
        feature,
        {units: 'meters'}
    );
    return l / uniformity;
}

function calcSelfIntersect(feature) {
    const kinks = turf.kinks(feature);
    return kinks;
}

function convertLine(feature, intersectPoint) {

    const intersect_coords = intersectPoint.geometry.coordinates;
    const coords = turf.getCoords(feature)[0];

    coords[0] = intersect_coords;
    coords[coords.length - 1] = intersect_coords;

    return turf.lineToPolygon(feature);

    //console.log('1');

}

const statisticMap = new Map();

statisticMap.set(0, 0);
statisticMap.set(1, 0);
statisticMap.set(2, 0);
statisticMap.set(3, 0);
statisticMap.set(4, 0);
statisticMap.set(5, 0);

for (const feature of geoJSON.features) {

    const workstatus = feature.properties.Attributes.WorksStatus;

    if (workstatus !== 'закончены') {
        continue;
    }

    const worksPlace = feature.properties.Attributes.WorksPlace;

    const global_id = feature.properties.Attributes.global_id;

    feature.properties.global_id = global_id;

    if (global_id === 1032995558) {
        console.log('Test ID : ' + global_id);
    }

    const {startPoint, endPoint} = getStartEndPoint(feature);

    const raw_distance = turf.distance(
        startPoint,
        endPoint,
        {units: 'meters'}
    );

    //const expectedEpsilon = calcEpsilon(feature);
    const featureLength = turf.length(feature, {units: "meters"});

    const epsilon = Math.max(5, featureLength / 20);


    //distance < expectedEpsilon
    let convert_type = 5;

    const intersects_kinks = calcSelfIntersect(feature);

    const intersects = intersects_kinks !== undefined ? intersects_kinks.features.length : 0

    if (raw_distance < epsilon) {
        if (intersects === 1) {
            convert_type = 0;
        } else {
            convert_type = 1;
        }
    }


    /*
    if (convert_type === 1) {
        if (distance < 5) {
            convert_type = 1;
        }
    }
     */

    statisticMap.set(
        convert_type,
        statisticMap.get(convert_type) + 1
    );

    switch (convert_type) {
        case 0:
            feature.properties.converter = 'Polygon convert';

            try {
                exportFeatures.push(
                    convertLine(feature, intersects_kinks.features[0])
                    //turf.lineToPolygon(feature)
                )
            } catch (e) {
                console.log(
                    'Ex : ' + e,
                    JSON.stringify(feature, null, 4)
                )
            }
            break;
        case 1:
            try {
                turf.featureEach(turf.polygonize(feature), currentFeature => {
                    exportFeatures.push(
                        currentFeature
                    )
                })

            } catch (e) {
                console.log(
                    'Ex : ' + e,
                    JSON.stringify(feature, null, 4)
                )
            }
            break;
        case 2:
            feature.properties.converter = 'Road convert';
            try {
                exportFeatures.push(
                    convertLineToPolygonBuffer(feature, 5)
                )
            } catch (ex) {
                console.log(
                    'Ex : ' + ex,
                    'Global ID : ' + global_id
                )
            }
            break;
        case 3:
            try {
                const convex = turf.convex(
                    feature,
                    {
                        concavity: 1
                    }
                );
                convex.properties = feature.properties;
                exportFeatures.push(
                    convex
                );
            } catch (ex) {
                console.log(
                    'Ex : ' + ex,
                    'Global ID : ' + global_id
                )
            }
            break;
        case 5:
            exportFeatures.push(
                feature
            )
            break;
    }
}

const polygonJSON = turf.featureCollection(exportFeatures);

fs_extra.writeJsonSync('./data/convert.json', polygonJSON, {spaces: 4});

console.log(statisticMap);
