#!/usr/bin/env node

const { readFileSync, rmSync, writeFileSync } = require('fs');
const { getFitbitData } = require("./utilities/build-util");
const { getCircadianData } = require("./utilities/circadian-util")
const ROOT_DIR = ".";

//get the fitbit data
const cp_file_data = getFitbitData();

//convert it to chart data
let dir = "";
let cpData = [];

let circadianData = getCircadianData(cp_file_data);

for (const [i, value] of cp_file_data.entries()) {
  let fieldValue = circadianData[i];
  let row = '[new Date("' + value.timestamp + '"), ' + fieldValue + '],';

  if (i === cp_file_data.length - 1) {
    //this is the last row, so get the dir name
    dir =  ROOT_DIR + "/staging/" + value.timestamp.split('T')[0];
  }

  cpData.push(row);
}

//insert the chart data into the template
const fileData = readFileSync(require.resolve("./template/clock-proxy.tmp"), { encoding: "utf8" });
const fileDataArray = fileData.split("\n");

let index = -1;

for (const [i, value] of fileDataArray.entries()) {
  if (value.includes("{cpData}")) {
    index = i;
  }
}
fileDataArray.splice(index, 1);

//write out the js file for the sleep stages chart
rmSync(dir + "/clock-proxy.js", {
  force: true,
});

fileDataArray.splice(index, 0, ...cpData); // insert data into the array
const newFileData = fileDataArray.join("\n"); // create the new file
writeFileSync(dir + "/clock-proxy.js", newFileData, { encoding: "utf8" }); // save it

