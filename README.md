# Syzer

Analyze the transitive download size of npm packages.

Maybe useful as a general analysis of npm dependencies.

It's named after a character from True and the Rainbow Kingdom who shrinks things: https://www.youtube.com/watch?v=5W-TKhUQmys

## Run it

It doesn't accept command-line args yet, so just edit `main.ts` to say what package and version to analyze. Then 

```sh
$ yarn install
$ yarn measure
```

## TODO

- [ ] Run it as a service with a frontend.
- [ ] Cache as much fetched info as possible for scale and reliability.
- [ ] Show license info so you can choose dep edges to trim that have legal risks
- [ ] Show how much of the dependency is "utilized" so you can vendor packages where you only need a small percentage of the size.
- [ ] Show fixes over time?
