#!/usr/bin/env node

const { readFileSync, rmSync, writeFileSync } = require('fs');
const { getAppData }= require("./utilities/build-util");
const ROOT_DIR = ".";

//get the fitbit data
const app_file_data = getAppData();

//convert it to chart data
let dir = "";
let appData = [];

//add the start of first "0" block
let row = '[new Date("' + app_file_data.at(0).readingTimestamp + '"), ' + 0 +', transparent],';
appData.push(row);
let endDateTime = undefined;

//now build the rest of the blocks 
for (const [i, value] of app_file_data.entries()) {
  if(value["eventType"]) {

    let len = 4;
    let style = "awake";

    if (value["eventType"].includes("light")) {
      len = 2;
      style = "lightp";
    }

    if (value["eventType"].includes("rem")) {
      let intensity = value["intensity"];
      if (intensity === 5) intensity = 4;

      len = 2;
      style = "remp" + intensity;
    }

    let startDateTime = new Date(value.readingTimestamp);
      startDateTime= new Date(startDateTime.getTime() - (startDateTime.getTimezoneOffset() * 60000))
   //      (startDateTime.getTimezoneOffset() * 60000) - (len*60000)); //push the time back depending on len
    let startDateTimeStr = startDateTime.toJSON().slice(0,-1);

    //finish the last transparent block
    row = '[new Date("' + startDateTimeStr + '"), ' + 0 +', transparent],';
    appData.push(row);

    //create the beginning of the app event block
    row = '[new Date("' + startDateTimeStr + '"), ' + 10 +', ' + style + ' ],';
    appData.push(row);

    //create the end row of the app event block
    endDateTime = new Date(startDateTime.getTime() + (len*60000)); //add 1 minutes for each tick of len
    let endDateTimeStr = endDateTime.toJSON().slice(0,-1);
    row = '[new Date("' + endDateTimeStr + '"), ' + 10 +', ' + style + ' ],';
    appData.push(row);

    //start the next transparent block
    row = '[new Date("' + endDateTimeStr  + '"), ' + 0 +', transparent ],';
    appData.push(row);
  }
  
  if (i === app_file_data.length - 1) {
    //this is the last row, so get the dir name
    dir =  ROOT_DIR + "/staging/" + value.readingTimestamp.split('T')[0];
    
    //add the end of the last transparent block
    let lastDateTime = new Date(app_file_data.at(-1).readingTimestamp);
    lastDateTime= new Date(lastDateTime.getTime() - (lastDateTime.getTimezoneOffset() * 60000));

    if(lastDateTime < endDateTime) {
      //the last app event was close enough to the end that we can just treat it as the end
      appData.splice(-1)
    } else {
      let lastDateTimeStr = lastDateTime.toJSON().slice(0,-1)
      row = '[new Date("' + lastDateTimeStr + '"), ' + 0 +', transparent ],';
      appData.push(row);
    }
  }
}

//insert the chart data into the template
const fileData = readFileSync(require.resolve("./template/app-event.tmp"), { encoding: "utf8" });
const fileDataArray = fileData.split("\n");

let index = -1;

for (const [i, value] of fileDataArray.entries()) {
  if (value.includes("{appEventData}")) {
    index = i;
  }
}
fileDataArray.splice(index, 1);

//write out the js file for the sleep stages chart
rmSync(dir + "/app-event.js", {
  force: true,
});

fileDataArray.splice(index, 0, ...appData); // insert data into the array
const newFileData = fileDataArray.join("\n"); // create the new file
writeFileSync(dir + "/app-event.js", newFileData, { encoding: "utf8" }); // save it

