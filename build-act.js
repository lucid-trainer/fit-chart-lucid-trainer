#!/usr/bin/env node

const { readFileSync, rmSync, writeFileSync } = require('fs');
const { getFitbitData }= require("./utilities/build-util");
const ROOT_DIR = ".";

//get the fitbit data
const act_file_data = getFitbitData();

//convert it to chart data
let dir = "";
let actData = [];

for (const [i, value] of act_file_data.entries()) {
  let fieldValue = value.move;
  let row = '[new Date("' + value.timestamp + '"), ' + fieldValue +'],';

  if (i === act_file_data.length - 1) {
    //this is the last row, so get the dir name
    dir =  ROOT_DIR + "/staging/" + value.timestamp.split('T')[0];
  }

  actData.push(row);
}

//insert the chart data into the template
const fileData = readFileSync(require.resolve("./template/activity.tmp"), { encoding: "utf8" });
const fileDataArray = fileData.split("\n");

let index = -1;

for (const [i, value] of fileDataArray.entries()) {
  if (value.includes("{activityData}")) {
    index = i;
  }
}
fileDataArray.splice(index, 1);

//write out the js file for the sleep stages chart
rmSync(dir + "/activity.js", {
  force: true,
});

fileDataArray.splice(index, 0, ...actData); // insert data into the array
const newFileData = fileDataArray.join("\n"); // create the new file
writeFileSync(dir + "/activity.js", newFileData, { encoding: "utf8" }); // save it
