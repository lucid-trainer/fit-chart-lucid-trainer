const sum = arr => arr.reduce((partialSum, a) => partialSum + a, 0);

const mean = arr => sum(arr) / arr.length;

const variance = arr => {
    const m = mean(arr);
    return sum(arr.map(v => (v - m) ** 2));
};

const sd = arr => Math.sqrt(variance(arr));

module.exports = {
    sum,
    mean,
    variance,
    sd
}