import Ember from 'ember';

export default Ember.Component.extend({
  game: Ember.inject.service(),
  localStorage: Ember.inject.service(),
  hiScore: 0,
  pizzaCount: 0,

  init() {
    this._super(...arguments);
    this.set('hiScore', this.get('localStorage').get('previousHiScore') || 0);
  },

  didInsertElement() {
    this.configureCanvas();
    this.configureGame();
    this.configureEventListeners();
    this.addEventListeners();

    Ember.run.scheduleOnce('afterRender', () => {
      this.resizeCanvas();
      const game = this.get('game');
      if (game.paused === false) { game.play(); }
    });
  },

  willDestroyElement() {
    this.get('game').pause();
    this.removeEventListeners();
  },

  configureCanvas() {
    var canvas = this.get('element').getElementsByClassName('js-game')[0];
    this.set('canvas', canvas);
  },

  configureGame() {
    const canvas = this.get('canvas');
    const game = this.get('game');

    game.configureGame(canvas, this);
  },

  gameOver(score) {
    this.sendAction('changeLevel', 1);
    if (!this.get('localStorage').get('previousInitials')) {
      this.sendAction('enterInitialsAndSaveHiScore', score);
    } else {
      this.get('localStorage').saveNewHiScore(score);
    }
  },

  log10: function(x) {
    return Math.log(x) / Math.LN10;
  },

  scoreUpdated(score) {
    Ember.run(() => {
      this.set('pizzaCount', score);

      if (score > this.get('hiScore')) {
        this.set('hiScore', score);
      }
    });

    const newLevel = Math.max(1, parseInt(this.log10(score)) + 1);
    const currentLevel = parseInt(this.get('game').level);

    if (!!newLevel && newLevel !== currentLevel) {
      this.sendAction('changeLevel', newLevel);
    }
  },

  configureEventListeners() {
    this.set('playOrPause', this._playOrPause.bind(this));
    this.set('resizeCanvas', this._resizeCanvas.bind(this));
  },

  addEventListeners() {
    window.addEventListener('keydown', this.playOrPause, false);
    window.addEventListener('resize', this.resizeCanvas, false);
  },

  removeEventListeners() {
    const element = this.get('element');
    const game = this.get('game');
    element.removeEventListener('keydown', this.playOrPause, false);
    element.removeEventListener('resize', this.resizeCanvas, false);
    if (game) { game.removeEventListeners(); }
  },

  gameEventReceived(eventName, data) {
    if (eventName === 'updated-pizza-count') {
      this.scoreUpdated(data);
    } else if (eventName === 'game-over') {
      this.gameOver(data);
    }
  },

  _playOrPause(e) {
    const game = this.get('game');
    if (e.keyCode === 67) {
      if(this.get('game').get('animReq')) {
        game.pause();
      } else {
        game.play();
      }
    }
  },

  _resizeCanvas() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const viewportDimensions = { width: width, height: height };
    this.get('game').resizeCanvasWithViewportDimensions(viewportDimensions);
  }
});
