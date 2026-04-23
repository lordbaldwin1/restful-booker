import { expect, test } from "@playwright/test";

test.describe("Ping API tests", () => {
  test("GET - API is up and running", async ({ request }) => {
    const response = await request.get("/ping");

    expect(response.status()).toBe(201);
  });
});