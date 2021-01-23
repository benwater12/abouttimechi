import { FastPriorityQueue, Quentry } from "./FastPirorityQueue";
import { PseudoClock, PseudoClockMessage, _addEvent } from "./PseudoClock";
import { DTCalc } from "./calendar/DTCalc";
import { DateTime } from "./calendar/DateTime"
import { DTMod } from "./calendar/DTMod"

const _moduleSocket = "module.about-time";
const _updateClock = "updateClock";
let _userId: string = "";
let _isGM = false;

class CombatRound {
  _id: string;
  _round: number;

  constructor(id: string, round: number) {
    this._id = id;
    this._round = round;
    return this;
  }
}


export class ElapsedTime {
  static debug: boolean = true;
  static log = (...args) => {
    console.log("about-time | ", ...args);
  }
  
  static _eventQueue: FastPriorityQueue;
  static _activeCombats: Array<CombatRound>;
  static _saveInterval = 1 * 60 * 1000; // only save every minute real time.
  static _increment: DTMod;
  static setDebug(val: boolean) {
    ElapsedTime.debug = val;
    DTCalc.debug = val;
  }

  get eventQueue() {return ElapsedTime._eventQueue}
  set eventQueue(queue) {ElapsedTime._eventQueue = queue}

  static currentTimeString(): string {
    let pad = DTCalc.padNumber;
    let dt = DTMod.fromSeconds(PseudoClock.currentTime);
    return  `${pad(dt.hours, 2)}:${pad(dt.minutes, 2)}:${pad(dt.seconds, 2)}`;
  }

  static currentTime(): DTMod {
    return DTMod.fromSeconds(PseudoClock.currentTime);
  }

  static currentTimeSeconds() : number {
    return PseudoClock.currentTime % DTCalc.spd;
  }

  static status() {
    console.log(
      ElapsedTime._eventQueue.array,
      ElapsedTime._eventQueue.size,
      ElapsedTime._activeCombats,
      ElapsedTime._saveInterval
    )
  }

  static _displayCurrentTime() {
    console.log(`Elapsed time ${ElapsedTime.currentTimeString()}`)
  }

  static _calcSeconds(days, hours, minutes, seconds) {
    if (ElapsedTime.debug) ElapsedTime.log("calcseconds", days, hours, minutes, seconds)
    let calcSeconds =  (((((days * DTCalc.hpd) + 
                hours) * DTCalc.mph) 
                  + minutes) * DTCalc.spm)
                    + seconds;
    if (ElapsedTime.debug) ElapsedTime.log("calcseconds", days, hours, minutes, seconds, calcSeconds);
    return calcSeconds;
  }


  static setClock(timeInSeconds) {
    if (PseudoClock.isGM) PseudoClock.setClock(timeInSeconds);
    else PseudoClock.warnNotGM("Elapsedtime Set clock");
  }

  static advanceClock(timeIncrement: number) {
    if (typeof timeIncrement !== "number") return;
    if (PseudoClock.isGM) PseudoClock.setClock(PseudoClock.currentTime + timeIncrement);
    else PseudoClock.warnNotGM("Elapsedtime Advance clock");
  }

  static advanceTime(spec={}) {
    if (PseudoClock.isGM) {
      let advSeconds = DTMod.create(spec).toSeconds();
      ElapsedTime.advanceClock(advSeconds);
    }
    else PseudoClock.warnNotGM("Elapsedtime advance time");
  }

  /**
   * Set the time of day.
   * @param spec {hours=0, minutes=0, seconds=0}
   */
  static setTime(spec){
    if (PseudoClock.isGM) {
      let seconds = DTMod.create(spec).toSeconds() % DTCalc.spd;
      let days = Math.floor(PseudoClock.currentTime / DTCalc.spd);
      ElapsedTime.setClock(seconds + days * DTCalc.spd);
    }
    else PseudoClock.warnNotGM("Elapsedtime Set time");
  }

  /**
   * Set the clock to the given date time
   * @param dt DateTIme
   */
  static setDateTime(dt:DateTime) {
    if (PseudoClock.isGM) {
      let timeInSeconds = dt.toSeconds() - DateTime.create({years: DTCalc.clockStartYear}).toSeconds();
      PseudoClock.setClock(timeInSeconds);
    }
    else PseudoClock.warnNotGM("Elapsedtime Set DateTime");
  }

  /**
   * set specif
   * @param param0 
   */
  static setAbsolute({years=null, months=null, days=null, hours=null, minutes=null, seconds=null}={}) {
    if (PseudoClock.isGM) {
      let dt = DateTime.now().setAbsolute({years, months, days, hours, minutes, seconds});
      if (years !== null && months !== null && days !== null && hours !== null && minutes !== null && seconds!== null) {
        // no defaulting needed set this absolutely
        dt = DateTime.create({years, months, days, hours, minutes, seconds});
      }
      ElapsedTime.setDateTime(dt);
      return dt;
    }
    else PseudoClock.warnNotGM("Elapsedtime Set absolute");
  }

  /**
   * callback handling
   * do - call the supplied handler or macro
   * notify - broadcast an event message to all game clients
   * reminder - log a message to the console.
   * 
   * Each has 
   * At - run at the specified time
   * In - run after the specified interval
   * Every - run every specified interval
   * 
   */
  static doAt(when: DateTime, handler: (...args) => any, ...args) {
    return ElapsedTime.gsetTimeoutAt(when, handler, ...args);
  }

  static doIn(when: DTMod, handler: (...args) => any, ...args) {
    return ElapsedTime.gsetTimeoutIn(when, handler, ...args)
  }

  static doEvery(when: DTMod, handler: (...args) => any, ...args) {
    // this needs to add in the current time spec
    return ElapsedTime.gsetInterval(when, handler, ...args)
  }

  static reminderAt(when: DateTime, ...args) {
    //@ts-ignore
    return this.doAt(when, (...args) => game.Gametime.ElapsedTime.message(...args), ...args);
  }

  static reminderIn(when: DTMod, ...args) {
    //@ts-ignore
    return this.doIn(when, (...args) => game.Gametime.ElapsedTime.message(...args), ...args);
  }
  
  static reminderEvery(DTMod, ...args) {
    //@ts-ignore
    return this.doEvery(DTMod, (...args) => game.Gametime.ElapsedTime.message(...args), ...args);
  }
  
  static notifyAt(when: DateTime, eventName: string, ...args) {
    if (ElapsedTime.debug) ElapsedTime.log("notifyAt", eventName, ...args);
    //@ts-ignore
    return this.doAt(when, (eventName:string, ...args) => game.Gametime._notifyEvent(eventName, ...args), eventName, ...args)
  }

  static notifyIn(when: DTMod, eventName: string, ...args) {
    //@ts-ignore
    return this.doIn(when, (eventName:string, ...args) => game.Gametime._notifyEvent(eventName, ...args), eventName, ...args)
  }

  static notifyEvery(when: DTMod, eventName: string, ...args) {
    if (ElapsedTime.debug) ElapsedTime.log("notifyAt", eventName, ...args);
    //@ts-ignore
    return this.doEvery(when, (eventName:string, ...args) => game.Gametime._notifyEvent(eventName, ...args), eventName, ...args)
  }

  /* These are the base level routines - exist for analogy to normal real time clock */
  static gsetTimeout(when: DTMod, handler: (...args) => any, ...args) {
    if (!when.toSeconds) when = DTMod.create(when);
    let timeout = DateTime.now().add(when).toSeconds();
    if (ElapsedTime.debug) ElapsedTime.log("gsetTimeout", timeout, handler, ...args)
    return ElapsedTime._addEVent(timeout, false, null, handler, ...args);
  }

  static gsetTimeoutAt(when: DateTime, handler:  (...args) => any,  ...args) {
    let turnSpec: any = when;
    if (turnSpec.turns || turnSpec.rounds) { // do the effect at the specified round and turn.
      if ((turnSpec.turns || turnSpec.rounds) && turnSpec.startEnd) {
        // turnspec should be rounds: x or turns: x turn: start/end optional token => tokens turn not turn #
        console.log("DoIn matched a turn/round spec", turnSpec)
        return;
      }
    }
    if (!when.toSeconds) when = DateTime.create(when);
    let timeoutSeconds = when.toSeconds() - DateTime.now().toSeconds();
    return ElapsedTime._addEVent(timeoutSeconds, false, null, handler, ...args);
  }
  static gsetTimeoutIn(when: DTMod, handler:  (...args) => any,  ...args) {
    let turnSpec: any = when;
    if (turnSpec.turns || turnSpec.rounds) {
      if ((turnSpec.turns || turnSpec.rounds) && turnSpec.startEnd) {
        // turnspec should be rounds: x or turns: x turn: start/end optional token => tokens turn not turn #
        console.log("DoIn matched a turn/round spec", turnSpec)
        return;
      }
    }
    if (!when.toSeconds) when = DTMod.create(when);
    let timeoutSeconds = DateTime.now().add(when).toSeconds() - DateTime.now().toSeconds();
    return ElapsedTime._addEVent(timeoutSeconds, false, null, handler, ...args);
  }

  static gsetInterval(when: DTMod, handler: (...args) => any,  ...args) {
    // @ts-ignore
    if (when.rounds) {
      // @ts-ignore
      when.seconds = (when.seconds ? when.seconds : 0) + (when.rounds * CONFIG.time.roundTime);
      // @ts-ignore
      delete when.rounds;
    }
      
    if (!when.toSeconds) when = DTMod.create(when);
    let timeout = DateTime.now().add(when).toSeconds() - DateTime.now().toSeconds();;

    return ElapsedTime._addEVent(timeout, true, when, handler, ...args);
  }

  static gclearTimeout(uid: number) {
    return ElapsedTime._eventQueue.removeId(uid);
  }

  static doAtEvery(when: DateTime, every: DTMod, handler: (...args) => any, ...args) {
    if (!when.toSeconds) when = DateTime.create(when);
    let timeout = when.toSeconds() - DateTime.now().toSeconds();;
    return ElapsedTime._addEVent(timeout, true, every, handler, ...args);
  }

  static reminderAtEvery(when: DateTime, every: DTMod, ...args) {
    if (!when.toSeconds) when = DateTime.create(when);
    let timeout = when.toSeconds() - DateTime.now().toSeconds();;
    //@ts-ignore
    return ElapsedTime._addEVent(timeout, true, every, (...args) => game.Gametime.ElapsedTime.message(...args), ...args);
  }

  static notifyAtEvery(when: DateTime, every: DTMod, eventName: string, ...args) {
    if (!when.toSeconds) when = DateTime.create(when);
    let timeout = when.toSeconds() - DateTime.now().toSeconds();;
    //@ts-ignore
    return ElapsedTime._addEVent(timeout, true, every, (eventName:string, ...args) => game.Gametime._notifyEvent(eventName, ...args), eventName, ...args);
  }

  static _addEVent(time: number, recurring: boolean, increment: DTMod = null, handler: (...args) => any, ...args) {
    // only allow macros to be run
    //@ts-ignore
    // if (!game.macros.get(handler) && !game.macros.entities.find(m=>m.name === handler)) return undefined;

    let handlerString;
    let whandler;

    if (time < 0) {
      ui.notifications.warn("Cannot set event in the past");
      time = 1;
    }
    // Check that the function will work post saving
    if (typeof handler === "function") {
      try {
        handlerString = handler.toString(); 
        eval(handlerString);
      } catch (err) {
        let name = handlerString.match(/[^\{\()]*/)
        console.warn(`about-time | handler not valid ${name}`);
        console.log(`try wrapping in (<arglist>) => func(<arglist>)`)
        return undefined;
      }
    }
    let uid = null;
    if (ElapsedTime.debug) ElapsedTime.log("add event", handler)
    // if the increment is just data upgrade it to a DTmod
    if (recurring && !increment.toSeconds) increment = DTMod.create(increment);
    const entry = new Quentry(PseudoClock.currentTime + time, recurring, increment, handler, uid, ...args)
    if (PseudoClock.isMaster) {
      ElapsedTime._eventQueue.add(entry);
      ElapsedTime._save(true);
      ElapsedTime._increment = increment;
      return entry._uid;
    } else {
      const eventMessage = new PseudoClockMessage({action: _addEvent, userId: game.user.id, newTime: 0}, entry.exportToJson());
      PseudoClock._notifyUsers(eventMessage)
    }
  }

  /*
  static _addEVentAt(time: number, recurring: boolean, increment: DTMod,  handler: (...args) => any, ...args) {
    const entry = new Quentry(time, recurring, increment, handler, null, ...args)
    ElapsedTime._eventQueue.add(entry);
    ElapsedTime._save(true);
    return entry._uid;
  }
*/
  /**
   * call and if required reschedule events due to execute at the new time
   * @param newTime passed by the clock update
   */
  static async pseudoClockUpdate(newTime: number) {
    // newTime = newTime / 1000;
    if (!PseudoClock.isMaster) return;
    if (ElapsedTime.debug) ElapsedTime.log(ElapsedTime.currentTimeString())

    let needSave = false;
    // Check the event queue for activities to fire.
    const q: FastPriorityQueue = ElapsedTime._eventQueue;
    if (ElapsedTime.debug && q.size) {
      ElapsedTime.log("pseudoClockUpdate", q);
      ElapsedTime.log("pseudoClockUpdate", PseudoClock.currentTime, q.peek()._time);
    }
    while (q.peek() && q.peek()._time <= PseudoClock.currentTime) {
      let qe: Quentry = q.poll();
      if (ElapsedTime.debug) ElapsedTime.log("pseudoClockUpdate - doing event ", qe);
      try {
        // Assume string handlers refer to macros id or name
        if (typeof qe._handler  === "string") {
          let macro;
          let args;
          if (qe._handler === "DynamicEffects-Item-Macro") {
            let itemData = qe._args[0];
            args = qe._args.splice(1);
            let macroCommand = itemData.flags.itemacro?.macro?.data?.command || "";
            if (macroCommand) macro = await CONFIG.Macro.entityClass.create({
              name: "dynamiceffects-item-macro",
              type: "script",
              img: itemData.img,
              command: macroCommand,
              flags: {"dnd5e.itemMacro": true }
            }, { displaySheet: false, temporary: true });
          } else {
            // @ts-ignore
            macro = game.macros.get(qe._handler);
            args = qe._args;
            //@ts-ignore
            if (!macro) macro = game.macros.entities.find(m=>m.name === qe._handler);
          }
          if (ElapsedTime.debug) ElapsedTime.log("Executing macro", macro, args)
          if (macro) macro.execute(...args);
        } else {
          if (ElapsedTime.debug) ElapsedTime.log("clock update ", ...qe._args)
          await qe._handler(...qe._args);
        }
        if (qe._recurring) {
          if (ElapsedTime.debug) ElapsedTime.log("recurring event", qe._increment, qe._handler, qe._time)
          // let newTime = DateTime.now().add(qe._increment).toSeconds() - DateTime.now().toSeconds() + PseudoClock.currentTime;
          // Do via date creation and add so things like +1 year work correctly
          let execTime = DateTime.createFromSeconds(qe._time);
          let seconds = execTime.add(qe._increment).toSeconds() - DateTime.create().toSeconds();
         //  let seconds = execTime.add(qe._increment).toSeconds();
          if (seconds <= qe._time) {
            // attempting to schedule recurring event in the past
            console.error("about-time | Event time not increasing event reschedule rejected", qe)
          } else {
            qe._time = seconds;
            q.add(qe);
          }
        }
      } catch(err) {
        console.error(err);
      } finally {
        needSave = true;
      }
    }
    if (needSave) ElapsedTime._save(true); // force a save as the queue has changed.
  }

  /**
   * housekeeping and initialisation
   */
  static _flushQueue() {
    if (PseudoClock.isMaster) {
      ElapsedTime._eventQueue = new FastPriorityQueue();
      ElapsedTime._save(true);
    }
  }

  static resetCombats() {
    ElapsedTime._activeCombats = [];
    ElapsedTime._save(true);
  }
  static _load() {
    let saveData = game.settings.get("about-time", "store");
    if (ElapsedTime.debug) ElapsedTime.log("_load", saveData)
    if (!saveData) {
      if (ElapsedTime.debug) ElapsedTime.log("ElapsedTime - no saved data re-initializing")
      ElapsedTime._initialize();
    } else {
      if (ElapsedTime.debug) ElapsedTime.log("ElapsedTime - loaded saved Data. ", saveData);
      ElapsedTime._createFromData(saveData);
    }
  }

  static _lastSaveTime;;

  static _save(force: boolean=false) {
    if (PseudoClock.isMaster) {
      let newSaveTime = Date.now();
      if ((newSaveTime - ElapsedTime._lastSaveTime > ElapsedTime._saveInterval) || force) {
        if (ElapsedTime.debug) ElapsedTime.log("_save saving", new Date(), ElapsedTime.currentTimeString());
        let saveData = { 
          _eventQueue: ElapsedTime._eventQueue.exportToJSON(),
          _activeCombats: ElapsedTime._activeCombats,
        }
        // put something in to throttle saving
        game.settings.set("about-time", "store", saveData);
        PseudoClock._save(true);
        ElapsedTime._lastSaveTime = newSaveTime;
      }
    }
  }

  static init() {
    _userId = game.user.id;
    //@ts-ignore
    _isGM = game.user.isGM;
    ElapsedTime._lastSaveTime = Date.now();

    // find a better way to do this.
    ElapsedTime._fetchParams();
    ElapsedTime._load();
    Hooks.on("updateWorldTime", ElapsedTime.pseudoClockUpdate);
    Hooks.on("updateCombat", () => {
      if (!PseudoClock.isMaster) return;
      PseudoClock.pauseRealTime();
    });
    Hooks.on("deleteCombat", () => {
      if (PseudoClock.isMaster)
        PseudoClock.resumeRealTime();
    })
  }

  static _initialize(currentTime: number = 0) {
    ElapsedTime._eventQueue = new FastPriorityQueue();
    ElapsedTime._activeCombats = [];
    if (PseudoClock.isMaster) ElapsedTime._save(true);
  }

  static _createFromData(data: any) {
    // ElapsedTime._eventQueue = FastPriorityQueue.createFromData(data._eventQueue);
    ElapsedTime._eventQueue = FastPriorityQueue.createFromJson(data._eventQueue);
    ElapsedTime._activeCombats = data._activeCombats || [];
    ElapsedTime._fetchParams();
  }

  static _fetchParams() {
    ElapsedTime.debug = game.settings.get("about-time", "debug") || false;
    PseudoClock.setDebug(ElapsedTime.debug);
    if (ElapsedTime.debug) ElapsedTime.log("_fetchParams", `hpd ${DTCalc.hpd}`, `mph ${DTCalc.mph}`, `spm ${DTCalc.spm}`);
  }

  static showQueue() {
    if (ElapsedTime._eventQueue.size === 0) {console.log("Empty Queue")}
    for (let i = 0; i < ElapsedTime._eventQueue.size; i++) {
      ElapsedTime.log(`queue [${i}]`, 
      ElapsedTime._eventQueue.array[i]._uid, 
      DateTime.createFromSeconds(ElapsedTime._eventQueue.array[i]._time).shortDate(),
      ElapsedTime._eventQueue.array[i]._recurring,
      ElapsedTime._eventQueue.array[i]._increment,
      ElapsedTime._eventQueue.array[i]._handler, 
      ElapsedTime._eventQueue.array[i]._args);
    }
  }

  static chatQueue({showArgs = false, showUid = false, showDate = false, gmOnly = true}={showArgs: false, showUid: false, showDate: false, gmOnly: true}) {
    let content = "";
    for (let i = 0; i < ElapsedTime._eventQueue.size; i++) {
      if (showUid) content += ElapsedTime._eventQueue.array[i]._uid + " ";
      let eventDate = DateTime.createFromSeconds(ElapsedTime._eventQueue.array[i]._time).shortDate();
      if (showDate) content += eventDate.date + " ";
      content += eventDate.time + " ";
      let handlerString = typeof ElapsedTime._eventQueue.array[i]._handler === "string" ? ElapsedTime._eventQueue.array[i]._handler : "[function]";
      content += handlerString + " ";
      if (showArgs) content += ElapsedTime._eventQueue.array[i]._args;
      content += "\n";
    }
    let chatData:any  = {};
    if (gmOnly) {
      //chatData.isWhisper = true;
      //@ts-ignore
      chatData.whisper = ChatMessage.getWhisperRecipients("GM").filter(u=>u.active);
    }
    //@ts-ignore
    if (content === "") chatData.content = "Empty Queue";
    //@ts-ignore
    else chatData.content = content;
    //@ts-ignore
    ChatMessage.create(chatData)
  }

  static message(content, alias = null, targets=null, ...args) {

    //@ts-ignore
    let chatMessage = ChatMessage;

    let chatData = {
      //@ts-ignore
      user: game.user._id,
      //@ts-ignore
      speaker: { actor: game.user.actor },
      content: content,
      //@ts-ignore
      type: CONST.CHAT_MESSAGE_TYPES.OTHER, 
      flags: {  }
    }
    //@ts-ignore
    if (alias) chatData.speaker = {actor: game.user, alias: alias};

    if (targets) {
      let whisperTargets = [];
      if (typeof targets === "object") {
        for (let id of targets) {
          whisperTargets = whisperTargets.concat(chatMessage.getWhisperRecipients(id))
        }
      } else if (typeof targets === "string") whisperTargets = chatMessage.getWhisperRecipients(targets);
      if (whisperTargets.length > 0) {
        chatData["whisper"] = whisperTargets;
      }
    }

    //@ts-ignore
    chatMessage.create(chatData);
  }
}
