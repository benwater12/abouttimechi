### 0.7.2 Changes
About-time uses the system game.time.worldTime for storing about-time game time.
**Breaking** Time update hook call is now updateWorldTime and passes the time in seconds.
**FUTURE Breaking** Support for function calls as scheduled items will be removed. Either use a macro or trigger an event with the data you need and Hook the update.
If the setting settings-per-round is set to 0, about-time will use the system default CONFIG.time.roundTime, otherwise it will overwrite CONFIG.time.roundTime with whatever is set by the user.
**game.Gametime.DTNow().longDateExtended()** returns the current date/time plus the current dow string and monthstring for you to format to your hearts content.

### About-time
A module to support a game time clock in Foundry VTT. Arbitrary calendars are supported Gregorian and Greyhawk supplied but it is easy to add your own. See notes at the end. Please have a look at Gettingstarted.md it has more information.

DateTime Arithmentic is supported allowing calculations like DateTime.Now().add({days:1}) (increments can be negative, but must be integers)

DateTime represents a date and time comprising ({years, months, days, hours, minutes, seconds}) and repsents an actual date and time.
DTMod is a class for representing time intervals, game.Gametime.DTMod.create({years, months, days, hours. minutes, seconds}) only represents an interval to be applied to a DateTime. Typically you would do things like DateTime.now().add({days: 5})

See also gettingStarted.md
The gametime clock can bet set/advanced as you wish. The clock can also be set to run in real time at a multiple/fraction of real world time. The game clock is snchronised betwee all clients and time updates are broadcast to each client. You can register for them via Hooks.on("clockUpdate").

The real use for the clock is having events fire at predefined times or intervals.
You can call arbitrary code or macros based off the game time clock. Allowing things like 
```game.Gametime.doEvery({hours:24}, "Eat Food")```

There are three event triggering calls
* doXXX call a javascript function or execute a macro.
* reminderXXX send a message to the console.
* notifyXXX(eventName, args). Notify all clients via Hooks.call("about-time.eventTrigger", name, args).

XXX can be one of At, In, Every.
* So doAt(DateTime,....) runs the handler at the given clock time.
* doIn(DTMod,....)  runs the handler after DTMod time from now.
* doEvery(DTMod) rus the event every time DTMod time passes.

When combat starts the clock enters a special mode where game time advances 6 seconds (configurable) at the end of each turn. This allows for timed effects/conditions, e.g.
when blessed the macro could look like:
```
DynamicItems.toggleEffectActive(actor, "Bless", true);
game.Gametime.doIn(game.Gametime.DMf{minutes:1}, DynamicItems.toggleEffectsActive, actor, "Bless", false) 
``` 
so that bless will finish after 60 seconds.

When combat ends the clock reverts to it's previous mode.

There are gametime "Events" which are specified as ET.notifyEvery({hours: 1}, "There is a wandering monster in the vicinity", ...args). This will fire the hook "eventTrigger" on all connected clients. It can be waited for via Hooks.on("eventTrigger", (...args) => {})

The event queue, from where handlers fire is per client and persistent so whenever they start up their queue will be active.
The core classes are
DTCalc stores infromation about the calendar, exposed as game.Gamtime.DTCalc or the global DTC.
DTMod represents time interals, exposed as game.Gametime.DTMod or the global DM.
DateTime represents a DateTime in the current calendar, exposed as game.Gametime.DateTime or the global DT.
ElapsedTime represents the per client event queue, exposed as game.Gametime.ElapsedTime or the global ET.
Pseudoclock represents the game clock. Not exposed directly, but has helper methods exposed in ElapsedTime. The clock and queue states are persistent across game restarts.

** Usage **
When the module is enabld a psuedo clock is started on the GM's client. Each other client recieves time updates from the GM's client  whnever the GM changes the clock.

Why should I care?
You can now accurtaley track game time in whatever way you want.
You can trigger events to occur at specified times. The event queue is local to each client.
In combat the pseudo clock advances by 6 seconds per round so you can implement time effects which last for say 10 rounds.
You can track elapsed game time with macros like 
```game.Gametime.advanceTime(game.Gametime.DMf("hours: 1}))```

** At present the interface is programatic only **
Access these via game.Gametime.XXXXX

* doEvery(DM{days:1}, () => console.log("another day another dollar"))  
          every day run the handler.
* doAt({hours:1}, "My Macro"))  
          run a macro in 1 hour of gametime
* reminderAt({minutes: 10}, "Check for wandering monsters"}  
          send a message to the console.
* reminderEvery({minutes: 10}, "Check for wandering monsters"}  
    do a reminder every 10 minutes.  
  Each of the above return an id which can be used to cancel the event
* clearTimeout(eventID)

* currentTime() return the current time in seconds
* currentTimeString() return the current time in the form "dd hh:mm:ss"

* game.Gametime.isMaster() is the cleint the master time server
* game.Gametime.isRunning() is the pseudo clock running in realtime
* game.Gametime.doAt(): At the specified time do the handler/macro at a specified time doAt(datetime, handler, arguments) or doAt(dateTime, macro)
* game.Gametime.doIn(): Execute the specified handler/macro in the spericifed interval, i.e. doIn({mintues: 30}, ....)
* game.Gametime.doEvery(): ElapsedTime.doEvery,
* game.Gametime.reminderAt(): At the specified time log the message to the console reminderAt(datetime, "reminder text", ...args)
* game.Gametime.reminderIn(): After the specified interval send the reminder to the console
* game.Gametime.reminderEvery(): Every DTMod inteval send the specified message to theconsole
* game.Gametime.notifyAt(): notifyAt(DateTime, "event name", ...args) At the specified time call Hooks. callAll("eventTrigger", eventName, ...args)
* game.Gametime.notifyIn(): After DTMod interval notify all cleints
* game.Gametime.notifyEvery(): Every DTMod interval nofity all clients.
* game.Gametime.clearTimeout:() Each doXXX, remindXXX, notifyXXX registration returns an ID. clearTimeout(id) can be used to cancel the timeout
* game.Gametime.getTimeString(): Return the current gameTime as a string HH:MM:SS
* game.Gametime.getTime(): return a DTMod with the current time
* game.Gametime.queue(): show the current event queue
* chatQueue({showArgs = false, showUid = false, showDate = false}) - show the queue to the chat log. parameters are optional and allow a little config of the output
* game.Gametime.ElapsedTime the ElapsedTime singleton
* game.Gametime.DTM(): The DTMod class
* game.Gametime.DTC(): The DTCalc class
* game.Gametime.DT(): The DateTime calss
* game.Gametime.DMf(): create a new DTMod({years:y, months:m, days:d, hours:h, minutes:m, seconds:s})
* game.Gametime.DTf(): create the date time corresponding to {years:y, months:m, days:d, hours:h, minutes:m, seconds:s}. If years is omitted it defaults to 1970 or all parameters omitted defaults to 1/1/1970, 00:00:00.
* game.Gametime.DTNow() current gametime
* game.Gametime.DTf({years: 1900, months: 5, days: 3}).longDate() yields {date: "Sunday June 04 1900", time: "00:00:00"}
and game.Gametime.DTf({years: 1900, months: 5, days: 3}).shortDate() yields {date: "1900/06/04", time: "00:00:00"}


On the GM's client the following can be used
* game.Gametime.startRunning() start the pseudo real time clock
* game.Gametime.stopRunning() stop the pseudo real time clock
* game.Gametime.advanceClock(timeInSeconds)
*
* game.Gametime.advanceTime({days: d, hours: h, minutes: m, seconds: s}) advance the clock by the specified amount.
* game.Gametime.setTime(DateTime): set the current time to the specified date time
* game.Gametime.setClock(timeInSeconds) set the clock to timeInSeconds

** DTCalc calendar format **
Years are 1 based and months/days are 0 based. So February 23rd 1970 is represented as 1970/1/22

const  GregorianCalendar = {  
  // month lengths in days - first number is non-leap year, second is leapy year  
  "month_len": {  
      "January": {days: [31,31], intercalary: false},  
      "February": {days:[28, 29]},  
      "March": {days:[31,31]},  
      "April": {days:[30,30]},  
      "May": {days:[31,31]},  
      "June": {days:[30,30]},  
      "July": {days:[31,31]},
      "August": {days:[31,31]},  
      "September": {days:[30,30]},  
      "October": {days:[31,31  
      "November": {days:[30,30]},  
      "December": {days:[31,31]},  
  },  
  // a function to return the number of leap years from 0 to the specified year.   
  "leap_year_rule": (year) => Math.floor(year / 4) - Math.floor(year / 100) + Math.floor(year / 400),  
  // names of the days of the week. It is assumed weeklengths don't change  
  "weekdays": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],  
  // year when the clock starts and time is recorded as seconds from this 1/1/clock_start_year 00:00:00. If is set to 1970 as a unix joke. you can set it to 0.  
  "clock_start_year": 1970,  
  // day of the week of 0/0/0 00:00:00  
  "first_day": 6,  
  "notes": {},  
  "hours_per_day": 24,  
  "seconds_per_minute": 60,  
  "minutes_per_hour": 60,  
  // Is there a year  
  "has_year_0": false  
}  

Initialise DTCalc with the new calendar via DTCalc._createFromData(GregorianCalendar). All module intialisation fires on the setup/ready hooks so you can set the calendar on the init hook and all should be fine.