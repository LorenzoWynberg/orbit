# Using orbit

```
orbit <value> <from> <to> [--precision <n>]
orbit --list [length|mass]
orbit --help
```

```
$ orbit 5 km mi
3.10686
$ orbit 12 in cm --precision 3
30.5
```

Units are given by symbol, name or alias. Output is just the number, so it pipes cleanly. Exit codes: 0 success, 1 usage error, 2 conversion error. Set `NO_COLOR` to disable colour in `--list` and error messages.
