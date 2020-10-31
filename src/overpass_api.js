import OverpassFrontend from "overpass-frontend";

// you may specify an OSM file as url, e.g. 'test/data.osm.bz2'
const overpassFrontend = new OverpassFrontend('//overpass.kumi.systems/api/interpreter')



// request restaurants in the specified bounding box
overpassFrontend.BBoxQuery(
    'node["highway"]; way["highway"];relation["highway"];',
    { minlat: 48.19, maxlat: 48.20, minlon: 16.33, maxlon: 16.34 },
    {
        properties: OverpassFrontend.ALL
    },
    function (err, result) {
        console.log('* ' + result.tags.name + ' (' + result.id + ')')
    },
    function (err) {
        if (err) { console.log(err) }
    }
)