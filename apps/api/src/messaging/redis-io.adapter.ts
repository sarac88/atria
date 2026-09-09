import { IoAdapter } from "@nestjs/platform-socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import type { Server, ServerOptions } from "socket.io";

/** Socket.IO adapter backed by Redis pub/sub for horizontal scaling (doc §7). */
export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor?: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    // Redis sólo sirve para propagar el pub/sub entre varias instancias de la
    // API. Con una sola no aporta nada, así que sin REDIS_URL se deja el
    // adaptador en memoria de Socket.IO (createIOServer no aplica ninguno).
    const url = process.env.REDIS_URL;
    if (!url) return;

    const pubClient = new Redis(url);
    const subClient = pubClient.duplicate();
    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server: Server = super.createIOServer(port, options);
    if (this.adapterConstructor) server.adapter(this.adapterConstructor);
    return server;
  }
}
