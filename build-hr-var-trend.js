#!/usr/bin/env node

const { readFileSync, rmSync, writeFileSync } = require('fs');
const { getFitbitData, getMovingAverages, smoothSpikes }= require("./utilities/build-util");
const ROOT_DIR = ".";

//get the fitbit data
const orig_hr_file_data = getFitbitData();

//convert it to chart data
let dir = "";
let hrData = [];

const minMoveSize = .1;
const minHrVarSize = .5;
const maxHrVarSize = 2;

let fieldName = "hrVar";
let moveFieldName = "move";

smoothSpikes(orig_hr_file_data, moveFieldName, fieldName, minMoveSize, minHrVarSize, maxHrVarSize );
const hrvar_trend_data = getMovingAverages(orig_hr_file_data, fieldName, 10);

for (const [i, value] of hrvar_trend_data.entries()) {
  let row = '[new Date("' + value.timestamp + '"),' + value.movingAvg + 
    ',' + value.movingDev + '],';

  if (i === hrvar_trend_data.length - 1) {
    //this is the last row, so get the dir name
    dir =  ROOT_DIR + "/staging/" + value.timestamp.split('T')[0];
  }

  hrData.push(row);
}

//insert the chart data into the template
const fileData = readFileSync(require.resolve("./template/hr-var-trend.tmp"), { encoding: "utf8" });
const fileDataArray = fileData.split("\n");

let index = -1;

for (const [i, value] of fileDataArray.entries()) {
  if (value.includes("{hrData}")) {
    index = i;
  }
}
fileDataArray.splice(index, 1);

//write out the js file for the sleep stages chart
rmSync(dir + "/hr-var-trend.js", {
  force: true,
});

fileDataArray.splice(index, 0, ...hrData); // insert data into the array
const newFileData = fileDataArray.join("\n"); // create the new file
writeFileSync(dir + "/hr-var-trend.js", newFileData, { encoding: "utf8" }); // save it

