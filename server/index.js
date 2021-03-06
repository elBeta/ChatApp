require('dotenv').config()

const express = require('express')
const app = express()
const http = require('http')
const cors = require('cors')

const {getUser,getUsersInRoom,users,addUser,removeUser} = require('./controllers/users')

const server = http.createServer(app)

const io = require('socket.io')(server)

io.on('connection', socket => {
    console.log('client connected!');
      
    socket.on('join',({name,room},cb)=>{
        socket.join(room)   
        // console.log(user);

        const {error,user} = addUser({id:socket.id,name,room})
        

        if(error){
            cb(error)
        }

        socket.emit('serverMessage','Welcome')
        socket.broadcast.to(room).emit('serverMessage',`${name} joined room`)

        io.to(room).emit('roomData',{
            room:room,
            users:getUsersInRoom(room)
        })

        cb()
    })
    
    socket.on('sendMessage',(message,cb)=>{
        const {error,user} = getUser({id:socket.id})

        if(error){
            return cb(error)
        }

        name = user['name']

        io.to(user.room).emit('message',{message,name})
  
        cb()
    })

    socket.on('sendLocation',({latitude,longitude},cb)=>{
        const {error,user} = getUser({id:socket.id})

        if(error){
            return cb(error)
        }

        name = user['name']
        console.log(name,latitude,longitude);
                
        const message = `https://google.com/maps?q=${latitude},${longitude}`

        const locationUrl=true

        io.to(user.room).emit('message',{message,name,locationUrl})

        cb()
    })

    socket.on('disconnect',()=>{
        const {error,user} = removeUser({id:socket.id})
        if(error){
            return console.log(error);
        }
        if(user){
            io.to(user.room).emit('serverMessage',`${user.name} left`)
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }
    })
})


app.get('/',(req,res)=>res.send('server\'s running test successful'))
app.use(cors())

if(process.env.NODE_ENV === 'production'){
    app.use(express.static('../client/build'))

    app.get('*',(req,res) =>{
        res.sendFile(path.resolve(__dirname,'..','client','build','index.html'))
    })          
}

const port = process.env.PORT || 8080   
server.listen(port,()=>console.log(`server\' up @${port}`))

