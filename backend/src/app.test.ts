import { app } from "./app.js";
import supertest from "supertest";

const testVideoId = "eio1ezE80Gc";

describe("Test Metadata Route", () => {
  it("Should return a valid metadata structure", async () => {
    const res = await supertest(app).get(`/api/video/metadata/${testVideoId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(testVideoId);
    expect(res.body.downloadOptions.video.length).toBeGreaterThan(0);
    expect(res.body.downloadOptions.audio.length).toBeGreaterThan(0);
  });
  it("Should return message if invalid video ID", async () => {
    const res = await supertest(app).get("/api/video/metadata/invalid-id");
    expect(res.status).toBe(500);
    expect(res.body.debugMessage).toBeDefined();
  });
});

describe("Test Stream Route", () => {
  it("Should return a valid stream", async () => {
    const res = await supertest(app)
      .get(`/api/video/stream/${testVideoId}`)
      .set("range", "bytes=0-100")
      .expect(206);
    expect(res.headers["content-type"]).toBe("video/mp4");
    expect(res.headers["accept-ranges"]).toBe("bytes");
    expect(res.headers["content-range"]).toBeDefined();
  });
  it("Should return message if invalid video ID", async () => {
    const res = await supertest(app).get("/api/video/metadata/invalid-id");
    expect(res.status).toBe(500);
    expect(res.body.debugMessage).toBeDefined();
  });
});
