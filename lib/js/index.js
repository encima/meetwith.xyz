let sources = []

function makeRequest(url, callback) {
  req = new XMLHttpRequest()
  req.addEventListener('load', callback)
  req.open('GET', url)
  req.send()
}

function getRandomColour() {
  var hex = '0123456789ABCDEF';
  var colour = '#';
  for (var i = 0; i < 6; i++) {
    colour += hex[Math.floor(Math.random() * 16)];
  }
  return colour;
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
        $('#calendars').append(`<li><i class="icon-remove del-cal" data-ics=${url}></i> ${calName}</li>`)
        sources.push(calName)
      }
      if (prop.hasOwnProperty('jCal') && prop['jCal'].indexOf("x-wr-timezone") !== -1) {
        tz = prop['jCal'][3]
      }
    })

  })
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

    document.getElementById('new-ics').onkeydown = addICS
    cal.render()
    cals.forEach(function (ics) {
      loadICS(ics)
    })
  }

  document.addEventListener('DOMContentLoaded', function () {
    configInit()
    cal.render()
  })

