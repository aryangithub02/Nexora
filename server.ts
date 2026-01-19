import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        // Explicitly ignore /socket.io requests to prevent Next.js from handling them (and 404ing)
        if (req.url?.startsWith("/socket.io")) {
            return;
        }
        handler(req, res);
    });

    const io = new Server(httpServer, {
        cors: {
            origin: "*", // Adjust for production
            methods: ["GET", "POST"]
        }
    });

    // Make io accessible globally for API routes
    (global as any).io = io;

    io.on("connection", (socket) => {
        // console.log("New client connected", socket.id);

        const userId = socket.handshake.query.userId as string;
        if (userId) {
            socket.join(`user_${userId}`);
            // console.log(`User ${userId} joined room user_${userId}`);
        }

        socket.on("disconnect", () => {
            // console.log("Client disconnected", socket.id);
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
