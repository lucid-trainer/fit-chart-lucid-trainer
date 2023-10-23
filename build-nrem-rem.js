#!/usr/bin/env node

const { readFileSync, rmSync, writeFileSync } = require('fs');
const { getFitbitData } = require("./utilities/build-util");
const { getNremAndRemModelData } = require("./utilities/nrem-rem-util")
const ROOT_DIR = ".";

//get the fitbit data
const stage_file_data = getFitbitData();

//convert it to chart data
let dir = "";
var stageData = [];

let nremAndRemResults = getNremAndRemModelData(stage_file_data);
let nrem3Data = nremAndRemResults.nrem3;
let remData = nremAndRemResults.rem;

/****
 * NREM3 chart
 */

for (const [i, value] of stage_file_data.entries()) {
  let fieldValue = nrem3Data[i];
  let row = '[new Date("' + value.timestamp + '"), ' + JSON.stringify(fieldValue) + '],';

  if (i === stage_file_data.length - 1) {
    //this is the last row, so get the dir name
    dir =  ROOT_DIR + "/staging/" + value.timestamp.split('T')[0];
  }

  stageData.push(row);
}

//insert the chart data into the template
var fileData = readFileSync(require.resolve("./template/nrem3.tmp"), { encoding: "utf8" });
var fileDataArray = fileData.split("\n");

let index = -1;

for (const [i, value] of fileDataArray.entries()) {
  if (value.includes("{nrem3Data}")) {
    index = i;
  }
}
fileDataArray.splice(index, 1);

//write out the js file for the nrem3 chart
rmSync(dir + "/nrem3.js", {
  force: true,
});

fileDataArray.splice(index, 0, ...stageData); // insert data into the array
var newFileData = fileDataArray.join("\n"); // create the new file
writeFileSync(dir + "/nrem3.js", newFileData, { encoding: "utf8" }); // save it

/****
 * REM chart
 */

stageData = [];

for (const [i, value] of stage_file_data.entries()) {
  let fieldValue = remData[i];
  let row = '[new Date("' + value.timestamp + '"), ' + JSON.stringify(fieldValue) + '],';

  stageData.push(row);
}


//insert the chart data into the template
fileData = readFileSync(require.resolve("./template/rem.tmp"), { encoding: "utf8" });
fileDataArray = fileData.split("\n");

index = -1;

for (const [i, value] of fileDataArray.entries()) {
  if (value.includes("{remData}")) {
    index = i;
  }
}
fileDataArray.splice(index, 1);

//write out the js file for the nrem3 chart
rmSync(dir + "/rem.js", {
  force: true,
});

fileDataArray.splice(index, 0, ...stageData); // insert data into the array
newFileData = fileDataArray.join("\n"); // create the new file
writeFileSync(dir + "/rem.js", newFileData, { encoding: "utf8" }); // save it

