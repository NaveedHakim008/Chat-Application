const express=require('express')
const path=require('path')
const http=require('http')
const socket=require('socket.io')
const publicDirectory=path.join(__dirname,'../public')
const Filter=require('bad-words')
const {generateMessage,generateLocationMessage} =require('./utils/message')
const {addUser,removeUser,getUser,getUsersInRoom}=require('./utils/users')
const app=express()


const server=http.createServer(app)
const io=socket(server)




app.use(express.static(publicDirectory))
io.on('connection',(socket)=> {
    console.log('New WebSocket Connection')

    socket.on('join', ({username, room}, callback) => {

        const {error, user} = addUser({id: socket.id, username, room})
        console.log(user)
        console.log(error)
        if (error) {
            console.log(error)
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', generateMessage('Admin', 'Welcome !'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        console.log(socket.id)
        const User = getUser(socket.id)
        console.log(User)

        const filter = new Filter()
        if (filter.isProfane(message)) {
            return callback('Profane language is not allowed')

        }
        io.to(User.room).emit('receiveMessage', generateMessage(User.username, message))
        callback()
    })
    socket.on('sendLocationToServer', ({latitude, longitude}, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('sendLocationToClient', generateLocationMessage(user.username, `https://google.com/maps?q=${latitude},${longitude}`))
        callback()
    })
    // socket.emit('countUpdated', coun)t)

    // socket.on('increment', () => {
    //     count = count + 1
    //    // socket.emit('countUpdated',count)//emits to a single connection
    //     io.emit('countUpdated', count)//emits to all connection
    // })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left `))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }


    })

})

server.listen(3000,()=>{
    console.log('server is running')
})