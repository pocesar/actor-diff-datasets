const Apify = require('apify');

/**
 * Provides a dataset-like object that pushes data to internal buffer
 * before pushing to real dataset to save API calls. Useful for large loads.
 * This implementation doesn't use KV store, it simply pushes the data on migration.
 * You have to always call await bufferedDataset.flush() after the crawl ends to push the final data.
 * If you abort the run, you will loose the data in the buffer.
 * There is also pocesar's timeout-based version that deduplicates so pick what you like :)
 *
 * @example
 * // Use like normal dataset, just flush after crawler.run()
 * const buffered = bufferDataset(dataset);
 * await bufered.pushData(data);
 * // Only needed after run ends
 * await buffered.flush()
 *
 * @param {Apify.Dataset} dataset
 * @param {object} options
 * @param {number} [options.maxBufferSize=500]
 * @param {boolean} [options.verboseLog]
 */
exports.bufferDataset = (dataset, options = {}) => {
    const { maxBufferSize = 500, verboseLog = false } = options;
    let buffer = [];

    /**
     * Flushes any remaining items on the pending array.
     * Call this after await crawler.run()
     */
    const flush = async () => {
        // We reassign and clean the buffer here
        // If we would clean after pushing, new items might have been added between the await
        const data = buffer;
        buffer = [];
        if (verboseLog) {
            console.log(`Flushing buffer with size: ${data.length}`);
        }
        await dataset.pushData(data);
    };

    let isMigrating = false;
    Apify.events.on('migrating', async () => {
        isMigrating = true;
        await flush();
    });

    /**
     * Use like normal dataset.pushData
     *
     * @param {any} data
     */
    const pushData = async (data) => {
        if (Array.isArray(data)) {
            buffer.push(...data);
        } else {
            buffer.push(data);
        }

        // If we are migrating, we need to reverse to normal pushData
        // because we don't know when it will really happen and more pushes might occur
        const willFlush = isMigrating || buffer.length >= maxBufferSize;
        if (willFlush) {
            await flush();
        }
    };

    /**
     * Gets current size of the buffer
     *
     * @returns {number} bufferSize
     */
    const bufferSize = () => buffer.length;

    return {
        pushData,
        flush,
        bufferSize,
    };
};
