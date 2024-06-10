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
let heartVarData = [];


for (const [i, value] of act_file_data.entries()) {
  moveData.push(value.moveZ);
  heartData.push(value.hr)
  heartVarData.push(value.hrVar)
  
  let stageLvl = 4.75;
  if(moveData.length >= 15) {
    let highActiveCnt = moveData.slice(-5).filter(it => it > .325).length;
    let activeCnt = moveData.slice(-5).filter(it => it > .2).length;
    let restCnt = moveData.slice(-4).filter(it => it > .11).length;
    let deepCnt = moveData.slice(-4).filter(it => it > .01).length;
    let lightCnt = moveData.slice(-4).filter(it => it > .02 && it <= .11).length;
    
    let recentMove = moveData.slice(-10).filter(it => it > .11).length;
    let extendedDeepCnt = moveData.slice(-36).filter(it => it > .02).length;

    //hr trigger
    const avgHeartRate = mean(heartData.slice(-15, -5).map(i => Number(i)));
    let recentHr = heartData.slice(-5);
    let stepHrIncrease = recentHr.filter(it => it > avgHeartRate+1.25).length >= 2 &&
      recentHr.filter(it => it > avgHeartRate+2.25).length >= 1 && extendedDeepCnt > 0

    //hrVar trigger
    const avgHeartVRRate = mean(heartVarData.slice(-15, -5).map(i => Number(i)));
    let recentHrVar = heartVarData.slice(-5);
    //let notCurrentMove = moveData.slice(-1) <= .02;
    let currentMove = moveData.slice(-4).filter(it => it > .05).length 
    let stepHrVarIncrease = currentMove == 0  && extendedDeepCnt > 0 && 
       ( recentHrVar.filter(it => it > avgHeartVRRate + .35).length >= 2 || 
         recentHrVar.filter(it => it > avgHeartVRRate + .7).length >= 1)
    
    let jumpHrVarIncrease = currentMove == 0 && recentHrVar.filter(it => it > avgHeartVRRate + 1).length >= 1


    // console.log("time = " + value.timestamp + ", avg=" + avgHeartRate + " recentMove=" + recentMove + 

    if(highActiveCnt >= 1 && activeCnt >= 2 && stepHrIncrease) {
      stageLvl = 4.75 //awake
    } else if(restCnt >= 1) {
      stageLvl = 4 //restless, might be waking
    } else if(recentMove == 0 && (stepHrIncrease || stepHrVarIncrease || jumpHrVarIncrease)) {
        stageLvl = 3.5 //rem candidate
    } else if (deepCnt === 0 && lightCnt === 0) {
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
