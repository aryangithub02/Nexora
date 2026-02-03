import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        
        if (req.url?.startsWith("/socket.io")) {
            return;
        }
        handler(req, res);
    });

    const io = new Server(httpServer, {
        cors: {
            origin: "*", 
            methods: ["GET", "POST"]
        }
    });

    (global as any).io = io;

    io.on("connection", (socket) => {

        const userId = socket.handshake.query.userId as string;
        if (userId) {
            socket.join(`user_${userId}`);
            
        }

        socket.on("disconnect", () => {
            
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
