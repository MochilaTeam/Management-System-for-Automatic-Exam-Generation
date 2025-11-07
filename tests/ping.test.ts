import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../app/app"; // importa TU app sin levantar servidor

describe("Ping", () => {
  it('GET /ping -> { "message": "pong" }', async () => {
    const res = await request(app)
      .get("/ping")
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(res.body).toEqual({ message: "pong" });
  });
});
