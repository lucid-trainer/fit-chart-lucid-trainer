#!/usr/bin/env node

const { readFileSync, rmSync, writeFileSync } = require('fs');
const { getFitbitData }= require("./utilities/build-util");
const ROOT_DIR = ".";

//get the fitbit data that contains the position report
const pos_file_data = getFitbitData();

//convert it to chart data
let dir = "";
let posData = [];

for (const [i, value] of pos_file_data.entries()) {
  let fieldValue = value.positionArray;
  let row = '[new Date("' + value.timestamp + '"), ' + fieldValue[1].x + ',' + 
    fieldValue[1].y + ',' + fieldValue[1].z + '],';

  if (i === pos_file_data.length - 1) {
    //this is the last row, so get the dir name
    dir =  ROOT_DIR + "/staging/" + value.timestamp.split('T')[0];
  }

  posData.push(row);
}

//insert the chart data into the template
const fileData = readFileSync(require.resolve("./template/pos.tmp"), { encoding: "utf8" });
const fileDataArray = fileData.split("\n");

let index = -1;

for (const [i, value] of fileDataArray.entries()) {
  if (value.includes("{posData}")) {
    index = i;
  }
}
fileDataArray.splice(index, 1);

//write out the js file for the sleep stages chart
rmSync(dir + "/pos.js", {
  force: true,
});

fileDataArray.splice(index, 0, ...posData); // insert data into the array
const newFileData = fileDataArray.join("\n"); // create the new file
writeFileSync(dir + "/pos.js", newFileData, { encoding: "utf8" }); // save it
