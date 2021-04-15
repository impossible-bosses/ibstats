$(document).ready(function() {
	$.get("./data/replays.json", function(data) {
		console.log(data);
	});
});
