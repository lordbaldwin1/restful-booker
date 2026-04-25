import { APIRequestContext, expect, test as base } from "@playwright/test";

type Booking = {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: {
    checkin: string;
    checkout: string;
  };
  additionalneeds: string;
};

type BookingTestFixture = {
  testData: Booking;
};

const testBooking: Booking = {
  firstname: "zachary",
  lastname: "tester",
  totalprice: 549,
  depositpaid: true,
  bookingdates: {
    checkin: "2025-01-01",
    checkout: "2026-01-01",
  },
  additionalneeds: "Breakfast",
};

const updateBooking: Booking = {
  firstname: "test",
  lastname: "tester",
  totalprice: 333,
  depositpaid: false,
  bookingdates: {
    checkin: "2024-02-02",
    checkout: "2025-02-02",
  },
  additionalneeds: "Dinner",
};

const test = base.extend<BookingTestFixture>({
  testData: async ({ }, use) => {
    await use(testBooking);
  },
});

test.describe("Booking API tests", () => {
  test("GET - should retrieve list of bookings", async ({ request }) => {
    const response = await request.get("/booking");
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(50);
    expect(data[0]).toHaveProperty("bookingid");
  });

  test("GET - booking id returns booking information", async ({ request, testData }) => {
    const testBooking = await createBooking(testData, request);
    const response = await request.get(`/booking/${testBooking.bookingid}`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("firstname");
    expect(data).toHaveProperty("lastname");
    expect(data).toHaveProperty("totalprice");
    expect(data).toHaveProperty("depositpaid");
    expect(data).toHaveProperty("bookingdates");
    expect(data).toHaveProperty("additionalneeds");

    const bookingDates = data.bookingdates;
    expect(bookingDates).toHaveProperty("checkin");
    expect(bookingDates).toHaveProperty("checkout");
  });

  test("POST - add a new booking with all required fields", async ({ request, testData }) => {
    const response = await request.post("https://restful-booker.herokuapp.com/booking", {
      data: testData,
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("bookingid");
  });

  test("PUT - Updating booking changes all fields", async ({ request, testData }) => {
    const authResponse = await request.post("/auth", {
      data: {
        username: "admin",
        password: "password123",
      },
    });
    expect(authResponse.status()).toBe(200);
    const { token } = await authResponse.json();

    const testBooking = await createBooking(testData, request);
    const response = await request.put(`/booking/${testBooking.bookingid}`, {
      headers: {
        "Cookie": `token=${token}`,
      },
      data: updateBooking,
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toEqual(updateBooking);
  });

  test("PATCH - Updating name changes only name", async ({ request, testData }) => {
    const authRes = await request.post("/auth", {
      data: {
        username: "admin",
        password: "password123",
      },
    });
    const { token } = await authRes.json();

    const testBooking = await createBooking(testData, request);
    const response = await request.patch(`/booking/${testBooking.bookingid}`, {
      headers: {
        "Cookie": `token=${token}`,
      },
      data: {
        firstname: "patchedTest",
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.firstname).toBe("patchedTest");
    expect(data.lastname).toBe("tester");
    expect(data.totalprice).toBe(549);
    expect(data.depositpaid).toBe(true);
    expect(data.bookingdates.checkin).toBe("2025-01-01");
    expect(data.bookingdates.checkout).toBe("2026-01-01");
    expect(data.additionalneeds).toBe("Breakfast");
  })
});

async function createBooking(booking: Booking, request: APIRequestContext) {
  const response = await request.post("/booking", {
    data: booking,
  });

  return await response.json();
}