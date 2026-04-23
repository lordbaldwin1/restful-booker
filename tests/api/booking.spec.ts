import { expect, test } from "@playwright/test";


test.describe("Booking API tests", () => {
  test("GET - should retrieve list of bookings", async ({ request }) => {
    const response = await request.get("/booking");
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(50);
    expect(data[0]).toHaveProperty("bookingid");
  });
});