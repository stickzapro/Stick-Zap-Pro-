(() => {
  const installButton = document.getElementById('install-app');
  let installPrompt = null;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    if (installButton) installButton.hidden = false;
  });

  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    if (installButton) installButton.hidden = true;
    alert('StickZap Creator Studio was installed. Find it on your home screen.');
  });

  if (installButton) {
    installButton.hidden = false;
    installButton.addEventListener('click', async () => {
      if (installPrompt) {
        installPrompt.prompt();
        await installPrompt.userChoice;
        installPrompt = null;
        installButton.hidden = true;
      } else {
        alert('To add StickZap to your Android home screen: open this site in Chrome, tap ⋮, then choose Install app or Add to Home screen. If the option is missing, make sure the site is deployed over HTTPS and reload it once.');
      }
    });
  }

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch((error) => {
        console.warn('StickZap offline support could not be enabled:', error);
      });
    });
  }
})();
