const math  = require('mathjs');

const WINDOW_SIZE = 10 * 30 - 15;
const EPOC_SIZE = 30;

function printProgress(progress){
  console.log(progress.toFixed(3) + '%');
}

const convolve = (array, weights) =>  {
    if (weights.length % 2 !== 1)
      throw new Error('weights array must have an odd length');
  
    var al = array.length;
    var wl = weights.length;
    var offset = ~~(wl / 2);
    var output = new Array(al);
  
    for (var i = 0; i < al; i++) {
      var kmin = (i >= offset) ? 0 : offset - i;
      var kmax = (i + offset < al) ? wl - 1 : al - 1 - i + offset;
  
      output[i] = 0;
      for (var k = kmin; k <= kmax; k++)
        output[i] += array[i - offset + k] * weights[k];
    }
  
    return output;
  }

  const convolveWithDOG = (y, boxPts) => {
    y = y.map(val => val - math.mean(y));
    //y = y.map(val => val - mean);

    const box = new Array(boxPts).fill(1).map(val => val / boxPts);

    const mu1 = Math.floor(boxPts / 2.0);
    const sigma1 = 120;

    const mu2 = Math.floor(boxPts / 2.0);
    const sigma2 = 600;

    const scalar = 0.75;

    for (let ind = 0; ind < boxPts; ind++) {
        box[ind] = math.exp(-1 / 2 * Math.pow((ind - mu1) / sigma1, 2)) - scalar * math.exp(-1 / 2 * Math.pow((ind - mu2) / sigma2, 2));
    }

    y = y.slice(0, Math.floor(boxPts / 2)).reverse().concat(y); // Pad by repeating boundary conditions
    y = y.concat(y.slice(-Math.floor(boxPts / 2)).reverse());
    const ySmooth = convolve(y, box);

    return ySmooth;
}

const getHRV = (hrData) => {

    var hrMetricFeature = [];
    //var temp;

    
    let epocCount = Math.floor(hrData.length / EPOC_SIZE);
    console.log(epocCount);
    let offset = WINDOW_SIZE;
    //mean = math.mean(HRData);

    for (let counter = 0; counter < epocCount; counter++) {
        const windowData = hrData.slice(offset-WINDOW_SIZE, offset + WINDOW_SIZE + EPOC_SIZE);
        const normalized = convolveWithDOG(windowData, WINDOW_SIZE);
        const scalar = math.quantileSeq(normalized, 0.9);
        const normalizedScaled = normalized.map(val => val / scalar);
        var feature = math.std(normalizedScaled).toFixed(3);
        hrMetricFeature.push(feature);
        printProgress(counter/epocCount*100);
        offset += EPOC_SIZE;
    }
    
    return hrMetricFeature
}

module.exports = {
    getHRV
}