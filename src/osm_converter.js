import fs from 'fs';
import fs_extra from 'fs-extra';

import osmtogeojson from "osmtogeojson";

var DOMParser = require('xmldom').DOMParser;
var xpath = require('xpath');
var filterxml = require('filterxml')

console.log('Start reading ...');
const osm_data = fs.readFileSync('./data/1.osm', 'utf8');
console.log('Done.');

console.log('Start xml parsing ...');
const docNew = new DOMParser().parseFromString(osm_data);
console.log('Done.');

console.log('Start convert ...');

const polygonJSON = osmtogeojson(docNew);
console.log('Done.');

console.log('Save convert ...');
fs_extra.writeJsonSync('./data/moscow_roads.json', polygonJSON, {spaces: 4})
console.log('Done.');

