(() => {
  setTimeout(() => {
    if (window.api && window.api.introComplete) {
      window.api.introComplete();
    }
  }, 3e3);
})();
