// using
// https://en.wikipedia.org/wiki/Vector_clock
import { insertIntoSorted } from "../../../lib/structure/Arrays.js";
import { objectFilter, objectLift } from "../../../lib/structure/Object.js";
// const mergeClocks = (base, ap) => ({
//   ...base,
//   ...objectLift((value: number, key) => Math.max(base[key] ?? -1, value))(ap),
// });
// const { a, b, c } = mergeClocks({ a: 22, b: 13 }, { a: 2, b: 14, c: 2 });
// console.assert(a === 22, b === 14, c === 2);
const removeUndefinedValues = objectFilter((value) => value !== undefined);
// e.g. `entrywiseOneWayDiffPair(myClock)(otherClock)`
// per key, if otherClock[key] > myClock[key] save the pair [myClock[key], otherClock[key]] at result[key]
const entrywiseOneWayDiffPair = (myClock) => objectLift((value, key) => myClock[key] === undefined || value > myClock[key]
    ? [myClock[key], value]
    : undefined);
const clockDiff = (myClock, otherClock) => removeUndefinedValues(entrywiseOneWayDiffPair(myClock)(otherClock));
function clockSerial(clock) {
    return Object.entries(clock)
        .map((keyValue) => keyValue.join(""))
        .join("");
}
console.assert(clockSerial({ a: 22, b: 1, c: 22 }) === "a22b1c22");
function incClock(id, clock) {
    return {
        ...clock,
        [id]: (clock[id] ?? -1) + 1,
    };
}
function compareClocksAlphabetical(clock1, clock2) {
    const keys = [
        ...new Set([...Object.keys(clock1), ...Object.keys(clock2)]),
    ].sort((key1, key2) => key2.localeCompare(key1));
    for (const key of keys) {
        if ((clock1[key] ?? -1) > (clock2[key] ?? -1))
            return 1;
        if ((clock1[key] ?? -1) < (clock2[key] ?? -1))
            return -1;
    }
    return 0;
}
const myEvent = (name) => (clock) => (ev) => ({
    ev,
    clock: incClock(name, clock),
});
// const event =
//   (name) =>
//   (clock) =>
//   (ev, evClock = {}) => ({
//     ev,
//     clock: mergeClocks(clock, evClock),
//   });
const addEvent = (id, ev, events) => {
    if (!Array.isArray(events[id]))
        events[id] = [];
    events[id][ev.clock[id]] = ev;
};
// [x] + main focus: consistency
// [_] names / ids of people? (ignoring for now)
// [x] send function events with args
// [x] handshake to exchange events not yet received by each party
// [ ] disable previous events (undo) by clock address (are they unique?)
//  - I think I want a "address things by where they were created" so that old events
//    can be changed resulting in events not addressing things created in changed events
const isDiffInc = (id, diff) => Object.keys(diff).length > 1 || diff[id][1] - (diff[id][0] ?? -1) !== 1;
export const compareEventClocksAlphabetical = ({ clock: clock1 }, { clock: clock2 }) => compareClocksAlphabetical(clock1, clock2);
export function setup(myName) {
    const listeners = [];
    let clock = {};
    const events = {};
    const linearizedEvents = [];
    const registerEvent = (id, ev) => {
        if (isDiffInc(id, clockDiff(clock, ev.clock)))
            throw "bug: bad register!"; // inneffecient for now to simplify things and catch bugs
        clock = incClock(id, clock);
        insertIntoSorted(ev, linearizedEvents, compareEventClocksAlphabetical);
        addEvent(id, ev, events);
    };
    const requestDiff = async (diff) => objectLift(([start, end], key) => events[key].slice(start + 1 ?? 0, end))(diff);
    let updateListener = (ev) => { };
    const callOnUpdate = (ev) => updateListener(ev
    //linearizedEvents.map(({ ev }) => ev)
    );
    return {
        //local
        do: (action) => {
            const ev = myEvent(myName)(clock)(action);
            registerEvent(myName, ev);
            for (const listener of listeners)
                listener.addEvent(ev, myName, requestDiff);
            callOnUpdate(ev);
        },
        onUpdate: (fn) => (updateListener = fn),
        // network
        addListener: (otherOne) => listeners.push(otherOne),
        clearListeners: () => (listeners.length = 0),
        requestDiff,
        addEvent: (ev, id, requestDiff) => {
            const diff = clockDiff(clock, ev.clock);
            if (isDiffInc(id, diff)) {
                requestDiff(diff).then((evMap) => {
                    for (const [oldId, oldEvents] of Object.entries(evMap)) {
                        for (const oldEv of oldEvents) {
                            registerEvent(oldId, oldEv);
                            callOnUpdate(oldEv);
                        }
                    }
                    registerEvent(id, ev);
                    callOnUpdate(ev);
                });
            }
            else {
                registerEvent(id, ev);
                callOnUpdate(ev);
            }
        },
    };
}
// TODO: make an alternative log without vector clocks, only an "after" relationship
