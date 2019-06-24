const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');

const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

const {
    generateMessage,
    generateLocationMessage
} = require('./utils/messages');

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
    console.log('New WebSockey Connection');

    socket.on('sendMsg', (msg, callback) => {

        const user = getUser(socket.id);

        const filter = new Filter();
        if (filter.isProfane(msg)) {
            return callback('Profenity is not allowed!!');
        }
        io.to(user.room).emit('message', generateMessage(user.username,  msg));
        callback('delivered!!!');
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if(user){
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!` ));
            io.to(user.room).emit('roomData', {
                room:user.room,
                users:getUsersInRoom(user.room)
            });
        }
    });
    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id);
        io.emit('locationMessage', generateLocationMessage(user.username, `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`));
        return callback();
    });

    socket.on('join', (options, callback) => {
        const {
            error,
            user
        } = addUser({
            id: socket.id,
            ...options
        });
        if (error) {
            return callback(error);
        }
        socket.join(user.room);
        socket.emit('message', generateMessage('Admin', 'Welcome'));
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`));
        
        io.to(user.room).emit('roomData', {
            room:user.room,
            users:getUsersInRoom(user.room)
        });
        callback();
    });
});

server.listen(port, () => {
    console.log(`Servier is on port ${port}`);
});