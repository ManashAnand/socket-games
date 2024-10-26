import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer(handler);

    const io = new Server(httpServer);
    let count = 0

    const players = new Set();
    let currentPlayer = null;
    let lastFace = null;

    io.on("connection", (socket) => {

        players.add(socket.id);

        if (players.size === 1) {
            currentPlayer = socket.id;
        }

        socket.on('gamePrep', () => {
            console.log("gameprep working from server")
            console.log(Array.from(players).length)
            let TotalPlayer = Array.from(players).length
            if (TotalPlayer % 2 == 0) io.emit('getTotalPlayer', Array.from(players).length)
            else io.emit('getTotalPlayer', Array.from(players).length - 1)
        })
        // ...
        io.emit('gameState', { currentPlayer, lastFace });
        count++;
        console.log("New user connected y" + count)

        socket.on('event', (msg) => console.log(msg))



        socket.on("disconnect", () => {
            players.delete(socket.id);
            if (players.size === 0) {
                currentPlayer = null;
                lastFace = null;
            } else if (currentPlayer === socket.id) {
                currentPlayer = players.values().next().value;
                io.emit('gameState', { currentPlayer, lastFace });
            }
        });

    });

    httpServer
        .once("error", (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
});