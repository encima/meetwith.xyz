

build-ical:
	cd lib/js; \
	wget https://raw.githubusercontent.com/leonaard/icalendar2fullcalendar/gh-pages/ical_events.js \
	https://raw.githubusercontent.com/leonaard/icalendar2fullcalendar/gh-pages/ical_fullcalendar.js

run:
	python3 -m http.server
