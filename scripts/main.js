

$(document).ready(function() {
	$.get("./cached/replays.json", function(data) {
		console.log(data);
	});
});
