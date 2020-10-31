const fs = require('fs');
const readline = require('readline');

const {Client} = require('pg')
const client = new Client({
    connectionString: 'postgresql://postgres:12wert@127.0.0.1:5432/hack2020'
});

client.connect;

const lineReader = readline.createInterface({
    input: fs.createReadStream('./data/odh20200928')
});

const proceedLine = json => {
    console.log(json);
};

lineReader.on('line', function (line) {
    const ogh_object = JSON.parse(line);
    proceedLine(ogh_object);
});
