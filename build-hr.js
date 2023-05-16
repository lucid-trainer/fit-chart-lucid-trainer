#!/usr/bin/env node

const { readFileSync, rmSync, writeFileSync } = require('fs');
const { getFitbitData }= require("./utilities/build-util");
const ROOT_DIR = ".";

//get the fitbit data
const hr_file_data = getFitbitData();

//convert it to chart data
let dir = "";
let hrData = [];

for (const [i, value] of hr_file_data.entries()) {
  let row = '[new Date("' + value.timestamp + '"), ' + value.hr + '],';

  if (i === hr_file_data.length - 1) {
    //this is the last row, so get the dir name
    dir =  ROOT_DIR + "/staging/" + value.timestamp.split('T')[0];
  }

  hrData.push(row);
}

//insert the chart data into the template
const fileData = readFileSync(require.resolve("./template/hr.tmp"), { encoding: "utf8" });
const fileDataArray = fileData.split("\n");

let index = -1;

for (const [i, value] of fileDataArray.entries()) {
  if (value.includes("{hrData}")) {
    index = i;
  }
}
fileDataArray.splice(index, 1);

//write out the js file for the sleep stages chart
rmSync(dir + "/hr.js", {
  force: true,
});

fileDataArray.splice(index, 0, ...hrData); // insert data into the array
const newFileData = fileDataArray.join("\n"); // create the new file
writeFileSync(dir + "/hr.js", newFileData, { encoding: "utf8" }); // save it

