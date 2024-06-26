import express from 'express'
import { Server } from 'socket.io'
import http from 'http'
import router from './router.js'
import cors from 'cors'
import { addUser, removeUser, getUser, getUsersInRoom } from './users.js'

const PORT = process.env.PORT || 5000

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: '*'
    }
})

app.use(cors())

io.on('connection', (socket) => {

    socket.on('join', ({ name, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room })

        if(error) return callback(error)

        socket.emit('message', {user: 'admin', text: `${user.name}, Welcome to the room ${user.room}`})
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined..!!`})

        socket.join(user.room)

        io.to(user.room).emit('roomData', { room: user.room, user: getUsersInRoom(user.room) })

        callback()
    })
    
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('message', { user: user.name, text: message })
        io.to(user.room).emit('roomData', { room: user.room, user: getUsersInRoom(user.room) })

        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user) {
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left..` })
        }
    })
})

app.use(router)

server.listen(PORT, () => {
    console.log(`Server started at port no. ${PORT}`);
})