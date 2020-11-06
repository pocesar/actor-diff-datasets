const Apify = require('apify');
const { XXHash64 } = require('xxhash-addon');
const { bufferDataset } = require('./functions');

const { log } = Apify.utils;

Apify.main(async () => {
    const { baseDatasetId, otherDatasetId, uniqueFields = [], maxBufferSize = 20000 } = await Apify.getInput();

    if (!uniqueFields || !uniqueFields.length) {
        throw new Error('You need to specify uniqueFields array');
    }

    const ds = bufferDataset(await Apify.openDataset(), { maxBufferSize });
    const hasher = new XXHash64();
    const compoundKey = (item) => {
        let value = '';
        for (const field of uniqueFields) {
            value = `${value}${typeof item[field] !== 'object' ? item[field] : JSON.stringify(item[field])}`;
        }
        return hasher.hash(Buffer.from(value)).toString('hex');
    };

    const baseDataset = await Apify.openDataset(baseDatasetId, { forceCloud: true });
    const otherDataset = await Apify.openDataset(otherDatasetId, { forceCloud: true });

    const { cleanItemCount: baseCount } = await baseDataset.getInfo();
    const { cleanItemCount: otherCount } = await otherDataset.getInfo();

    log.info('Datasets information:', { baseCount, otherCount });

    const current = (await Apify.getValue('CURRENT')) || {
        baseOffset: 0,
        otherOffset: 0,
        uniques: 0,
    };
    const uniques = new Set(await Apify.getValue('UNIQUES'));

    const persistState = async () => {
        await Apify.setValue('CURRENT', current);
        await Apify.setValue('UNIQUES', [...uniques]);

        log.info('Current offsets:', current);
    };

    Apify.events.on('persistState', persistState);

    log.info('Reading "base" dataset');

    await baseDataset.forEach(async (item) => {
        uniques.add(compoundKey(item));
        current.baseOffset++;
    }, {}, current.baseOffset);

    await persistState();

    log.info('Reading "other" dataset');

    await otherDataset.forEach(async (item) => {
        current.otherOffset++;
        if (!uniques.has(compoundKey(item))) {
            current.uniques++;
            await ds.pushData(item);
        }
    }, {}, current.otherOffset);

    await ds.flush();
    await persistState();

    log.info(`Done, found ${current.uniques} items`);
});
