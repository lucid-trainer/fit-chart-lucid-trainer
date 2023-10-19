const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86400;

const getCircadianData = (fitData) => {
    
    var circadianFeature = [];
    var firstDateTime;

    for (const [i, value] of fitData.entries()) {
        if(i == 0) {
            firstDateTime = new Date(value.timestamp);
        }

        let currentDateTime = new Date(value.timestamp);
        let diff = currentDateTime.getTime() - firstDateTime.getTime()
        diff = Math.floor(diff / 1000)

        circadianFeature.push(cosine_proxy(diff));
    } 

    return circadianFeature;
}    


function cosine_proxy(time) {
    const sleep_drive_cosine_shift = 1000.5;
    return -1 * Math.cos((time - sleep_drive_cosine_shift * SECONDS_PER_HOUR) *
                        2 * Math.PI / SECONDS_PER_DAY);
}

module.exports = {
    getCircadianData
}