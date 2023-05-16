#!/usr/bin/env node

const { readFileSync, mkdirSync, rmSync, copyFile, writeFileSync } = require('fs');
const { getSleepData }= require("./utilities/build-util");

const ROOT_DIR = ".";

const levels = {
  wake: 9,
  light: 5,
  deep: 3,
  rem: 7
};

//convert data from sleep file to chart data
let { data } = getSleepData().sleep[0].levels;
let stagesData = [];
let dir = "";

for (const [i, value] of data.entries()) {
  let row = '[new Date("' + value.dateTime + '"), ' + levels[value.level] +', ' + value.level + '],';


  let nextRowDateTimeStr = "";

  if (i < data.length - 1) {
    nextRowDateTimeStr = data[i+1].dateTime;
  } else {
    //this is the last row, so calculate end of period by adding the seconds.
    let endDateTime = new Date(value.dateTime);
    endDateTime= new Date(endDateTime.getTime() - (endDateTime.getTimezoneOffset()-(value.seconds/60)) * 60000);
    nextRowDateTimeStr = endDateTime.toJSON().slice(0,-1);
    dir =  ROOT_DIR + "/staging/" + value.dateTime.split('T')[0];
  }
  let row2 = '[new Date("' + nextRowDateTimeStr +'"), ' + levels[value.level] +', ' + value.level + '],';

  stagesData.push(row);
  stagesData.push(row2);
}

//insert the chart data into the template
const fileData = readFileSync(require.resolve("./template/stages.tmp"), { encoding: "utf8" });
const fileDataArray = fileData.split("\n");

let index = -1;

for (const [i, value] of fileDataArray.entries()) {
  if (value.includes("{stagesData}")) {
    index = i;
  }
}
fileDataArray.splice(index, 1);


//remove and create directory and copy static files
rmSync(dir, {
  recursive: true, 
  force: true,
});
mkdirSync(dir);

const onError = (err) => {
  if (err) throw err;
}

copyFile(ROOT_DIR + "/template/charts.html", dir + "/charts.html", onError);
copyFile(ROOT_DIR + "/template/styles.css", dir + "/styles.css", onError);


//write out the js file for the sleep stages chart
fileDataArray.splice(index, 0, ...stagesData); // insert data into the array
const newFileData = fileDataArray.join("\n"); // create the new file
writeFileSync(dir + "/stages.js", newFileData, { encoding: "utf8" }); // save it

