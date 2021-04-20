function registerCollapsibles()
{
	let collapsibleOpeners = document.getElementsByClassName("collapsible");
	for (let i = 0; i < collapsibleOpeners.length; i++) {
		collapsibleOpeners[i].addEventListener("click", function() {
			this.classList.toggle("active");
			let content = this.nextElementSibling;
			if (content.style.display === "block") {
				content.style.display = "none";
			} else {
				content.style.display = "block";
			}
		});
	}
}