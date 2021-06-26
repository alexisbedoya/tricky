///mongodb+srv://admin:DZYfMfEOAvo9ZEXR@cluster0.nvry9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority


const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const cors = require('cors');

const corsOptions = {
    origin: 'http://localhost:3000',
    credentials:true,
    optionSuccessStatus: 200

}

app.use(cors(corsOptions));

const bodyParser = require('body-parser');

var jsonParser = bodyParser.json();


//Configuracion de mongodb
const mongoose = require('mongoose');
const mongodb = "mongodb+srv://admin:DZYfMfEOAvo9ZEXR@cluster0.nvry9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
//conexion db
mongoose.connect(mongodb,{
    useNewUrlParser: true,
    useUnifiedTopology: true

}).then(()=>console.log('DataBase Connected'))
.catch(err => console.log('Error connecting database', err));

mongoose.set('useNewUrlParser',true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const Room = require('./models/Room');


//post request to join room
app.post('/join_room', jsonParser, async (req, res) => {
    // console.log('req reciveed', req.body);

    //check if the room which this exist or not
    const room_id = req.body.room_id;
    const oyo_room = await Room.findOne({ uID: room_id })
        .catch((err) => {
            console.log('error occured while checking room',err)
        });

    // console.log('room' ,oyo_room);
    flag = false;
    if (oyo_room) {
        // check if room has less than 2 user
        if (oyo_room.noOfUser < 2) {

            // increase no of user
            oyo_room.noOfUser++;
            const doc = await oyo_room.save();

            res.status(200).json({doc});
        } else {
            //Room is full
            res.status(200).json({ err: "Room is Full can't join " })
        }
    } else {
        res.status(200).json({ err: "Enter Valid Room ID"})
    }

})

app.get('/create_room', (req, res) => {

    //Generating unique id for each room
    var alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g',
        'h', 'i', 'j', 'k', 'l', 'm', 'n',
        'o', 'p', 'q', 'r', 's', 't', 'u',
        'v', 'w', 'x', 'y', 'z'];

    let result = "";
    for (let index = 0; index < 5; index++) {
        result += alphabet[Math.floor(Math.random() * 10000) % 25];
    }

    //Saving newly creted roomt to database
    const room = new Room({ uID: result, noOfUser: 1 });
    room.save().then(() => {
        console.log('room created', result);
    }).catch((err) => {
        console.log('err creating room',err);
    })
    
    res.json(result);
})

//Sample Request
app.get("/", (req, res) => {
    res.send({ message: "We did it!" });
});

//Open Socket io Connection
io.on('connection', (socket) => {

    // user join register room_id 
    socket.on('join' , async room_id=>{
        console.log('user joined' , room_id);
        socket.join(room_id);

        const oyo_room = await Room.findOne({ uID: room_id })
        .catch((err) => {
            console.log('error occured while checking room',err)
        });

        if ( oyo_room && oyo_room.noOfUser === 2 ) {
            io.to(room_id).emit('youCanPLayNow');
        }
    })


    socket.on('squareClicked' , ( {i , name , user_id , room_id} )=>{
        const click = {
			i,
			name,
            user_id,
            room_id,
		};
        console.log(`${name} clicked ${i} square in room ${room_id}`);
        io.to(room_id).emit('squareClickedReceived' , click );
    })

    socket.on('playAgain' , room_id=>{
        io.to(room_id).emit('playAgainReceived');
    })
})


//Start Up Server 
const PORT = process.env.PORT || 8000;
http.listen(PORT, () => {
    console.log('Backend Server listing at PORT:', PORT);
})