import { openDB, DBSchema, deleteDB, wrap, unwrap } from "idb";
import ICAL from "ical.js";

class CalendarManager {
  constructor(dbName, fullCal) {
    this.db =
      openDB <
      CalDB >
      (dbName,
      1,
      {
        upgrade(db) {
          const calStore = db.createObjectStore("cals");
          const peopleStore = db.createObjectStore("people");
        },
      });
    this.cal = fullCal;
  }

  async loadICS(url) {
    let tz = "Europe/Zurich";

    makeRequest(url, function () {
      const parsedCal = ICAL.parse(this.response);

      let clr = getRandomColour();
      const srcEvents = fc_events(parsedCal, tz, { color: clr });
      const calProps = new ICAL.Component(parsedCal).getAllProperties();
      calProps.forEach(function (prop) {
        if (
          prop.hasOwnProperty("jCal") &&
          prop["jCal"].indexOf("x-wr-calname") !== -1
        ) {
          const calName = prop["jCal"][3];
          if (calName in sources) {
            console.log("ignoring duplicate: " + calName);
            return;
          } else {
            const es = cal.addEventSource({
              events: srcEvents,
              color: clr,
              id: url,
            });
          }
          sources[calName] = { url: url, enabled: true };
          this.db.put("cals", calName, url);
        }
        if (
          prop.hasOwnProperty("jCal") &&
          prop["jCal"].indexOf("x-wr-timezone") !== -1
        ) {
          tz = prop["jCal"][3];
        }
      });
    });
  }
}

exports.loadICS = loadICS;
