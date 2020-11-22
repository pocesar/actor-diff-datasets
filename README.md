# Diff datasets

Take one dataset on Apify platform, compare to another, and output the missing ones.
This can also be used to output only changed items, using a compound key.

Supports using whole nested objects as value, they are `JSON.stringify`'d before being turned
into a small non-cryptographic space efficient hash

## Example

```js
await Apify.call('pocesar/diff-datasets', {
    baseDatasetId: 'LdNAlaOY1aKGhwAah', // place the datasets here. The order of "base" and "other" matters
    otherDatasetId: 'Bzu1pgOjenN43VhPY', // existing items in "base" are not output from "other"
    uniqueFields: [
        // simple primitive field value, like string, number, boolean
        "pageUrl",

        // you can use lodash.get notation to get nested items,
        // in this case `sub.fields.0` works like `sub.fields[0]` and the object looks like
        // {
        //    pageUrl: "https//pageurl",
        //    sub: {
        //      fields: [
        //        {...},
        //        {...}
        //      ]
        //    }
        //  }
        "sub.fields.0",

        // you can also use .length to count arrays or string characters, as in
        "sub.fields.length",
        "pageUrl.length"
    ],
});
```

## Limitations

* Every value is kept in memory while reading from the `base` dataset, more items more memory needed.
* The key value store might choke when trying to save the in-memory `Set` with too many items

## License

Apache 2.0
