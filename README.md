# Diff datasets

Take one dataset on Apify platform, compare to another, and output the missing ones.
This can also be used to output only changed items, using a compound key

## Example

```js
await Apify.call('pocesar/diff-datasets', {
    baseDatasetId: 'LdNAlaOY1aKGhwAah', // place the datasets here. The order of "base" and "other" matters
    otherDatasetId: 'Bzu1pgOjenN43VhPY',
    uniqueFields: ["pageUrl"],
});
```

## Limitations

* Every value is kept in memory while reading from the `base` dataset, more items more memory needed.
* The key value store might choke when trying to save the in-memory `Set` with too many items

## License

Apache 2.0
