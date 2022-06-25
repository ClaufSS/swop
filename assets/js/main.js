
let checker = null;
let reload = null;

const config = {
  grids: {
    size: 3,
    quantity: 2,
    disposition: {
      portrait: [1, 2],
      landscape: [2, 1]
    }
  }
};


(function () {

	const gs = document.querySelector('.game-section');
	const gameManager = manager();

	const configuration = gameManager.configure(gs, config);

  if (configuration.state === 'done') {
    gameManager.start();

    checker = gameManager.checkGame;
    reload = gameManager.updateGame;    
  }

  console.log(configuration.state)

})();