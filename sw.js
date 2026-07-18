self.addEventListener('push', function(event) {
  let data = {
    title: '📦 Novo Pedido Recebido!',
    body: 'Abra o Cardapp para conferir os detalhes.',
    icon: '/logo.png',
    url: '/admin'
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      console.warn("Falha ao analisar JSON do push, usando texto simples", e);
      data.body = event.data.text() || data.body;
    }
  }

  // Defesa: Evita que strings base64 quebrem a renderização do sistema operacional
  let iconUrl = data.icon || '/logo.png';
  if (iconUrl.startsWith('data:')) {
    iconUrl = '/logo.png';
  }

  const options = {
    body: data.body,
    icon: iconUrl,
    badge: '/logo.png',
    vibrate: [300, 100, 300, 100, 300], // Vibração insistente
    tag: 'new-order', // Tag para agrupar e atualizar notificações
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/admin'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // If so, just focus it.
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, then open the target URL in a new window/tab.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
