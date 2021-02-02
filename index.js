var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const admin = require('firebase-admin');
const { MongoClient } = require('mongodb');

let responses = [];

main();

async function main() {


    io.on('connection', (socket) => {
        console.log('a user connected');
        socket.on('disconnect', () => {
            console.log('user disconnected');
        });

        const gameResult = function () {

            let [player1, choice1] = responses[0];
            let [player2, choice2] = responses[1];


            if (choice1 === choice2) {
                return "draw"
            }
            else if (choice1 === "paper") {
                if (choice2 === "scissors") {
                    return "p2"
                }
                else {
                    return "p1"
                }
            }
            else if (choice1 === "rock") {
                if (choice2 === "paper") {
                    return "p2"
                }
                else {
                    return "p1"
                }
            }
            else if (choice1 === "scissors") {
                if (choice2 === "rock") {
                    return "p2"
                }
                else {
                    return "p1"
                }
            }
        }

        const saveGame = async (game) => {

            const uri = "mongodb+srv://FrancisJames:FRrxL6MKDeFgewjP@cluster0.114q2.mongodb.net/Cluster0?retryWrites=true&w=majority";
            const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

            try {

                await client.connect();

                await client.db('RockPaperScissors').collection('Games').insertOne(game);

            } catch (e) {
                console.error(e);

                // switch (e) {

                //     case 'ETIMEDOUT':
                //         saveGame(game);
                //         break;
                // }
            }
            finally {
                console.log('Successfully saved game');
                //client.close();
            }
        }

        const updateLeaderboard = async () => {

            let player1 = responses[0][0];
            let player2 = responses[1][0];

            let winner = gameResult();

            const uri = "mongodb+srv://FrancisJames:FRrxL6MKDeFgewjP@cluster0.114q2.mongodb.net/Cluster0?retryWrites=true&w=majority";
            const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

            try {
                await client.connect();


                let p1 = await client.db('RockPaperScissors').collection('Players').countDocuments({ 'name': player1 });
                let p2 = await client.db('RockPaperScissors').collection('Players').countDocuments({ 'name': player2 });

                if (p1 === 0) {

                    let p1_object = {
                        name: player1,
                        win: 0,
                        loss: 0,
                        draw: 0
                    }

                    await client.db('RockPaperScissors').collection('Players').insertOne(p1_object);
                }

                if (p2 === 0) {

                    let p1_object = {
                        name: player2,
                        win: 0,
                        loss: 0,
                        draw: 0
                    }

                    await client.db('RockPaperScissors').collection('Players').insertOne(p1_object);
                }

                switch (winner) {
                    case 'draw':
                        await client.db('RockPaperScissors').collection('Players').updateOne({ name: player1 }, {
                            $inc: { draw: 1 }
                        });
                        await client.db('RockPaperScissors').collection('Players').updateOne({ name: player2 }, {
                            $inc: { draw: 1 }
                        });
                        break;
                    case 'p1':
                        await client.db('RockPaperScissors').collection('Players').updateOne({ name: player1 }, {
                            $inc: { win: 1 }
                        });
                        await client.db('RockPaperScissors').collection('Players').updateOne({ name: player2 }, {
                            $inc: { loss: 1 }
                        });
                        break;
                    case 'p2':
                        await client.db('RockPaperScissors').collection('Players').updateOne({ name: player1 }, {
                            $inc: { loss: 1 }
                        });
                        await client.db('RockPaperScissors').collection('Players').updateOne({ name: player2 }, {
                            $inc: { win: 1 }
                        });
                        break;
                    default:
                        console.log("leader board saving error");
                }

            }
            catch (e) {

                console.error(e);

                // switch (e) {

                //     case 'ETIMEDOUT':
                //         updateLeaderboard();
                //         break;
                // }

            }
            finally {
                console.log('Successfully updated leaderboard');
                //client.close();
            }
        }

        const showLB = async () =>{
            const uri = "mongodb+srv://FrancisJames:FRrxL6MKDeFgewjP@cluster0.114q2.mongodb.net/Cluster0?retryWrites=true&w=majority";
            const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

            try{
                await client.connect();

                let LB = await client.db('RockPaperScissors').collection('Players').find().toArray();
    
                let LBarr = [];
                LB.forEach((player) =>{

                    let {win, loss} = player;
                    LBarr.push([(win-loss), player]);
                })

                LBarr = LBarr.sort((acc,cur) => cur[0] - acc[0]);

                console.log("------------------Leader Board------------------");
                LBarr.forEach(([points, {name, win, loss, draw}]) =>{  
                    console.log(`${name}: ${points} points (${win} wins, ${loss} losses, ${draw} draws)`);
                })
                console.log('------------------------------------------------');

            }
            catch(e){
                console.log(e);
            }
            finally{
                //client.close();
            }
            
        }


        let eventName = 'response';

        socket.on(eventName, (data) => {
            responses.push(data);

            if (responses.length === 2) {
                let winner = gameResult();

                io.sockets.emit("output", [responses, winner]);


                let [player1, choice1] = responses[0];
                let [player2, choice2] = responses[1];

                let game = {
                    'player1': player1,
                    'player2': player2,
                    player_1_guess: choice1,
                    player_2_guess: choice2,
                    timestamp: Date.now()
                };

                saveGame(game);
                updateLeaderboard(game);
                showLB();
                responses = [];

            }

        });
    });
}



http.listen(3000, () => {
    console.log('listening on *:3000');
});
