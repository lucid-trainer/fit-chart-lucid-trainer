const { spawnSync } = require('child_process');
const { appendFile } = require('fs/promises');
const { join } = require('path');

//https://dev.to/halolab/how-to-run-a-python-script-from-nodejs-3f0a

const getActivityCountByRow = async (act_file_data) => {
    let actData = [];
    for (const [i, value] of act_file_data.entries()) {
        let data = await getActivityCount(value.accelz.split(",").map(Number));
        let row = '[new Date("' + value.timestamp + '"), ' + data +'],';  
        actData.push(row); 
    }
    return actData;
}

const getActivityCount = async (actz) => {
    //const actz = [2.7666,2.7666,2.7666,2.5798,2.5248,3.4382,3.4525,4.1289,3.4789,4.4701,2.9785,4.1816,5.5571,5.6385,6.0264,6.4286,6.9518,6.8129,6.7483,6.8321,6.9530,6.9685,6.9326,6.8788,6.9973,6.7926,6.8380,6.8740,6.8548,6.7806,6.7985,6.7782,6.8788,6.8764,6.8536,6.8428,6.8416,6.7746,6.8333,6.8584,6.8273,6.8081,6.8380,6.7662,6.8333,6.8201,6.7746,6.8404,6.7961,6.8141,6.8213,6.7914,6.8177,6.7914,6.8153,6.8045,6.7782,6.8117,6.7423,6.7255,6.7734,6.7507,6.7016,6.7243,6.7902,6.8991,6.6884,6.2550,5.5715,5.4925,4.4019,4.5324,4.7071,4.6006,4.4067,4.7706,4.4797,4.5036,4.6497,4.5503,4.6198,4.7203,4.8281,4.7670,4.7550,5.1465,4.7682,4.7969,4.7574,4.6221,4.6078,4.6054,4.6808,4.7455,4.5970,4.8161,4.6221,4.6569,4.7227,4.7012,4.6736,4.6796,4.7478,4.7538,4.7012,4.7502,4.7490,4.6976,4.7478,4.7957,4.7179,4.7455,4.7359,4.7347,4.7838,4.6784,4.8664,4.7945,4.8508,4.7694,4.8017,4.7921,4.8041,4.8269,4.7071,4.8005,4.8173,4.7706,4.8125,4.7969,4.8364,4.9131,5.1118,5.0735,5.2219,5.4374,4.9765,5.3033,5.0328,5.4362,4.8951,5.3201,5.5260,5.4326,6.2850,6.8764,6.8811,7.1637,7.2966,6.9470] // large array
    //const y = [[1,2], [2,3], [1,2]] // large array

    //const actz = [1.8196,1.7646,1.7454,1.6712,1.8041,1.9453,3.7530,5.5535,4.0870,1.3432]

    const pythonProcess = await spawnSync('python', [
        './utilities/python-utils.py',
        'get_activity_counts',
        JSON.stringify({ actz })
        //'{"actz":[4.8532,4.852,4.8879,4.8556,4.761,4.6593,3.2526,4.6102,7.712,8.3021]}'
        //'./staging/scripts/args.json',
        //'./staging/scripts/results.json'
    ]);

    const result = pythonProcess.stdout?.toString()?.trim();
    const error = pythonProcess.stderr?.toString()?.trim();

    console.log("result=" + result);

    //const status = result === 'OK';

    //console.log("error=" + error);

    //if (status) {
        //const buffer = await readFile('./staging/scripts/results.json');
        //const resultParsed = JSON.parse(buffer?.toString());
        //console.log("results=" + resultParsed);
    //} else {
    //    console.log(error)
    //}

    return result;
}

module.exports = {
    getActivityCount,
    getActivityCountByRow
}
