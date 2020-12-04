import App from './App.svelte';
// import * as iev from './js/ical_events.js';
// import * as ifc from './js/ical_fullcalendar.js';

const app = new App({
	target: document.body,
	props: {
		name: 'Meet With'
	}
});

export default app;