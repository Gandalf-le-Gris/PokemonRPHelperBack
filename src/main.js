const WebSocketServer = require('ws');
const { roomService } = require('./services/instances/roomService.instance');

const wss = new WebSocketServer.Server({ port: 8080 });

wss.on('listening', () => console.log('Listening on port 8080'));

wss.on('connection', ws => {
  console.log('New connection');
  ws.send(JSON.stringify({ event: 'connected' }));
  ws.onmessage = ev => onMessage(ev, ws);
});

function onMessage(ev, ws) {
  const data = JSON.parse(ev.data);
  let room;
  switch (data.event) {
    case 'create-room':
      ws.send(JSON.stringify({
        event: 'post-room',
        room: roomService.createRoom()
      }));
      break;
    case 'get-room':
      room = roomService.getRoom(data.uuid);
      if (room) {
        ws.send(JSON.stringify({
          event: 'post-room',
          room
        }));
      } else {
        sendError(ws, 'Salle inexistante');
      }
      break;
    case 'close-room':
      roomService.closeRoom(data.uuid);
      break;
    default:
      console.log('Uncaught message:', data);
  }
}

function sendError(ws, message) {
  ws.send(JSON.stringify({
    event: 'error',
    message
  }))
}
