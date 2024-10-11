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
      map: this.generateMap(),
      timeout: this.setRoomTimeout(uuid),
    };

    this.rooms[uuid] = room;
    return room;
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

  generateMap = () => {
    let res = [];
    for (let i = 0; i < 20; i++) {
      res.push([]);
      for (let j = 0; j < 20; j++) {
        res[i].push({
          terrain: 'grass'
        })
      }
    }
    return res;
  }
}

module.exports = { RoomService };
