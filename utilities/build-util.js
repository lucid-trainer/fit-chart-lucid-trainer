const { mean, sd }= require("./math-util");

const sleep_stage_data = require("../staging/fit-sleep-stage.json");

const fit_data = require("../staging/fit-data.json");

const getSleepData = () => sleep_stage_data;

/*
* Get the first and last time stamp from the sleep stages
*/
const getSleepStageFirstLast = () => {
  let { data } = sleep_stage_data.sleep[0].levels;
  let [start, end] =  data.filter((item, i) => (i == 0) || (i == data.length - 1));
  let startDateTime = start.dateTime;
  let endDateTime = new Date(end.dateTime);
  endDateTime= new Date(endDateTime.getTime() - (endDateTime.getTimezoneOffset()-(end.seconds/60)) * 60000);

  return [startDateTime, endDateTime.toJSON().slice(0,-1)];
}

/*
* Gets the data from the trainer app and trims to match sleep stage data
*/
const getFitbitData = () => {
  let trimFitbitData = [];
  let [first, last] = getSleepStageFirstLast();
  let firstDateTime = new Date(first);
  let lastDateTime = new Date(last); 

  fit_data.sort(sortByTimestamp);

  for (const [i, value] of fit_data.entries()) {
    let dateTime = new Date(value.timestamp);
  
    if( dateTime >= firstDateTime && dateTime <= lastDateTime) {
      trimFitbitData.push(value);
    }
  }

  //round out the start and end elements if needed
  if(new Date(trimFitbitData[0].timestamp) > firstDateTime) {
    dummyFirst = JSON.parse(JSON.stringify(trimFitbitData[0]));
    dummyFirst.timestamp = first;
    trimFitbitData.unshift(dummyFirst);    
  }

  let len = trimFitbitData.length;
  if(new Date(trimFitbitData[len-1].timestamp) < lastDateTime) {
    dummyLast = JSON.parse(JSON.stringify(trimFitbitData[len-1]));
    dummyLast.timestamp = last;
    trimFitbitData.push(dummyLast);   
  }

  return trimFitbitData;
}

const getDreamData = () => {
  //get the data from the app
  const dream_file_data = getFitbitData();

  let prevIdx = 0;

  //loop through and combine consecutive values that are really one dream report
  for (const [i, value] of dream_file_data.entries()) {
    if(value["event"] && value["event"].includes("dream")) {
      let timestamp = value.timestamp;
      let dreamEvent = value.event;
      if(prevIdx > 0 && i < prevIdx + 3) {
        //combine the entries
        let prevDreamEvent = dream_file_data[prevIdx].event;
        let prevLen = prevDreamEvent.split(".")[1];
        let len =  dreamEvent.split(".")[1];
        prevLen = Number(prevLen) + Number(len);
        prevLen = prevLen > 5 ? 5 : prevLen;
        
        dream_file_data[prevIdx].event = "dream." + prevLen;
        delete dream_file_data[i].event;
      } else {
        prevIdx = i;
      }
    }
  }

  return dream_file_data;
}

const sortByTimestamp = (a, b) => {
  return a.timestamp.localeCompare(b.timestamp);
}

module.exports = {
  getSleepData,
  getFitbitData,
  getDreamData
 }