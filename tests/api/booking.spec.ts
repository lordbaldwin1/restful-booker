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

const testBookingsAfter2028: Booking[] = [
  {
    firstname: "alice",
    lastname: "future",
    totalprice: 1001,
    depositpaid: false,
    bookingdates: {
      checkin: "2028-01-05",
      checkout: "2028-01-10",
    },
    additionalneeds: "Late Checkout",
  },
  {
    firstname: "bob",
    lastname: "forward",
    totalprice: 888,
    depositpaid: true,
    bookingdates: {
      checkin: "2028-02-15",
      checkout: "2028-02-20",
    },
    additionalneeds: "Breakfast",
  },
  {
    firstname: "charlie",
    lastname: "tomorrow",
    totalprice: 567,
    depositpaid: false,
    bookingdates: {
      checkin: "2029-03-01",
      checkout: "2029-03-05",
    },
    additionalneeds: "Airport Pickup",
  },
  {
    firstname: "danielle",
    lastname: "time",
    totalprice: 321,
    depositpaid: true,
    bookingdates: {
      checkin: "2030-04-12",
      checkout: "2030-04-17",
    },
    additionalneeds: "Dinner",
  },
  {
    firstname: "edward",
    lastname: "futureman",
    totalprice: 754,
    depositpaid: true,
    bookingdates: {
      checkin: "2031-05-20",
      checkout: "2031-05-25",
    },
    additionalneeds: "Spa",
  },
];

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
  });

  test("DELETE - delete a booking returns 201, GET returns 404", async ({ request, testData }) => {
    const authRes = await request.post("/auth", {
      data: {
        username: "admin",
        password: "password123",
      },
    });
    const { token } = await authRes.json();
    const testBooking = await createBooking(testData, request);

    const response = await request.delete(`/booking/${testBooking.bookingid}`, {
      headers: { "Cookie": `token=${token}` },
    });
    expect(response.status()).toBe(201);

    const getRes = await request.get(`/booking/${testBooking.bookingid}`);
    expect(getRes.status()).toBe(404);
  });

  test("GET - filter for bookings with checkin after 2028", async ({ request }) => {
    const bookingIds: string[] = [];
    for (const testBooking of testBookingsAfter2028) {
      const createdBooking = await createBooking(testBooking, request);
      bookingIds.push(createdBooking.bookingid);
    }

    const filteredRes = await request.get(`/booking?checkin=2028-01-01`);
    const filteredBookings = await filteredRes.json();

    expect(filteredBookings.length).toBe(5);

    for (const { bookingid } of filteredBookings) {
      const res = await request.get(`/booking/${bookingid}`);
      expect(res.status()).toBe(200);
      const booking = await res.json();
      const testDate = new Date("2028-01-01");
      const bookingDate = new Date(booking.bookingdates.checkin);
      expect(bookingDate.getTime()).toBeGreaterThanOrEqual(testDate.getTime());
    }

    for (const { bookingid } of filteredBookings) {
      const authRes = await request.post("/auth", {
        data: { username: "admin", password: "password123" },
      });
      const { token } = await authRes.json();
      const deleteRes = await request.delete(`/booking/${bookingid}`, {
        headers: { "Cookie": `token=${token}` },
      });
      expect(deleteRes.status()).toBe(201);
    }
  });

  test("GET - booking returns correct schema types", async ({ request, testData }) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    const testBooking = await createBooking(testData, request);
    const res = await request.get(`/booking/${testBooking.bookingid}`);
    expect(res.status()).toBe(200);
    
    const booking = await res.json();
    expect(typeof booking.firstname).toBe("string");
    expect(typeof booking.lastname).toBe("string");
    expect(typeof booking.totalprice).toBe("number");
    expect(typeof booking.depositpaid).toBe("boolean");
    expect(typeof booking.bookingdates.checkin).toBe("string");
    expect(typeof booking.bookingdates.checkout).toBe("string");
    expect(dateRegex.test(booking.bookingdates.checkin)).toBeTruthy();
    expect(dateRegex.test(booking.bookingdates.checkout)).toBeTruthy();
    expect(typeof booking.additionalneeds).toBe("string");
  });
});

async function createBooking(booking: Booking, request: APIRequestContext) {
  const response = await request.post("/booking", {
    data: booking,
  });

  return await response.json();
}