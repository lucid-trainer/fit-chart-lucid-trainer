const { readFileSync, rmSync, writeFileSync } = require('fs');
const oplog_data = require("../staging/oplog.json");

let outData = [];

for (const [i, value] of oplog_data.entries()) {
    if(value.o.sessionId != undefined) {
        outData.push(JSON.stringify(value.o, null, 2));
    }    
}

const newFileData = "[" + outData.join(",\n") +"]"; // create the new file

//write out the js file for the sleep stages chart
rmSync("./staging/oplogout.json", {
    force: true,
  });

writeFileSync("./staging/oplogout.json", newFileData, { encoding: "utf8" }); // save it
