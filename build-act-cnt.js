#!/usr/bin/env node

const { readFileSync, rmSync, writeFileSync } = require('fs');
const { getFitbitData }= require("./utilities/build-util");
const { getActivityCountByRow } = require("./utilities/activity-cnt-util");

const ROOT_DIR = ".";

//get the fitbit data
const act_file_data = getFitbitData();

//convert it to chart data
let dir = "";
var actData = [];

console.log("starting activity count");
getActivityCountByRow(act_file_data).then(
  data => {
    actData = data;

    console.log("data=" + JSON.stringify(data));

    for (const [i, value] of act_file_data.entries()) {
      if (i === act_file_data.length - 1) {
        //this is the last row, so get the dir name
        dir =  ROOT_DIR + "/staging/" + value.timestamp.split('T')[0];
      }
    }

    //insert the chart data into the template
    console.log("write the file");
    const fileData = readFileSync(require.resolve("./template/act-cnt.tmp"), { encoding: "utf8" });
    const fileDataArray = fileData.split("\n");

    let index = -1;

    for (const [i, value] of fileDataArray.entries()) {
      if (value.includes("{activityData}")) {
        index = i;
      }
    }
    fileDataArray.splice(index, 1);

    //write out the js file for the sleep stages chart
    rmSync(dir + "/act-cnt.js", {
      force: true,
    });

    fileDataArray.splice(index, 0, ...actData); // insert data into the array
    const newFileData = fileDataArray.join("\n"); // create the new file
    writeFileSync(dir + "/act-cnt.js", newFileData, { encoding: "utf8" }); // save it

    console.log("finished");

  },
  err=>  {console.error("async error:" + err);}
);

