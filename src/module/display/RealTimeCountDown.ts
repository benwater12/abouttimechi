import {ElapsedTime} from "../ElapsedTime"
import {DateTime} from "../calendar/DateTime"
import { DTMod } from "../calendar/DTMod";
import { _showTimer, PseudoClock } from "../PseudoClock";


let realTimeDisplayMain: RealTimeCountDown = null;
export class RealTimeCountDown extends FormApplication {
  targetTime: number;
  intervalTimer;
  displayRunning : boolean;
  
  constructor(object = {}, options = null, duration: DTMod = DTMod.create({minutes: 10})) {
    super(object, options);
    this.targetTime = duration.toSeconds() * 1000;
    console.log("target time is ", duration, this.targetTime)
  }
  
  static showTimer() {
    if (realTimeDisplayMain) realTimeDisplayMain.render(true);
  }

  static startTimer(duration?: DTMod) {
    console.log("Duration is ", duration)
    if (!realTimeDisplayMain) {
      realTimeDisplayMain = new RealTimeCountDown({}, {}, duration);
      RealTimeCountDown.setupHooks();
    }
    else realTimeDisplayMain.resetTimer(duration);
    realTimeDisplayMain.render(true);
    realTimeDisplayMain.intervalTimer = setInterval(() => {
      if (realTimeDisplayMain.displayRunning) {
        realTimeDisplayMain.targetTime = Math.max(realTimeDisplayMain.targetTime - 1000, 0);
        realTimeDisplayMain.render(true);
      }
      if (realTimeDisplayMain.targetTime === 0) realTimeDisplayMain.removeTimer();

    }, 1000);
  }

  private resetTimer(duration: DTMod) {
    realTimeDisplayMain.removeTimer();
    this.targetTime = duration.toSeconds() * 1000;
  }

  static updateClock() {
    if (realTimeDisplayMain) {
      realTimeDisplayMain.render(false);
    }
  }

  activateListeners(html) {
    super.activateListeners(html);

    if (!game.user.isGM) return;

    $(html)
      .find("#about-time-calendar-btn-min")
      .click(event => {
        this.targetTime = Math.max(this.targetTime - 60 * 1000, 0)
        this.render(false);
      });

    $(html)
      .find("#about-time-calendar-btn-tenMin")
      .click(event => {
        this.targetTime = Math.max(this.targetTime - 600 * 1000, 0)
        this.render(false);
      });
    
    $(html)
      .find("#about-time-calendar-btn-long")
      .click(event => {
        this.targetTime = Math.max(this.targetTime - 60 * 60 * 1000, 0)
        this.render(false);
      });
    $(html)
    .find("#about-time-calendar-time")
    .click(event => {
      realTimeDisplayMain.displayRunning = !realTimeDisplayMain.displayRunning;
      realTimeDisplayMain.render(false);
    });
  }

  get title() {
    return  DTMod.timeString(Math.floor(this.targetTime/1000));
    return `Seconds: ${Math.floor(this.targetTime/1000)}`;
  }

  static get defaultOptions() {
    const options = super.defaultOptions;
    options.template = "modules/about-time/templates/countDown.html";
   // options.width = 520;
   // options.height = 520; // should be "auto", but foundry has problems with dynamic content
    options.title = "0";
    return options;
  }

  /**
   * Provides data to the form, which then can be rendered using the handlebars templating engine
   */
  getData() {
    //@ts-ignore
    let timeRemaining = Math.max(0, this.targetTime);
    return {
        now: new Date(),
        running: realTimeDisplayMain.displayRunning,
        //@ts-ignore
        isMaster: true,
        //@ts-ignore
        isGM: game.user.isGM,
        targetTime: realTimeDisplayMain.title,
        timeRemaining: realTimeDisplayMain.title
    };
  }

  removeTimer() {
    if (realTimeDisplayMain.intervalTimer) {
      clearTimeout(realTimeDisplayMain.intervalTimer)
      realTimeDisplayMain.intervalTimer = 0;
    }
  }
  close() {
    realTimeDisplayMain.removeTimer();
    return super.close();
  }

  static setupHooks() {
  }
}