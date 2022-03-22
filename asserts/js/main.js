
(function () {
	const gs = document.querySelector('.game');
	const gameManager = manager(gs, 5);

	gameManager.createCells();

	function loop() {
		if (gameManager.inActivity) {
			window.requestAnimationFrame(loop);
		}
	}
	//loop();    
})();

