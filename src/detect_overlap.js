"use strict"

import * as turf from '@turf/turf'


const fs_extra = require("fs-extra");

const title_list = fs_extra.readJsonSync('./data/title_list.json');

const report = [];

for (const line1 of title_list.features) {

    if (line1.properties.year !== 2020) {
        continue;
    }

    for (const line2 of title_list.features) {

        if (line2.properties.year !== 2019) {
            continue;
        }

        const intersects = turf.lineIntersect(line1, line2);

        if (intersects.features.length > 0) {
            //console.log(JSON.stringify(intersects));

            report.push({
                line1: line1,
                line2: line2,
                intersects: intersects
            })

        }

    }
}

fs_extra.writeJsonSync('./data/report_2019_2020.json', report, {spaces: 4});
