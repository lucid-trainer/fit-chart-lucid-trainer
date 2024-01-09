#!/usr/bin/env node

const { readFileSync, rmSync, writeFileSync } = require('fs');
const { getDreamData }= require("./utilities/build-util");
const ROOT_DIR = ".";

//get the fitbit data
const dream_file_data = getDreamData();

//convert it to chart data
let dir = "";
let dreamData = [];

//add the start of first "0" block
let row = '[new Date("' + dream_file_data.at(0).timestamp + '"), ' + 0 +', transparent],';
dreamData.push(row);
let endDateTime = undefined;

//now build the rest of the blocks 
for (const [i, value] of dream_file_data.entries()) {
  if(value["event"]  && value["event"].includes("dream")) {
    let eventArray = value.event.split(".");
    let len = eventArray[1];

    let startDateTime = new Date(value.timestamp);
    startDateTime= new Date(startDateTime.getTime() - 
       (startDateTime.getTimezoneOffset() * 60000) - (len*5*60000) - (2*60000)); //push the time back in time based on clicks
         //to account for perceived length of dream and add two minutes for wakeup/reporting delay
    let startDateTimeStr = startDateTime.toJSON().slice(0,-1);

    //finish the last transparent block
    row = '[new Date("' + startDateTimeStr + '"), ' + 0 +', transparent],';
    dreamData.push(row);

    //create the beginning of the dream event block
    row = '[new Date("' + startDateTimeStr + '"), ' + 8 +', dream ],';
    dreamData.push(row);

    //create the end row of the dream event block
    endDateTime = new Date(startDateTime.getTime() + (len*5*60000)); //add 5 minutes for each click
    let endDateTimeStr = endDateTime.toJSON().slice(0,-1);
    row = '[new Date("' + endDateTimeStr + '"), ' + 8 +', dream ],';
    dreamData.push(row);

    //start the next transparent block
    row = '[new Date("' + endDateTimeStr  + '"), ' + 0 +', transparent ],';
    dreamData.push(row);
  }
  
  if (i === dream_file_data.length - 1) {
    //this is the last row, so get the dir name
    dir =  ROOT_DIR + "/staging/" + value.timestamp.split('T')[0];
    
    //add the end of the last transparent block
    let lastDateTime = new Date(dream_file_data.at(-1).timestamp);
    lastDateTime= new Date(lastDateTime.getTime() - (lastDateTime.getTimezoneOffset() * 60000));

    if(lastDateTime < endDateTime) {
      //the last dream was close enough to the end that we can just treat it as the end
      dreamData.splice(-1)
    } else {
      let lastDateTimeStr = lastDateTime.toJSON().slice(0,-1)
      row = '[new Date("' + lastDateTimeStr + '"), ' + 0 +', transparent ],';
      dreamData.push(row);
    }
  }
}

//insert the chart data into the template
const fileData = readFileSync(require.resolve("./template/dream.tmp"), { encoding: "utf8" });
const fileDataArray = fileData.split("\n");

let index = -1;

for (const [i, value] of fileDataArray.entries()) {
  if (value.includes("{dreamData}")) {
    index = i;
  }
}
fileDataArray.splice(index, 1);

//write out the js file for the sleep stages chart
rmSync(dir + "/dream.js", {
  force: true,
});

fileDataArray.splice(index, 0, ...dreamData); // insert data into the array
const newFileData = fileDataArray.join("\n"); // create the new file
writeFileSync(dir + "/dream.js", newFileData, { encoding: "utf8" }); // save it

