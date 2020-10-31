import {v4 as uuidv4} from 'uuid';
import fs_extra from 'fs-extra';
import * as turf from '@turf/turf'


const {Client} = require('pg')
const client = new Client({
    connectionString: 'postgresql://postgres:12wert@127.0.0.1:5432/hack2020'
});

const geoJSON = fs_extra.readJsonSync('./data/convert.json');

client.connect();

const promisesList = [];

for (const feature of geoJSON.features) {

    const insertPromise = new Promise((resolve, reject) => {

        try {

            const global_id = feature.properties.global_id;

            let table_name = 'title_list_line';

            const geom = turf.getType(feature);

            if (geom === 'Polygon') {
                table_name = 'title_list_polygon';
            }

            if (geom === 'MultiPolygon') {
                table_name = 'title_list_multipolygon';
            }

            client.query('SELECT * from ' + table_name + ' where name = $1', [global_id], (err, res) => {
                //console.log(res);

                let sql = '#BAD SQL#';

                if (res.rowCount === 0) {

                    sql = 'INSERT INTO ' + table_name + '(gid, name, bounds) VALUES($1, $2, ST_transform(ST_GeomFromGeoJSON($3), 3857))';

                    client.query(sql, [uuidv4(), global_id, JSON.stringify(feature.geometry)]).then((err, res) => {
                        console.log(res);
                        resolve('Done');
                    });

                } else {

                    resolve('Done');
                }

            });
        } catch (ex) {
            reject(ex);
        }
    });

    promisesList.push(insertPromise);

    //console.log(feature);

}

Promise.all(promisesList).then(
    value => {
        client.end();
    }
)

