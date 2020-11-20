(function (window, document) {

  var layout = document.getElementById('layout'),
    menu = document.getElementById('menu'),
    menuLink = document.getElementById('menuLink');

  let sources = {}

  function makeRequest(url, callback) {
    req = new XMLHttpRequest()
    req.addEventListener('load', callback)
    req.open('GET', url)
    req.send()
  }

  function getRandomColour() {
    var hex = '0123456789ABCDEF'
    var colour = '#'
    for (var i = 0; i < 6; i++) {
      colour += hex[Math.floor(Math.random() * 16)]
    }
    return colour
  }

  function loadICS(url) {
    let tz = "Europe/Zurich"
    makeRequest(url, function () {
      const parsedCal = ICAL.parse(this.response)


      let clr = getRandomColour()
      srcEvents = fc_events(parsedCal, tz, { color: clr })
      es = cal.addEventSource({ events: srcEvents, color: clr, id: url })
      const calProps = new ICAL.Component(parsedCal).getAllProperties()
      calProps.forEach(function (prop) {
        if (prop.hasOwnProperty('jCal') && prop['jCal'].indexOf("x-wr-calname") !== -1) {
          const calName = prop['jCal'][3]
          var listEl = document.createElement("li")
          listEl.innerHTML = `<i class="icon-remove del-cal" data-ics=${url}></i> ${calName}`
          document.getElementById('calendars').appendChild(listEl)
          sources[calName] = { url: url, enabled: true }
          localStorage.setItem('cals', JSON.stringify(sources))
        }
        if (prop.hasOwnProperty('jCal') && prop['jCal'].indexOf("x-wr-timezone") !== -1) {
          tz = prop['jCal'][3]
        }
      })

    })
  }

  function readCsv(e) {
    console.log(e)
    if (e.target.files && e.target.files[0]) {
      let reader = new FileReader()
      reader.readAsBinaryString(e.target.files[0])
      reader.onload = function (e) {
        let csvData = []
        let lbreak = e.target.result.split("\n")
        lbreak.forEach(res => {
          vals = res.split(",")
          csvData.push();
          loadICS(vals[1])
        });

      }
    }
  }

  function availabilityCheck(info) {
    info.jsEvent.preventDefault()

    document.getElementById('booker').style.display = 'block';
    var comp = new ICAL.Component(['vcalendar', [], []]);
    comp.updatePropertyWithValue('prodid', '-//meetwith.xyz Open Source Event Booking');
    comp.updatePropertyWithValue('METHOD', 'REQUEST');
    var vevent = new ICAL.Component('vevent'),
      event = new ICAL.Event(vevent);

    console.log(info)
    // Set standard properties
    event.summary = "Let's Meet";
    event.uid = Date.now().toString();
    event.startDate = new ICAL.Time().fromJSDate(info.start);
    event.endDate = new ICAL.Time().fromJSDate(info.end);
    event.organizer = (sources[0]) // TODO deal with assumption
    vevent.addPropertyWithValue('x-created-by', 'whencanwe.io');
    comp.addSubcomponent(vevent);
    // TODO create email link / create downloadable ICS
  }

  function addICS(e) {
    if (e.keyCode === 13) {
      const ics = document.getElementById('new-ics')
      var sp = window.location.searchParams
      if (sp === undefined) {
        sp = new URLSearchParams(window.location.search)
      }
      sp.append('cal', e.target.value)
      window.location.search = sp
    }
  }

  function removeICS(e) {
    var selector = '.del-cal';
    // find the closest parent of the event target that
    // matches the icon click
    e.preventDefault()
    var closest = e.target.closest(selector);
    if (closest && base.contains(closest)) {
      ics = e.target.getAttribute('data-ics')
      src = cal.getEventSourceById(ics)
      src.remove()
      var op = new URLSearchParams(window.location.search)
      var sp = op.getAll('cal').filter((val, index, arr) => { return val !== ics })
      op.delete('cal')
      op.append('cal', sp)
      window.location.search = op
      e.target.remove() // not technically needed as refresh is triggered
    }
  }

  function configInit() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const cals = urlParams.getAll('cal')
    const when = urlParams.get('whenDate')

    const el = document.getElementById('calendar');
    cal = new FullCalendar.Calendar(el, {
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
      },
      initialDate: when,
      initialView: 'timeGridDay',
      editable: true,
      selectable: true,
      selectOverlap: false,
      unselectAuto: false,
      select: availabilityCheck,
      dateClick: availabilityCheck,
      eventClick: availabilityCheck,
    })

    var calList = document.getElementById('calendars');
    calList.addEventListener('click', removeICS);

    savedCals = localStorage.getItem('cals')
    sources = savedCals || {}
    document.getElementById('new-ics').onkeydown = addICS
    cal.render()
    cals.forEach(function (ics) {
      // loadICS(ics)
    })

  }

  function toggleClass(element, className) {
    var classes = element.className.split(/\s+/),
      length = classes.length,
      i = 0;

    for (; i < length; i++) {
      if (classes[i] === className) {
        classes.splice(i, 1);
        break;
      }
    }
    if (length === classes.length) {
      classes.push(className);
    }

    element.className = classes.join(' ');
  }

  function toggleAll(e) {
    var active = 'active';

    e.preventDefault();
    toggleClass(layout, active);
    toggleClass(menu, active);
    toggleClass(menuLink, active);
  }

  function handleEvent(e) {
    if (e.target.id === menuLink.id) {
      return toggleAll(e);
    }

    if (menu.className.indexOf('active') !== -1) {
      return toggleAll(e);
    }
  }


  document.addEventListener('DOMContentLoaded', function () {
    configInit()
    cal.render()
    layout = document.getElementById('layout'),
      menu = document.getElementById('menu'),
      menuLink = document.getElementById('menuLink')
    document.addEventListener('click', handleEvent)
    document.getElementById('files').addEventListener('change', readCsv)
  })

}(this, this.document));



