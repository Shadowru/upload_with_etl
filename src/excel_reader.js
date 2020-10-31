const XLSX = require('xlsx');
const fs_extra = require("fs-extra");

import proj4 from 'proj4';

const title_data_2020 = fs_extra.readJsonSync('./data/1.json');
const title_data_2019 = fs_extra.readJsonSync('./data/2.json');

const firstProjection = '+proj=tmerc +ellps=bessel +towgs84=316.151,78.924,589.65,-1.57273,2.69209,2.34693,8.4507 +units=m +lon_0=37.5 +lat_0=55.66666666667 +k_0=1 +x_0=0 +y_0=0\n';

const p4js = proj4(firstProjection);

function parseExcelList(file_name, year, row_function, title_list, title_data) {

    function findGeometry(name, start, end) {
        const geom_list = [];
        for (const element of title_data.features) {
            if (element.properties.Attributes.WorksPlace.indexOf(name) > -1) {
                geom_list.push(element)
            }
        }
        if (geom_list.length > 0) {
            return geom_list;
        }
        return undefined;
    }

    const workbook = XLSX.readFile(file_name);

    const first_sheet_name = workbook.SheetNames[0];

    const worksheet = workbook.Sheets[first_sheet_name];

    let start_row = row_function(worksheet);

    const range = worksheet['!ref'];

    function getFromRange(range) {
        //TODO: fix with backward read
        return parseInt(range.substr(range.indexOf(':') + 2));
    }

    const finish_row = getFromRange(range);

    console.log(finish_row);

    const getExcelVal = cell => {
        if (cell !== undefined) {
            return cell.v;
        }
        return '';
    }

    function validateRow(title_object) {
        return title_object !== undefined && title_object.state !== undefined && title_object.state !== '' && title_object.district !== '';
    }

    function convertCoords(geometry) {
        const mpkk_coords = [];
        for (const geometryElement of geometry.coordinates[0]) {
            const coordPair = p4js.forward(geometryElement);
            if(isNaN(coordPair[0])){
                console.log(geometryElement);
                return geometry;
            }
            mpkk_coords.push(
                coordPair
            );
        }

        geometry.coordinates = [mpkk_coords];

        return geometry;
    }

    while (true) {

        const curr_row = start_row++;

        if (curr_row > finish_row) {
            break;
        }

        try {
            const title_object_json = {};

            const title_object = {};

            title_object.year = year;

            title_object.cell_no = getExcelVal(worksheet['A' + curr_row]);

            title_object.cell_object = getExcelVal(worksheet['B' + curr_row]);

            title_object.cell_repair_start = getExcelVal(worksheet['C' + curr_row]);
            title_object.cell_repair_end = getExcelVal(worksheet['D' + curr_row]);

            title_object.district = getExcelVal(worksheet['E' + curr_row]).toUpperCase();

            title_object.state = getExcelVal(worksheet['F' + curr_row]);

            if (validateRow(title_object)) {

                const geometry_list = findGeometry(
                    title_object.cell_object,
                    title_object.cell_repair_start,
                    title_object.cell_repair_end
                );

                if (geometry_list !== undefined) {
                    if (geometry_list.length === 1) {
                        //const convGeometry = geometry_list[0].geometry;
                        const convGeometry = convertCoords(geometry_list[0].geometry);
                        if(convGeometry !== undefined) {
                            title_object_json.geometry = convGeometry;
                        }
                    } else {
                        console.log('geometry_list : ' + JSON.stringify(geometry_list));
                    }
                }

                title_object_json.properties = title_object;
                title_object_json.type = 'Feature';

                if(title_object_json.geometry !== undefined) {
                    title_list.push(title_object_json);
                }
            }

        } catch (ex) {
            console.error(ex);
        }
    }
}

const title_list = [];

parseExcelList(
    './data/Свод по замене асфальтового покрытия.xlsx',
    2020,
    function searchRow(worksheet) {
        return 7;
    },
    title_list,
    title_data_2020
)

parseExcelList(
    './data/Свод по замене асфальтового покрытия-2019.xlsx',
    2019,
    function searchRow(worksheet) {
        return 6;
    },
    title_list,
    title_data_2019
)

const geoJSON = {
    features: [],
    type: "FeatureCollection"
}

geoJSON.features = title_list;

fs_extra.writeJsonSync('./data/title_list.json', geoJSON, {spaces: 4});
