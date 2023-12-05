import json
import sys
import numpy as np
from scipy.signal import butter, filtfilt
from numpy import genfromtxt
import matplotlib.pyplot as plt


def get_activity_counts():
    #json_obj = open(sys.argv[2])

    json_obj = sys.argv[2]
    data = json.loads(json_obj)
    
    actz = data["actz"]

    # do some your calculations based on X and y and put the result to the calculatedResults
    # print(make_pipeline)
    interpolated_count = np.arange(5, 751, 5)
    full_interpolated_count = np.arange(1, 751, 1)  #fitbit methods: range, min, max
    orig_interpolated_act = np.interp(full_interpolated_count, interpolated_count, actz)
    #json_object_result = json.dumps(orig_interpolated_act.tolist(), indent=4)

    # epochs_data = max2epochs(orig_interpolated_act, 50, 15)
    #json_object_result = epochs_data

    counts = build_activity_counts_without_matlab(orig_interpolated_act);
    json_object_result = counts.item(0, 0)

    
    # with open(sys.argv[3], "w") as outfile:
    #    outfile.write(json_object_result)

    print(json_object_result)
    # return json_object_result 

def max2epochs(data, fs, epoch):

    data = data.flatten()

    seconds = int(len(data) / fs)
    data = np.abs(data)
    # print(seconds)
    data = data[0:int(seconds * fs)]
    data = data.reshape(fs, seconds, order='F').copy()
    data = data.max(0)
    data = data.flatten()
    # np.savetxt("countsFeaturetest.csv",
    # data,
    # delimiter =", ",
    # fmt ='% s')
    N = len(data)
    
    num_epochs = int(np.floor(N / epoch))
    
    data = data[0:(num_epochs * epoch)]
    
    data = data.reshape(epoch, num_epochs, order='F').copy()
    
    epoch_data = np.sum(data, axis=0)
    epoch_data = epoch_data.flatten()

    # print(len(epoch_data))
    return epoch_data


def build_activity_counts_without_matlab(data):
    fs = 50
    #time = np.arange(len(data), 1.0 / fs)
    z_data = data
    #plt.plot(z_data)
    #plt.show()
    cf_low = 3
    cf_hi = 11
    order = 5
    w1 = cf_low / (fs / 2)
    w2 = cf_hi / (fs / 2)
    pass_band = [w1, w2]
    b, a = butter(order, pass_band, 'bandpass')

    z_filt = filtfilt(b, a, z_data)
    z_filt = np.abs(z_filt)
    # np.savetxt("z_filt.csv",
    #     z_filt,
    #     delimiter =", ",
    #     fmt ='% s')

    top_edge = 5
    bottom_edge = 0
    number_of_bins = 128

    bin_edges = np.linspace(bottom_edge, top_edge, number_of_bins + 1)
    binned = np.digitize(z_filt, bin_edges)

    #print(len(binned))

    epoch = 15
    counts = max2epochs(binned, fs, epoch)
    counts = (counts - 18) * 3.07
    counts[counts < 0] = 0

    time_counts = np.linspace(np.min(data), max(data), np.shape(counts)[0])
    time_counts = np.expand_dims(time_counts, axis=1)
    counts = np.expand_dims(counts, axis=1)

    # print(counts)
    return counts
    #output = np.hstack((time_counts, counts))

    # np.savetxt("countsFeature.csv",
    #     counts,
    #     delimiter =", ",
    #     fmt ='% s')

# data = genfromtxt('accelZ.csv')

# build_activity_counts_without_matlab(data)


if sys.argv[1] == 'get_activity_counts':
    get_activity_counts()

sys.stdout.flush()