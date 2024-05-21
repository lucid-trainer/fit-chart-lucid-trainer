#!/usr/bin/env node

const { readFileSync, rmSync, writeFileSync } = require('fs');
const { getFitbitData }= require("./utilities/build-util");
const { mean } = require("./utilities/math-util");
const ROOT_DIR = ".";

//get the fitbit data
const act_file_data = getFitbitData();

//convert it to chart data
let dir = "";
let actData = [];
let moveData = [];
let heartData = [];


for (const [i, value] of act_file_data.entries()) {
  moveData.push(value.moveZ);
  heartData.push(value.hr)
  
  let stageLvl = 4.75;
  if(moveData.length >= 10) {
    let highActiveCnt = moveData.slice(-5).filter(it => it > .325).length;
    let activeCnt = moveData.slice(-5).filter(it => it > .2).length;
    let restCnt = moveData.slice(-4).filter(it => it > .15).length;
    let deepCnt = moveData.slice(-4).filter(it => it > .01).length;
    let lightCnt = moveData.slice(-4).filter(it => it > .02 && it <= .15).length;

    const avgHeartRate = Math.round(mean(heartData.slice(-20, -10).map(i => Number(i))));
    let recentMove = moveData.slice(-8).filter(it => it > .02).length;
    let recentActive = moveData.slice(-12).filter(it => it > .2).length;
    let prevHeartCnt = heartData.slice(-10, -5).filter(it => it <= avgHeartRate).length;
    let heartCnt = heartData.slice(-5).filter(it => it > avgHeartRate+1).length;

    if(highActiveCnt >= 1 && activeCnt >= 2 && heartCnt >=2) {
      stageLvl = 4.75 //awake
    } else if(restCnt >= 1) {
      stageLvl = 4 //restless, might be waking
    } else if(recentActive == 0 && prevHeartCnt >= 2 && heartCnt >= 3) {
        stageLvl = 3.5 //rem candidate
    } else if (deepCnt === 0 && lightCnt === 0) {
      // console.log("time = " + value.timestamp + ", prev=" + heartData.slice(-8, -4).filter(it => it < 60) + " heart=" +
      // heartData.slice(-4).filter(it => it > 61))
        stageLvl = 1.5 //deep asleep 
    } else if ((deepCnt > 0 && lightCnt === 0) || recentMove > 1) {
        stageLvl = 2.0 //asleep
    } else {
        stageLvl = 2.5 //light, restless
    }
  } 

  if (i === act_file_data.length - 1) {
    //this is the last row, so get the dir name
    dir =  ROOT_DIR + "/staging/" + value.timestamp.split('T')[0];
  }
  
  let row = '[new Date("' + value.timestamp + '"), ' + stageLvl + '],';
  actData.push(row);
}

//insert the chart data into the template
const fileData = readFileSync(require.resolve("./template/activity-stage.tmp"), { encoding: "utf8" });
const fileDataArray = fileData.split("\n");

let index = -1;

for (const [i, value] of fileDataArray.entries()) {
  if (value.includes("{activityStageData}")) {
    index = i;
  }
}
fileDataArray.splice(index, 1);

//write out the js file for the sleep stages chart
rmSync(dir + "/activity-stage.js", {
  force: true,
});

fileDataArray.splice(index, 0, ...actData); // insert data into the array
const newFileData = fileDataArray.join("\n"); // create the new file
writeFileSync(dir + "/activity-stage.js", newFileData, { encoding: "utf8" }); // save it
