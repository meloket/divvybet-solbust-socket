import express from 'express';
import http from 'http';
import cors from 'cors';
import redis from 'redis';
import { Server } from 'socket.io';
import { REDIS_CONFIG } from "./constants";

const keccak256 = require('keccak256')
const subscriber = redis.createClient(REDIS_CONFIG);
const redisClient = redis.createClient(REDIS_CONFIG);
const app = express();

let chatHistory = [];

app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.get('/', (req, res) => {
  res.send('<h1>Weclome to divvy</h1>');
});

const arr = [];
io.on('connection', async (socket) => {
    console.log("Connection Established", chatHistory.length);
    // arr.push(socket.id);
    // console.log(arr);
    let data;
    redisClient.get("game-data", (err, reply) => {
      data = JSON.parse(reply);
      socket.emit("data", data)
    });
    socket.on("get-msgs", () => {
      let arr = [ ...chatHistory ];
      socket.emit("all-msgs", arr);
    })

    socket.on("new message", msg => {
      // console.log(msg);
      io.emit("msg", msg);
      if(chatHistory.length > 99) {
          chatHistory.push(msg);
          chatHistory.shift();
      } else {
        chatHistory.push(msg);
      }
    })

    socket.on('disconnect', () => {
    console.log('user disconnected');
  });
})


subscriber.on("message", (channel, message) => {
  console.log(message);
  const data = JSON.parse(message);
  io.emit("data", data);
})

server.listen(8080, () => {
  subscriber.subscribe("new-game");
  console.log('listening on http://localhost');
});
