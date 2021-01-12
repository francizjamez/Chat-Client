const io = require("socket.io-client");
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin,  output: process.stdout });

rl.question('Enter your username:', (name) => {

    console.log(`Welcome ${name}`);
    
    const socket = io('http://localhost:3000');
    let eventName = "simple chat message";

    let chat = function(){
        rl.question("> ", (msg) =>{
            console.log(`Sending message: ${msg}`);
            socket.emit(eventName, `${name}: ${msg}`);
            chat();
        })
    }

    socket.on('connect',  () =>{
        console.log("Connected to server");
        chat();
    });

    socket.on('disconnect', () => {
        console.log("Disconnected from server")
    })

    socket.on(eventName, msg => {
        console.log(msg);
        chat();
    });
});
