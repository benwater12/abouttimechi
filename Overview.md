## basic idea
The concept of "game time" analagous to a world clock on which you can schedule events - like the real world setTimeout and SetInterval

The game clock could simply be seconds since an arbitray epoch.
The game clock should persist over server restarts.

Changes in the game clock should be broadcast to all clientts and support callback via Hooks.

Support an api for advancing time by X seconds.


Optionally (this can be done client side).
Allow game time to advance as a multiple/fraction of real world time. Every X seconds the game time is advanced by the multiple/fraction of read world time. X is a throttling factor to make sure there is not too much activity.

Special treatment when combat occurs. Pseudo real time advance stops if running. Time advances by seconds_per_round and an update is sent at each turn advance. Real time resumes at the end of combat. This is probably most easily handled client side hooking the start/end/avance combat events.

All the other behaviours can be client side and module based - or included in core.

## client side
per client persistent event queue with an interface like
setTimout(interval, handler)
setInterval(interval, handler)
doAt(timeSpec, handler)
cancelEvent(id)

handler can be arbitrary code or could be restricted to macros.

setWorldTime(timeSpec)
advanceWorldTime(timeSpec)

## timespec ##
Support for the idea of world time specs, like {days: 1}, {minutes: 1};

I written a module that does all of this (master time server is just the GM) and with a few tweaks to be done seems to be viable.