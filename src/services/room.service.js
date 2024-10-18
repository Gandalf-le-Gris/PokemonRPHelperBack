class RoomService {
  rooms = {};

  createRoom = () => {
    let uuid;
    do {
      uuid = String(Math.floor(Math.random() * 1_000_000));
      while (uuid.length < 6) {
        uuid = '0' + uuid;
      }
    } while (Object.keys(this.rooms).includes(uuid));

    const room = {
      uuid,
      map: this.generateMap({ size: 15, difficulty: 3, crammed: 3 }),
      environment: 'ForestPath',
      characters: [],
      timeout: this.setRoomTimeout(uuid),
      initiativeList: [],
    };

    this.rooms[uuid] = room;
    return room;
  }

  regenerateRoom = (uuid, options) => {
    this.rooms[uuid].environment = options.environment;
    this.rooms[uuid].map = this.generateMap(options);
    this.editRoom(this.rooms[uuid]);
    return this.rooms[uuid];
  }

  closeRoom = (uuid) => {
    delete this.rooms[uuid];
  }

  editRoom = (room) => {
    clearTimeout(room.timeout);
    this.setRoomTimeout(room.uuid);
    this.rooms[room.uuid] = room;
  }

  getRoom = (uuid) => {
    return this.rooms[uuid];
  }

  setRoomTimeout = (uuid) => {
    return Number(setTimeout(() => this.closeRoom(uuid), 1000 * 60 * 60 * 24));
  }

  generateMap = (options) => {
    let res = [];
    const width = options.size;
    const height = Math.floor(options.size / 1.5);
    for (let i = 0; i < height; i++) {
      res.push([]);
      for (let j = 0; j < width; j++) {
        if (isEdge(i, j, height, width)) {
          res[i].push({
            terrain: Math.random() < .95 || isCorner(i, j, height, width) ? 'w' : 'p'
          });
        } else {
          res[i].push({
            terrain: 'p'
          });
        }
      }
    }
    let i;
    let j;
    let w = 20;
    for (let k = 0; k < width * 1000; k++) {
      i = 1 + Math.floor(Math.random() * (height - 2));
      j = 1 + Math.floor(Math.random() * (width - 2));
      if (Math.random() < options.crammed / (200 * w) * (1 + 100 * countSimilarNeighbors(res, i, j, 'w'))) {
        res[i][j].terrain = 'w';
        w += 1;
      }
      if (Math.random() < options.difficulty / 8000) {
        res[i][j].terrain = 's';
        let c = .15;
        while (Math.random() < 1 - c) {
          [i, j] = getRandomNeighbor(i, j, height, width);
          res[i][j].terrain = 's';
          c += .15;
        }
      }
    }
    return res;
  }
  
  addCharacter = (uuid, character, isPlayer) => {
    const room = this.getRoom(uuid);
    let n = 0;
    let i;
    let j;
    do {
      i = Math.floor(Math.random() * room.map.length);
      j = Math.floor(Math.random() * room.map[0].length);
    } while ((room.map[i][j].terrain !== 'p' || room.characters.some(c => c.i === i && c.j === j)) && n < 100000);
    room.characters.push({
      i,
      j,
      character,
      isPlayer
    });
    room.initiativeList.push(character.uuid);
    this.editRoom(this.rooms[uuid]);
  }

  updateCharacter = (uuid, character) => {
    const room = this.getRoom(uuid);
    if (room.characters.some(c => c.i === character.i && c.j === character.j)) {
      return;
    }
    const index = room.characters.findIndex(e => e.character.uuid === character.character.uuid);
    if (index >= 0) {
      room.characters[index] = character;
    }
    this.editRoom(this.rooms[uuid]);
  }

  removeCharacter = (uuid, characterId) => {
    const room = this.getRoom(uuid);
    const index = room.characters.findIndex(e => e.character.uuid === characterId);
    if (index >= 0) {
      room.characters.splice(index, 1);
      room.initiativeList.splice(room.initiativeList.findIndex(e => e === characterId), 1);
      if (room.activeCharacter === characterId) {
        room.activeCharacter = undefined;
      }
    }
    this.editRoom(this.rooms[uuid]);
  }

  updateInitiative = (uuid, list, active) => {
    const room = this.getRoom(uuid);
    room.initiativeList = list;
    room.activeCharacter = active;
    this.editRoom(this.rooms[uuid]);
  }

  updateEnvironment = (uuid, environment) => {
    const room = this.getRoom(uuid);
    room.environment = environment;
    this.editRoom(this.rooms[uuid]);
  }

  updateTerrain = (uuid, i, j, tile) => {
    const room = this.getRoom(uuid);
    room.map[i][j] = tile;
    this.editRoom(this.rooms[uuid]);
  }
}

function countSimilarNeighbors(map, i, j, type) {
  return map[i - 1][j].terrain === type
    + map[i + 1][j].terrain === type
    + map[i][j - 1].terrain === type
    + map[i][j + 1].terrain === type
}

function isEdge(i, j, height, width) {
  return i == 0 || i == height - 1 || j == 0 || j == width - 1;
}

function isCorner(i, j, height, width) {
  return i == 0 && j == 0
    || i == height - 1 && j ==0
    || i == 0 && j == width - 1
    || i == height - 1 && j == width - 1;
}

function getRandomNeighbor(i, j, height, width) {
  switch(Math.floor(Math.random() * 4)) {
    case 0:
      return [i > 1 ? i - 1 : i, j];
    case 1:
      return [i < height - 2 ? i + 1 : i, j];
    case 2:
      return [i, j > 1 ? j - 1 : j];
    case 3:
      return [i, j < width - 2 ? j + 1 : j];
    default:
      return [i, j];
  }
}

module.exports = { RoomService };
