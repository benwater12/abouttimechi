### Getting Started

* about-time adds a pseudo or game time clock to foundry.
* The clock runs in the background and gives notifications when things occur.
* The clock can be adjusted to whatever time you want
* The display of the clock can be set to use different calendars.
* As someone mentioned this is best seen as a library for you to deal with game time however you want. @DasSauerkraut is producing a nice front end that should make it uch more approachable.

### Date manipulations
The following are all console commands. They can all also be put into macros for push buttone exectuion. Any command that tries to change the current date/tim or calendar can only be run on the master time server client. Attempts from other cliens will generate an error.
To see what time it is now
```
game.Gametime.DTNow().longDate()
```
which should display  
```{date: "Wednesday January 01 1970", time: "00:00:00"}```
or
```
game.Gametime.DTNow().shortDate()
```
```{date: "1970/01/01", time: "00:00:00"}```

you can change the game time with
```
game.Gametime.setTime({hours:xx, minutes: xx, seconds: xx})
game.Gametime.advanceTime({days: xx, hours: xx, minutes: xx. seconds: xx})
```

```
game.Gametime.setAbsolute({years: 2020, months: 1, days:12})
game.Gametime.DTNow().longDate()
```
```{date: "Thursday February 13 2020", time: "00:00:00"}```

### Note that months and days are 0 indexed when you enter them so January 1 is {months: 0, days: 0}

You can do pretty arbitrary date arithmetic.  
```
let dt = game.Gametime.DTNow()
dt.add({years: -1}).longDate()
```  
```{date: "Tuesday February 13 2019", time: "00:00:00"}```
```
game.Gametime.DTNow().add({days:16}).longDate()
```
```{date: "Saturday February 29 2020", time: "00:00:00"}```
```
game.Gametime.DTNow().add({years: 1, days: 16}).longDate()
```
```{date: "Monday March 01 2021", time: "00:00:00"}```

```
game.Gametime.DTNow().add({years: 2, days: 16}).longDate()
```  

```date: "Tuesday March 01 2022", time: "00:00:00"}```

```
game.Gametime.DTf({years: 2020, months: 3}).longDate()
```
```{date: "Wednesday April 01 2020", time: "00:00:00"}```

```
d = game.Gametime.DTf({years: 2020, months: 3})  
console.log(`412 days after ${d.longDate().date} it will be ${d.add({days: 412}).longDate().date}`)
```  
```412 days after Wednesday April 01 2020 it will be Monday May 17 2021 ```
or  

```
game.Gametime.DTC.createFromData(game.Gametime.calendars.Warhammer) // calendar can also be selected from the module options  
d = game.Gametime.DTf({years: 0})
console.log(`412 days after ${d.longDate().date} it will be ${d.add({days: 412}).longDate().date}`)
```
```412 days after Hexenstag 0000 it will be Konistag Nachexen 12 0001```

###
The main point of the library is to allow you to trigger events in the world.

```
game.Gametime.DTC.createFromData(game.Gametime.calendars.Gregorian)
game.Gametime.setAbsolute({years: 2020, months: 0, days: 0, hours: 12, minutes: 0, seconds: 0}) // midday jan 1 2020
```

```
game.Gametime.reminderIn({minutes: 30}, "***Here is a reminder***"); // send a message to the console in 30 minutes - not really all that useful
game.Gametime.DTNow().shortDate();
game.Gametime.advanceTime({minutes: 30})
```

```
game.Gametime.doIn({minutes: 30}, "Time Passes"); // run a macro in 30 minutes - to have this work create a chat macro called "Time Passes"
game.Gametime.advance({minutes: 30});
```

```
game.Gametime.doEvery({minutes: 30}, "Time Passes") // run the macro every 30 minutes.
```

```
sevenPMToday = game.Gametime.DTNow().setAbsolute({hours: 19, minutes: 0})
game.Gametime.doAt(sevenPMToday, "Time Passes")
game.Gametime.setTime({hours: 19, minutes: 0})
```

```
value = 10
game.Gametime.notifyEvery({minutes: 30}, "My event", "this", "and", value)
```
When the event occurs ```Hooks.call("eventTrigger", "My event", this, "and", 10)``` will be called on every client.
So as a programmer you can do a Hooks.on("eventTrigger", handler) to cause something to happen on every client.

All of the triggers do, reminder, notify come in three falvors, xxxIn, xxxEvery and xxxAt. The xxxIn and xxxEvery take a simpe time parameter, like doIn({minutes: 10})...). the xxxAt version require a DateTime Object which you can create via game.Gametime.DTNow().add(......) or game.Gametime.DTf({years, months, days, hours, minutes, seconds}) (omitted fields default to 0).

In addition every time the clock is updated Hooks.call("pseudoClockSet") is called on every client.

If you set an event/macro/notifcation to happen at a time and the clock is advanced past that time the trigger will fire. So if you have a macro to fire at 7pm and you advance the clock from 6pm to (say) 10pm wihtout stepping through the intermeiate times the event will trigger at 10pm game time.

### Time passing.
In additon to manually adjusting the clock there are two other ways time advances. When combat starts the clock will advance 6 seconds every turn. This allows you to have timed effects. A simple example is turning on or off a dynamicitem which can be accomlishd via a macro. The clock can be set to "real time" so that every "Real time interval" (configuration paramater) the game clock will advance "real time interval" * "Game Time update multipiler" (coniguration paramater). So if real time interval is 30 and multiplier 10, every 30 seconds of real worl time the game clock will advance by 300 seconds, or five minutes.

When the game is paused the real time clock is paused.

You can control the real time behaviour by
game.Gametime.startRunning(), game.Gametime.stopRunning(). game.Gametime.isRunning()

### Doing stuff.....
And now the reason I started this whole thing which was to allow conditions/items to time out. 
A simple example (done as a macro for no good reason). If I want my character to be blessed (using dynamicitems - shameless plug)

```
if (DynamicItems.toggleTokenEffect(token.id, "Bless", true)) {
  game.Gametime.doIn({minutes: 1}, DynamicItems.toggleTokenEffect, token.id, "Bless", false)
}
```
which says toggle the Bless effect on the current token and if it was set to active in one minute set it to false.
```
game.advanceTime({minutes: 1}).
```
Or wait for the combat tracker to advance 10 rounds.

If you create a macro  "Show Time"
```
let dt = game.Gametime.DTNow().longDate();
ChatMessage.create({content: `${dt.date} ${dt.time}`})
```

and the execute
```
game.Gametime.doEvery({minutes: 15}, "Show Time")
```
then every 15 minutes the game time will be pushed to the chat log. This will condinute indefinitely and persist across restarts.

If this should get annoying or you want to clear an event you can remember the number returned by the doEvery call or use
```
game.Gametime.queue()
```
```about-time |  queue [0] 1581598672547 true {minutes: 15} Show Game Time []```
Which shows what event are in the queue. In this case we see that event id 1581598672547 does "Same Time and it is recurring every 15 minutes.
```
game.Gametime.clearTimeout(1581598672547)
``` 
will remove the event from the queue.  

If for whatever reason the event queue gets corrupted it can be cleared out with
```
game.Gametime.flushQueue()
```

There are a few restrictions on handlers because they need to saved to storage which menas they can't be native code and any parametrs need to be pure data, e.g. actorData rather than actors. Better still is to pass the id of the affected target. So in this case passing the token.id means that the handler can get back the correct data. 

**Events** are persistent so when you relaod the game your event queue will load. 

### Master time server
One (and only one) GM client needs to be the master time server. You do not need to do anything for this to happen as when each GM joins it checks if there is a master time server and if not takes over the role. You can check if you are the master time server via
```
game.Gametime.isMaster()
```

If for any reason a different GM needs to take over the master time server role they can perform
```
game.Gametime.mutiny()
```
which will make the calling GM client the master time server.

### Seeing the date and time
There is a simple clock/calendar display available.
You can create a script macro whose contents are:
```
game.Gametime.showClock()
```
Which when executed will display calendar/clock. The clock can be minimised and the display will continue to update.
The master time server client has the ability to start/stop the clock and to advance the time.

### Creating your own calendar
```
myCalendar = {
  "month_len": {
      "January": {days: [31,31]},
      "February": {days: [28, 29]},
      "March": {days: [31,31]},
      "April": {days: [30,30]},
      "May": {days: [31,31]},
      "June": {days: [30,30]},
      "July": {days: [31,31]},
      "August": {days: [31,31]},
      "September": {days: [30,30]},
      "October": {days: [31,31]},
      "November": {days: [30,30]},
      "December": {days: [31,31]},
  },
  "leap_year_rule": (year) => Math.floor(year / 4) - Math.floor(year / 100) + Math.floor(year / 400),
  "weekdays": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  "clock_start_year": 1970,
  "first_day": 0,
  "notes": {},
  "hours_per_day": 24,
  "seconds_per_minute": 60,
  "minutes_per_hour": 60,
  "has_year_0": false
}
```
This is the data definition for the gregorian calendar.
* **month_len** each month has a name, days per month [normal, leap year length] and optional boolean intercalary if the month does not advance the day of week. Used in lots of fantasy calendars.
* **leap_year_rule** a function that returns the number of leap days since year 0 to the specified year.
* **weekdays** simple array of the names of the days of the week
* **clock_start_year** can be any valid positive year.
* **firstday** The day of the week of the first valid day in the calendar. In practice is is easier to set dow via:
```
// Set date/time to 12pm to 3rd March (days and months are 0 indexed)
game.Gametime.setAbsolute({years: 2020, months: 2, days: 1, hours: 12, minutes: 0, seconds: 0});
// set the dow to a monday (days of the week are 0 indexed)
game.Gametine.DTNow().setCalDow(0)
```
* **has_year_0** Supports the oddities of some calendars that have no year 0 - like gregorian. If false valid years are ()...-2,-1,1,2,...) otherwise
()...-2,-1,0,1,2,...). 

You can set your calendar via
```
game.Gametime.DTC.createFromData(myCalendar)
```
This should be done before updating the time/dow above.
Calendar needs to be set each time on startup.

### Different Calendars
Here are all the standard calendars supplied - you can use them via the UI calendar selection or use them as a basis for your own.
```
// leap years but no intercalary days.
const  Gregorian = {
  "month_len": {
      "January": {days: [31,31]},
      "February": {days: [28, 29]},
      "March": {days: [31,31]},
      "April": {days: [30,30]},
      "May": {days: [31,31]},
      "June": {days: [30,30]},
      "July": {days: [31,31]},
      "August": {days: [31,31]},
      "September": {days: [30,30]},
      "October": {days: [31,31]},
      "November": {days: [30,30]},
      "December": {days: [31,31]},
  },
  "leap_year_rule": (year) => Math.floor(year / 4) - Math.floor(year / 100) + Math.floor(year / 400),
  "weekdays": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  "clock_start_year": 1970,
  "first_day": 0,
  "notes": {},
  "hours_per_day": 24,
  "seconds_per_minute": 60,
  "minutes_per_hour": 60,
  "has_year_0": false
}

// no leap years and no intercalary days
export const  Greyhawk = {
  // month lengths non-leap year and leapyear
  "month_len": {
      "Needfest": {days: [7, 7]},
      "Fireseek": {days: [28, 28]},
      "Readying": {days: [28, 28]},
      "Coldeven": {days: [28, 28]},
      "Growfest": {days: [7, 7]},
      "Planting": {days: [28, 28]},
      "Flocktime": {days: [28, 28]},
      "Wealsun": {days: [28, 28]},
      "Richfest": {days: [7, 7]},
      "Reaping": {days: [28, 28]},
      "Goodmonth": {days: [28, 28]},
      "Harvester": {days: [28, 28]},
      "Brewfest": {days: [7, 7]},
      "Patchwall": {days: [28, 28]},
      "Ready'reat": {days: [28, 28]},
      "Sunsebb": {days: [28, 28]}
  },
  // rule for calculating number of leap years from 0 to year
  "leap_year_rule": (year) => 0,
  // days of week
  "weekdays": ["Starday", "Sunday", "Moonday", "Godsday", "Waterday", "Earthday", "Freeday"],
  "notes": {},
  // what is the base year for the real time clock
  "clock_start_year": 0,
  "first_day": 0,
  // time constants
  "hours_per_day": 24,
  "seconds_per_minute": 60,
  "minutes_per_hour": 60,
  // does the year have a year 0? Gregorian does not.
  "has_year_0": true
};

// no leap years but many intercalary days
export const Warhammer = 
{
  "month_len": {
    "Hexenstag": {days: [1,1], intercalary: true},
    "Nachexen": {days: [32,32]},
    "Jahdrung": {days: [33,33]},
    "Mitterfruhl": {days: [1,1], intercalary: true},
    "Pflugzeit": {days: [33,33]},
    "Sigmarzeit": {days: [33,33]},
    "SommerZeit": {days: [33,33]},
    "Sonnstill" : {days: [1,1], intercalary: true},
    "Vorgeheim": {days: [33,33]},
    "Geheimnistag": {days: [1,1], intercalary: true},
    "Nachgeheim": {days: [32,32]},
    "Erntezeit": {days: [33,33]},
    "Mitterbst" : {days: [1,1], intercalary: true},
    "Brauzeit": {days: [33,33]},
    "Kalderzeit": {days: [33,33]},
    "Ulriczeit": {days: [33,33]},
    "Mondstille": {days: [1,1], intercalary: true},
    "Vorhexen": {days: [33,33]},
  },
  "leap_year_rule": (year) => 0,
  "weekdays": ["Wellentag", "Aubentag", "Marktag", "Backertag", "Bezahltag", "Konistag", "Angestag", "Festag"],
  "clock_start_year": 0,
  "first_day": 0,
  "notes": {},
  "hours_per_day": 24,
  "seconds_per_minute": 60,
  "minutes_per_hour": 60,
  "has_year_0": true,
}

// This has both leap years and intercalary days.

export const Harptos = {
  "month_len": {
    "Hammer": {days: [30,30]},
    "Midwinter": {days: [1,1], intercalary: true },
    "Alturiak": {days: [30, 30]},
    "Ches": {days: [30,30]},
    "Tarsakh": {days: [30,30]},
    "Greengrass": {days: [1,1], intercalary: true },
    "Mirtul": {days: [30,30]},
    "Kythorn": {days: [30,30]},
    "Flamerule": {days: [30,30]},
    "Midsummer": {days: [1,1], intercalary: true },
    "Shieldmeet": {days: [0,1], intercalary: true },
    "Eleasis": {days: [30,30]},
    "Eleint": {days: [30,30]},
    "Higharvestide": {days: [1,1], intercalary: true },
    "Marpenoth": {days: [30,30]},
    "Uktar": {days: [30,30]},
    "Feat Of the Moon": {days: [1,1], intercalary: true },
    "Nightal": {days: [30,30]},
},
"leap_year_rule": (year) => Math.floor(year / 4) + 1, // +1 so that year 0 is a leap year
"weekdays": ["1st-Day", "2nd-Day", "3rd-Day", "4th-Day", "5th-Day", "6th-Day", "7th-Day", "8th-Day", "9th-Day", "10th-Day"],
"clock_start_year": 0,
"first_day": 0,
"notes": {},
"hours_per_day": 24,
"seconds_per_minute": 60,
"minutes_per_hour": 60,
"has_year_0": true
}

export const calendars = {
  "Gregorian": Gregorian,
  "Warhammer": Warhammer,
  "Greyhawk": Greyhawk,
  "Harptos": Harptos
}

```