import { once } from "node:events";
import { createServer, type AddressInfo, type Socket } from "node:net";
import { hostname } from "node:os";

import nodemailer from "nodemailer";
import { expect, it, vi } from "vitest";

import type { DbOrTx } from "@/server/db";
import { smtpRoutesFor } from "@/server/mail/mailer";

vi.mock("@/server/config/config", async (original) => ({
  ...await original<typeof import("@/server/config/config")>(),
  coreConfig: async () => ({ int: () => 0 }),
}));

it("a relay accepts the PHP machine name and rejects nodemailer's localhost EHLO", async () => {
  const query = {
    innerJoin: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    executeTakeFirst: async () => ({ id: 10, email_id: 7, host: "smtp.example.com", port: 587, encryption: "AUTO", auth_bk: "none", active: 1, allow_spoofing: 0, address: "maintenance@example.com", name: "Maintenance" }),
  };
  const executor = { selectFrom: () => query } as unknown as DbOrTx;
  const routes = await smtpRoutesFor({ email_id: 7, email: "maintenance@example.com", name: "Maintenance" }, executor);
  const sockets = new Set<Socket>();
  let greeting = "";
  const relay = createServer((socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    socket.write("220 test relay\r\n");
    let buffer = "";
    socket.on("data", (chunk) => {
      buffer += chunk.toString();
      let end: number;
      while ((end = buffer.indexOf("\r\n")) >= 0) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        if (line.startsWith("EHLO ")) {
          greeting = line.slice(5);
          socket.write(greeting === hostname() ? "250 test relay\r\n" : "501 Invalid EHLO hostname\r\n");
        } else if (line === "QUIT") socket.end("221 Bye\r\n");
        else socket.write("500 Unexpected SMTP command\r\n");
      }
    });
  });
  relay.listen(0, "127.0.0.1");
  await once(relay, "listening");
  const transport = nodemailer.createTransport({ ...routes[0].transport, host: "127.0.0.1", port: (relay.address() as AddressInfo).port, connectionTimeout: 1000, greetingTimeout: 1000 });
  try {
    expect(await transport.verify()).toBe(true);
    expect(greeting).toBe(hostname());
  } finally {
    transport.close();
    for (const socket of sockets) socket.destroy();
    await new Promise<void>((resolve) => relay.close(() => resolve()));
  }
});
