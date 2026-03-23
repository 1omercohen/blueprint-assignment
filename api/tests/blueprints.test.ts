import request from "supertest";
import createApp from "../src/app";
import { initTestDb, closeTestDb, truncateBlueprints } from "./helpers/db";
import { buildBlueprint } from "./helpers/fixtures";

const app = createApp();

beforeAll(async () => {
  await initTestDb();
});

afterAll(async () => {
  await closeTestDb();
});

beforeEach(async () => {
  await truncateBlueprints();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const createOne = (overrides = {}) =>
  request(app)
    .post("/blueprints")
    .send(buildBlueprint(overrides));

// ─── POST /blueprints ─────────────────────────────────────────────────────────

describe("POST /blueprints", () => {
  it("creates a blueprint and returns 201 with all fields", async () => {
    const payload = buildBlueprint();
    const res = await createOne();

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: payload.name,
      version: payload.version,
      author: payload.author,
      blueprint_data: payload.blueprint_data,
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.created_at).toBeDefined();
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(app)
      .post("/blueprints")
      .send(buildBlueprint({ name: "" }));

    expect(res.status).toBe(400);
  });

  it("returns 400 when required fields are absent", async () => {
    const res = await request(app).post("/blueprints").send({});

    expect(res.status).toBe(400);
  });
});

// ─── GET /blueprints/:id ──────────────────────────────────────────────────────

describe("GET /blueprints/:id", () => {
  it("returns the blueprint for a valid ID", async () => {
    const created = await createOne();
    const res = await request(app).get(`/blueprints/${created.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
    expect(res.body.name).toBe(created.body.name);
  });

  it("returns 404 for a non-existent ID", async () => {
    const res = await request(app).get("/blueprints/99999");

    expect(res.status).toBe(404);
  });

  it("returns 400 for a non-integer ID", async () => {
    const res = await request(app).get("/blueprints/abc");

    expect(res.status).toBe(400);
  });
});

// ─── PUT /blueprints/:id ──────────────────────────────────────────────────────

describe("PUT /blueprints/:id", () => {
  it("updates a blueprint and returns the updated fields", async () => {
    const created = await createOne();
    const res = await request(app)
      .put(`/blueprints/${created.body.id}`)
      .send({ version: "2.0.0" });

    expect(res.status).toBe(200);
    expect(res.body.version).toBe("2.0.0");
    expect(res.body.name).toBe(created.body.name);
  });

  it("returns 404 when updating a non-existent blueprint", async () => {
    const res = await request(app)
      .put("/blueprints/99999")
      .send({ version: "2.0.0" });

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /blueprints/:id ───────────────────────────────────────────────────

describe("DELETE /blueprints/:id", () => {
  it("deletes a blueprint and returns 204", async () => {
    const created = await createOne();
    const res = await request(app).delete(`/blueprints/${created.body.id}`);

    expect(res.status).toBe(204);
  });

  it("returns 404 after deleting the same blueprint twice", async () => {
    const created = await createOne();
    await request(app).delete(`/blueprints/${created.body.id}`);
    const res = await request(app).delete(`/blueprints/${created.body.id}`);

    expect(res.status).toBe(404);
  });

  it("returns 404 when deleting a non-existent blueprint", async () => {
    const res = await request(app).delete("/blueprints/99999");

    expect(res.status).toBe(404);
  });
});

// ─── GET /blueprints (pagination & sorting) ───────────────────────────────────

describe("GET /blueprints", () => {
  beforeEach(async () => {
    await createOne({ name: "alpha", version: "1.0.0" });
    await createOne({ name: "beta", version: "2.0.0" });
    await createOne({ name: "gamma", version: "3.0.0" });
  });

  it("returns a paginated list with correct structure", async () => {
    const res = await request(app).get("/blueprints");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toMatchObject({
      page: 1,
      page_size: 20,
      total_items: 3,
      total_pages: 1,
    });
  });

  it("respects page_size and page", async () => {
    const res = await request(app).get("/blueprints?page=1&page_size=2");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.total_items).toBe(3);
    expect(res.body.pagination.total_pages).toBe(2);
  });

  it("returns empty data on a page beyond total", async () => {
    const res = await request(app).get("/blueprints?page=99&page_size=10");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("sorts by name ASC", async () => {
    const res = await request(app).get(
      "/blueprints?sort_by=name&sort_order=ASC"
    );

    expect(res.status).toBe(200);
    const names = res.body.data.map((b: { name: string }) => b.name);
    expect(names).toEqual([...names].sort());
  });

  it("sorts by name DESC", async () => {
    const res = await request(app).get(
      "/blueprints?sort_by=name&sort_order=DESC"
    );

    expect(res.status).toBe(200);
    const names = res.body.data.map((b: { name: string }) => b.name);
    expect(names).toEqual([...names].sort().reverse());
  });

  it("returns 400 for invalid sort_by field", async () => {
    const res = await request(app).get("/blueprints?sort_by=invalid_field");

    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid page (zero)", async () => {
    const res = await request(app).get("/blueprints?page=0");

    expect(res.status).toBe(400);
  });

  it("returns 400 for page_size exceeding maximum", async () => {
    const res = await request(app).get("/blueprints?page_size=101");

    expect(res.status).toBe(400);
  });
});
