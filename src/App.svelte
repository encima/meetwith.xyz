<script lang="ts">
	import { Calendar, flexibleCompare } from "@fullcalendar/core";
	import dayGridPlugin from "@fullcalendar/daygrid";
	import timeGridDay from "@fullcalendar/timegrid";
	import dateClick from "@fullcalendar/interaction";
	import { openDB, DBSchema, deleteDB, wrap, unwrap } from "idb";
	import { onMount } from "svelte";
	import Modal from "./Modal.svelte";
	import ModalContent from "./ModalContent.svelte"
	import ICAL from "ical.js"
	export let name: string;

	interface CalSource {
		id?: number;
		url?: string;
		alias?: string;
		name?: string;
		group?: string;
	}

	interface CalDB extends DBSchema {
		cals: {
			key: string;
			value: string;
		};
		people: {
			value: {
				calendars: string[];
			};
			key: string;
		};
	}

	let cal, db;

	onMount(async () => {
		db = await openDB<CalDB>("mw-db", 1, {
			upgrade(db) {
				const calStore = db.createObjectStore("cals");

				const peopleStore = db.createObjectStore("people");
			},
		});
		// dbInit();
		configInit();
		(layout = document.getElementById("layout")),
			(menu = document.getElementById("menu")),
			(menuLink = document.getElementById("menuLink"));
		document.addEventListener("click", handleEvent);
		document.getElementById("files").addEventListener("change", readCsv);
	});

	// function getIndex() {
	// 	db.transaction('rw', db.cals, async() => {
	// 		return await db.cals.where({name: 'Josephine'}).count()) === 0) ;

	// 	});
	// }

	var layout = document.getElementById("layout"),
		menu = document.getElementById("menu"),
		menuLink = document.getElementById("menuLink");

	let sources = {};

	function makeRequest(url, callback) {
		const req = new XMLHttpRequest();
		req.addEventListener("load", callback);
		req.open("GET", url);
		req.send();
	}

	function getRandomColour() {
		var hex = "0123456789ABCDEF";
		var colour = "#";
		for (var i = 0; i < 6; i++) {
			colour += hex[Math.floor(Math.random() * 16)];
		}
		return colour;
	}

	async function loadICS(url) {
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
					var listEl = document.createElement("li");
					listEl.innerHTML = `<i class="icon-remove del-cal" data-ics=${url}></i> ${calName}`;
					document.getElementById("calendars").appendChild(listEl);
					sources[calName] = { url: url, enabled: true };
					db.put("cals", calName, url);
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

	function availabilityCheck(info) {
		info.jsEvent.preventDefault();

		document.getElementById("booker").style.display = "block";
		var comp = new ICAL.Component(["vcalendar", [], []]);
		comp.updatePropertyWithValue(
			"prodid",
			"-//meetwith.xyz Open Source Event Booking"
		);
		comp.updatePropertyWithValue("METHOD", "REQUEST");
		var vevent = new ICAL.Component("vevent"),
			event = new ICAL.Event(vevent);

		console.log(info);
		// Set standard properties
		event.summary = "Let's Meet";
		event.uid = Date.now().toString();
		event.startDate = new ICAL.Time().fromJSDate(info.start);
		event.endDate = new ICAL.Time().fromJSDate(info.end);
		event.organizer = sources[0]; // TODO deal with assumption
		vevent.addPropertyWithValue("x-created-by", "whencanwe.io");
		comp.addSubcomponent(vevent);
		// TODO create email link / create downloadable ICS
	}

	function addICS(e) {
		if (e.keyCode === 13) {
			const ics = document.getElementById("new-ics");
			var sp = window.location.searchParams;
			if (sp === undefined) {
				sp = new URLSearchParams(window.location.search);
			}
			sp.append("cal", e.target.value);
			window.location.search = sp;
		}
	}

	function removeICS(e) {
		var selector = ".del-cal";
		// find the closest parent of the event target that
		// matches the icon click
		e.preventDefault();
		var closest = e.target.closest(selector);
		if (closest && base.contains(closest)) {
			ics = e.target.getAttribute("data-ics");
			src = cal.getEventSourceById(ics);
			src.remove();
			var op = new URLSearchParams(window.location.search);
			var sp = op.getAll("cal").filter((val, index, arr) => {
				return val !== ics;
			});
			op.delete("cal");
			op.append("cal", sp);
			window.location.search = op;
			e.target.remove(); // not technically needed as refresh is triggered
		}
	}

	function configInit() {
		const queryString = window.location.search;
		const urlParams = new URLSearchParams(queryString);
		const cals = urlParams.getAll("cal");
		const when = urlParams.get("whenDate");

		const el = document.getElementById("calendar");
		cal = new Calendar(el, {
			plugins: [dayGridPlugin, timeGridDay, dateClick],
			headerToolbar: {
				left: "prev,next today",
				center: "title",
				right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
			},
			initialDate: when,
			initialView: "timeGridDay",
			editable: true,
			selectable: true,
			selectOverlap: false,
			unselectAuto: false,
			select: availabilityCheck,
			dateClick: availabilityCheck,
			eventClick: availabilityCheck,
		});
		cal.render();

		var calList = document.getElementById("calendars");
		calList.addEventListener("click", removeICS);

		sources = {};
		document.getElementById("new-ics").onkeydown = addICS;
		cal.render();
		cals.forEach(function (ics) {
			loadICS(ics);
		});
		loadSaved();
	}

	async function loadSaved() {
		const savedCals = await db.getAllKeys("cals");
		savedCals.forEach(async (key) => {
			loadICS(key);
		});
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

		element.className = classes.join(" ");
	}

	function toggleAll(e) {
		var active = "active";

		e.preventDefault();
		toggleClass(layout, active);
		toggleClass(menu, active);
		toggleClass(menuLink, active);
	}

	function handleEvent(e) {
		if (e.target.id === menuLink.id) {
			return toggleAll(e);
		}

		if (menu.className.indexOf("active") !== -1) {
			return toggleAll(e);
		}
	}
</script>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>

<svelte:head>
	<link
		href="https://netdna.bootstrapcdn.com/twitter-bootstrap/2.3.2/css/bootstrap-combined.no-icons.min.css"
		rel="stylesheet" />
	<link
		href="https://netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.css"
		rel="stylesheet" />
	<link
		rel="stylesheet"
		href="https://unpkg.com/purecss@2.0.3/build/pure-min.css"
		crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://cdn.jsdelivr.net/npm/fullcalendar@5.3.2/main.css"
		integrity="sha256-ejA/z0dc7D+StbJL/0HAnRG/Xae3yS2gzg0OAnIURC4="
		crossorigin="anonymous" />
	<link rel="stylesheet" href="/lib/css/style.css" />
	<script
		src="https://cdn.jsdelivr.net/npm/fullcalendar@5.3.2/main.min.js"
		integrity="sha256-mMw9aRRFx9TK/L0dn25GKxH/WH7rtFTp+P9Uma+2+zc="
		crossorigin="anonymous">
	</script>
	<script src="./lib/js/fdb-all.min.js" type="text/javascript">
	</script>
	<script src="./lib/js/ical_fullcalendar.js">
	</script>
	<script src="./lib/js/ical_events.js">
	</script>
</svelte:head>
<main>
	<h1>{name}!</h1>
	<div id="layout">
		<!-- Menu toggle -->
		<a href="#menu" id="menuLink" class="menu-link">
			<!-- Hamburger icon -->
			<span />
		</a>

		<div id="menu">
			<div class="pure-menu">
				<a class="pure-menu-heading" href="#">Meetwith.xyz</a>
				<a class="pure-menu-item pure-menu-item-selected"><a
						href="#"
						class="pure-menu-subheading pure-menu-link">Current</a>
					<ul class="pure-menu-list" id="calendars" />
					<a
						href="#"
						class="pure-menu-subheading pure-menu-link">Saved</a>
					<ul class="pure-menu-list" id="saved-calendars" />
						<hr>
						<Modal>
							<ModalContent/>
						</Modal>
				</a>
			</div>
		</div>

		<div id="main">
			<div class="header">
				<h1 class="content-head center">Meet With:</h1>
				<div id="config" class="center">
					<ul id="calendars" />
					<input
						id="new-ics"
						placeholder="Add a Calendar URL"
						type="url" />
					<h3 id="booker">Book?</h3>
				</div>
			</div>

			<div class="content">
				<div id="calendar" />
			</div>
		</div>
	</div>
</main>
