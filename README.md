# CineVerse — Phase 3: Cinemas, Screens, and Showtimes

CineVerse is a college Object-Oriented Modeling project. The existing movie catalog remains in place; this phase adds cinemas, their screens, scheduled shows, validation, overlap protection, and development data.

## Project structure

```text
cineverse/src/main/java/com/cineverse/
├── config/DevelopmentMovieDataLoader.java
├── controller/
│   ├── BookingController.java
│   ├── CinemaController.java
│   ├── HealthController.java
│   ├── MovieController.java
│   └── ShowController.java
├── dto/
│   ├── ApiError.java
│   ├── BookingDto.java
│   ├── CinemaDto.java
│   ├── CreateBookingRequest.java
│   ├── CinemaRequest.java
│   ├── MovieDto.java
│   ├── MovieRequest.java
│   ├── ScreenDto.java
│   ├── ShowDto.java
│   └── ShowRequest.java
├── entity/
│   ├── Cinema.java
│   ├── Booking.java
│   ├── BookingSeat.java
│   ├── Movie.java
│   ├── Seat.java
│   ├── Screen.java
│   ├── Show.java
│   └── ShowStatus.java
├── exception/
│   ├── CinemaNotFoundException.java
│   ├── GlobalExceptionHandler.java
│   ├── MovieNotFoundException.java
│   ├── RequestConflictException.java
│   ├── ResourceNotFoundException.java
│   ├── ScreenNotFoundException.java
│   └── ShowNotFoundException.java
├── repository/
│   ├── CinemaRepository.java
│   ├── MovieRepository.java
│   ├── ScreenRepository.java
│   └── ShowRepository.java
└── service/
    ├── CinemaService.java
    ├── MovieService.java
    └── ShowService.java
```

- **Entity:** persistent domain data and relationships.
- **DTO:** request and response shapes; controllers do not serialize JPA entities directly.
- **Repository:** database lookups and writes.
- **Service:** application rules, transaction boundaries, and entity-to-DTO mapping.
- **Controller:** HTTP paths, request validation, and status codes.
- **Exception:** consistent `400`, `404`, and `409` API error responses.

## Run and database

From the workspace root:

```bash
mvn spring-boot:run
```

The server uses port `8080` by default. It uses an **H2 in-memory development database**, not MySQL. Hibernate creates the schema at startup. H2 data resets when the application restarts, then sample movies, cinemas, screens, and future showtimes are loaded again. The data loader checks each table before seeding, so it does not insert duplicate sample rows if run again against an already seeded database.

On Replit, click **Run** to start the configured workflow and open the site in Preview. The workflow runs `mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=5000` so both the frontend and API are available through the same preview address. No external database or API secrets are required.

## Entity relationships

- One **Cinema** has zero or more **Screens**; each Screen belongs to exactly one Cinema.
- Each **Screen** has physical **Seats**, identified by row and seat number.
- One **Screen** can host zero or more **Shows**; each Show is scheduled on exactly one Screen.
- One **Movie** can have zero or more **Shows**; each Show screens exactly one Movie.
- A confirmed **Booking** belongs to one Show. Its **BookingSeats** link the selected physical seats to that show.
- A database uniqueness rule on `(show, seat)` and a lock on the Show prevent two requests from reserving the same seat for that screening.
- A Show’s Cinema is derived through `Show → Screen → Cinema`. It is not stored as a second Cinema relation, avoiding inconsistent duplicate data.
- Facilities are a collection of values stored with the Cinema. Screen capacity is derived from `rowCount × seatsPerRow`.

Deleting a Cinema removes its dependent Screen, Show, and Booking rows in the current development model. Deleting a Movie that is still referenced by a Show is rejected with `409 Conflict`.

## APIs

### Cinemas

| Method | Route | Result |
|---|---|---|
| GET | `/api/cinemas` | List cinemas, facilities, and screen configurations |
| GET | `/api/cinemas/{id}` | Get one cinema; `404` if missing |
| POST | `/api/cinemas` | Create a cinema; `201 Created` |
| PUT | `/api/cinemas/{id}` | Update a cinema; `404` if missing |
| DELETE | `/api/cinemas/{id}` | Delete cinema and dependent screens/shows; `204 No Content` |

Cinema POST and PUT use:

```json
{
  "name": "CineVerse Central",
  "address": "12 MG Road",
  "city": "Bengaluru",
  "facilities": ["Dolby Atmos", "Wheelchair access", "Snack bar"]
}
```

Screen details are included in cinema responses so callers can see screen IDs and capacity when creating a show. Screens for this phase are created by the development data loader; a screen-management API is not part of the requested route list.

### Shows

| Method | Route | Result |
|---|---|---|
| GET | `/api/shows` | List shows ordered by start time |
| GET | `/api/shows/{id}` | Get one show; `404` if missing |
| POST | `/api/shows` | Schedule a show; `201 Created` |
| GET | `/api/movies/{movieId}/shows` | List shows for a movie; `404` if movie is missing |
| GET | `/api/cinemas/{cinemaId}/shows` | List shows at a cinema; `404` if cinema is missing |

POST `/api/shows` uses:

```json
{
  "movieId": 1,
  "screenId": 1,
  "startTime": "2027-01-05T18:00:00",
  "endTime": "2027-01-05T20:30:00",
  "ticketPrice": 350.00,
  "status": "SCHEDULED"
}
```

Choose a start time in the future when trying this example. Valid statuses are `SCHEDULED`, `CANCELLED`, and `COMPLETED`.

### Bookings and seats

| Method | Route | Result |
|---|---|---|
| GET | `/api/shows/{showId}/seats` | List seats in row order with current availability |
| POST | `/api/bookings` | Confirm a booking for selected seats; `201 Created` |
| GET | `/api/bookings/{bookingId}` | Retrieve one confirmed booking |

Seat availability response entries include a label (for example, `A1`), row and seat numbers, and an `available` flag. Create a booking with:

```json
{
  "showId": 1,
  "seatLabels": ["A1", "A2"]
}
```

Bookings support up to 10 seats per request. Seat labels must belong to the show's screen, duplicates are rejected, and a seat already reserved for that same show returns `409 Conflict`. The total is calculated from the show's listed ticket price. A booking is confirmed as a demo reservation; no payment is processed.

The My Bookings page keeps booking IDs in the current browser. This project does not have customer accounts, and the existing H2 database is in-memory: booking records are cleared when the server restarts.

### Health and movie catalog

The existing `GET /api/health` endpoint and all Phase 2 `/api/movies` routes remain available. Movie responses and requests are unchanged. A movie with associated shows cannot be deleted; the API returns `409 Conflict` rather than a database error.

Example requests:

```bash
curl http://localhost:8080/api/health
curl http://localhost:8080/api/movies
curl http://localhost:8080/api/cinemas
curl http://localhost:8080/api/shows
curl http://localhost:8080/api/movies/1/shows
curl http://localhost:8080/api/cinemas/1/shows
```

To verify overlapping-show protection, submit two scheduled shows for the same screen whose time ranges overlap. The second request returns `409 Conflict`. A show on a different screen, or one starting exactly when the previous show ends, is allowed.

Show start time must be in the future, end time must be later than start time, ticket price must be greater than zero with up to two decimal places, and referenced movie and screen IDs must exist. Cinema fields and facilities are also validated. Error responses include a message, request path, and field errors where applicable.

## Tests

Run the complete suite from the workspace root:

```bash
mvn test
```

The suite contains **31 tests**: the existing 26 health, movie, cinema, and show tests remain, with 5 booking integration tests for confirmation and total calculation, seat availability and duplicate-seat conflicts, malformed and invalid requests, concurrent booking protection, and booking retrieval.

## OOP concepts demonstrated

- **Encapsulation:** entity state is private; Cinema updates go through `updateDetails`, and Screen capacity is calculated from its row layout.
- **Associations and multiplicity:** Cinema–Screen is one-to-many, Screen–Show is one-to-many, and Movie–Show is one-to-many (represented by each Show’s many-to-one Movie reference).
- **Abstraction:** repositories are interfaces; Spring Data JPA supplies their implementations.
- **Separation of responsibility:** controllers, services, repositories, entities, DTOs, and exceptions each have a distinct role.
- **Constructor injection:** services receive required repositories through constructors.
- **Transactions and locking:** show creation is transactional and locks its Screen while checking for schedule conflicts, preventing concurrent requests from booking overlapping intervals on that screen.
- **Polymorphism:** no artificial hierarchy is added. Different payment or pricing implementations may justify polymorphism in a later module.
