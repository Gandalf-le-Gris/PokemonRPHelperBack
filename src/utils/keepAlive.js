function keepAlive(wss) {
	setInterval(
		() =>
			wss.clients.forEach((ws) => {
				if (ws.isAlive === false) {
					return ws.terminate();
				}
				ws.isAlive = false;
				ws.send(JSON.stringify({ event: 'ping' }));
			}),
		30_000,
	);
}

function heartbeat(ws) {
	ws.isAlive = true;
}

module.exports = { keepAlive, heartbeat };
