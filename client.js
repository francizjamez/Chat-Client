const io = require("socket.io-client");
const readline = require('readline');
const { response } = require("express");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Enter your username:', (name) => {

    console.log(`Welcome ${name}`);

    const socket = io('http://localhost:3000');
    let eventName = "response";

    let play = function () {
        rl.question("(R)ock, (P)aper or (S)cissors?", (choice) => {
            
            switch(choice){
                case "p": choice = "paper";break;
                case "s": choice = "scissors";break;
                case "r": choice = "rock";break;
            }
            console.log(`You chose ${choice}`);
            console.log(`Waiting for response`);
            socket.emit(eventName, [name, choice]);
        })
    }

    socket.on('connect', () => {
        console.log("Connected to server");
        play();
    });

    socket.on('disconnect', () => {
        console.log("Disconnected from server")
    })

    socket.on("output", ([responses, output]) => {

        let enemy = responses[0][0] === name ? responses[1] : responses[0];


        switch (output) {
            case "draw":
                console.log(`${enemy[0]} chose ${enemy[1]} - ${output}`); break;
            case "p1":
                if (responses[0][0] === name) {
                    console.log(`${enemy[0]} chose ${enemy[1]} - You win`);
                }
                else{
                    console.log(`${enemy[0]} chose ${enemy[1]} - You lose`);
                }
                break;
            case "p2":
                if (responses[0][0] === name) {
                    console.log(`${enemy[0]} chose ${enemy[1]} - You lose`);
                }
                else{
                    console.log(`${enemy[0]} chose ${enemy[1]} - You win`);
                }
                break;
        }
        play();
    });
});
