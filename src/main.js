const WebSocketServer = require('ws');
const { roomService } = require('./services/instances/roomService.instance');
const { keepAlive, heartbeat } = require('./utils/keepAlive');

const port = process.env.PORT || 3001
const wss = new WebSocketServer.Server({ port });

const channels = {};

wss.on('listening', () => console.log(`Listening on port ${port}`));

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
      room = roomService.createRoom();
      channels[room.uuid] = [ws];
      ws.send(JSON.stringify({
        event: 'post-room',
        room
      }));
      break;
    case 'get-room':
      room = roomService.getRoom(data.uuid);
      if (room) {
        if (channels[data.uuid] && !channels[data.uuid].includes(ws)) {
          channels[data.uuid].push(ws);
        }
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
    case 'regenerate-room':
      room = roomService.regenerateRoom(data.uuid, data.options);
      channels[data.uuid].forEach(ws => ws.send(JSON.stringify({
        event: 'post-room',
        room
      })));
      break;
    case 'add-character':
      roomService.addCharacter(data.uuid, data.character, data.isPlayer);
      channels[data.uuid].forEach(ws => ws.send(JSON.stringify({
        event: 'post-room',
        room: roomService.getRoom(data.uuid)
      })));
      break;
    case 'update-character':
      roomService.updateCharacter(data.uuid, data.character);
      channels[data.uuid].forEach(ws => ws.send(JSON.stringify({
        event: 'post-room',
        room: roomService.getRoom(data.uuid)
      })));
      break;
    case 'remove-character':
      roomService.removeCharacter(data.uuid, data.character);
      channels[data.uuid].forEach(ws => ws.send(JSON.stringify({
        event: 'post-room',
        room: roomService.getRoom(data.uuid)
      })));
      break;
    case 'update-initiative':
      roomService.updateInitiative(data.uuid, data.initiativeList, data.activeCharacter);
      channels[data.uuid].forEach(ws => ws.send(JSON.stringify({
        event: 'post-room',
        room: roomService.getRoom(data.uuid)
      })));
      break;
    case 'pong':
      heartbeat(ws);
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

const interval = keepAlive(wss);
wss.on("close", () => clearInterval(interval));
