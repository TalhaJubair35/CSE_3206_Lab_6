# CampusEvents Live Demo

## 5-minute script

| Time | Demo |
|---|---|
| 0:00–0:30 | Open the repository and point out the GitHub Actions CI badge and the server/client jobs. |
| 0:30–1:00 | Show the architecture diagram and trace a request from the React client through Express, services, Mongoose, and MongoDB. |
| 1:00–1:30 | Log in as a prepared user and show the protected-route behavior and role-based navigation. |
| 1:30–2:15 | Browse events, join one with available capacity, and show the confirmation feedback. |
| 2:15–2:45 | Join a prepared full event and show the “Waitlisted” toast. |
| 2:45–3:30 | Log in as an organizer, create an event, and show it in the organizer’s event table. |
| 3:30–4:15 | Log in as an admin, select an event, and review its attendance rows. |
| 4:15–4:40 | Export the attendance report as CSV and show the downloaded file. |
| 4:40–5:00 | Run the Jest coverage command and show the CI workflow; mention its 80% statement / 70% branch gates. |

Before the demo, start MongoDB and the API/client, and prepare student, organizer, and admin accounts plus an event at capacity for the waitlist step.

## Viva Q&A

1. **Why did you choose this process model?**  
   I chose an iterative and incremental approach because the system can be delivered in independently testable modules. Each increment adds a user-visible capability while keeping earlier modules available for integration.

2. **Why use Singleton for the database connection?**  
   A single shared connection avoids repeatedly opening connections for separate requests. Per-request connections were rejected because they add resource and latency overhead.

3. **Why use Strategy for notifications?**  
   The registration service can use different notifier implementations through the same interface. An `if/else` channel check inside registration logic was rejected because each new channel would require changing that service.

4. **Why use Adapter for report exporting?**  
   An exporter presents a consistent interface while allowing output formats such as CSV to be added separately. Hardcoding CSV in the report service was rejected because it couples report data retrieval to presentation format.

5. **How does TDD help this project?**  
   Behavioral tests specify expected outcomes such as confirmation, waitlisting, and FIFO promotion before regression checks are considered complete. Some implementation in this project preceded its tests, so future changes should follow the full red-green-refactor cycle more consistently.

6. **Why mock the Mongoose models in service tests?**  
   Model mocks isolate service decisions from database availability and make outcomes deterministic. Persistence behavior itself still needs separate integration coverage against a test database.

7. **What does the coverage gate enforce?**  
   Jest enforces at least 80% statement coverage and 70% branch coverage globally for the configured code. Passing tests alone is not enough if coverage remains below either threshold.

8. **What does CI run?**  
   The GitHub Actions workflow installs locked server dependencies, runs Jest with coverage, installs client dependencies, and builds the client. It runs on pushes and pull requests and does not deploy the application.

9. **How does GitHub Actions CI differ from Jenkins?**  
   GitHub Actions is integrated with GitHub workflow events and uses hosted or configured runners. Jenkins is a separately managed automation server with a broader plugin and infrastructure setup; both can run build and test pipelines.

10. **How would you resolve a merge conflict?**  
    I would inspect both changes, agree on the intended combined behavior, and resolve the conflict without discarding either contribution blindly. Then I would run focused tests and the relevant build before committing the resolution.

11. **What was the pull-request review outcome?**  
    This workspace has not recorded a pull-request review, so I would not claim a specific review outcome. In a real review I would address each actionable comment and rerun the affected tests before merging.

12. **How can the design be extended?**  
    A new notification channel can implement the notifier interface, and a new export format can implement the exporter interface. These extensions avoid putting channel or format-specific branches into the core services.

13. **How is an event organizer prevented from editing another organizer’s event?**  
    Protected event routes authenticate the caller, while the event service compares the caller ID with the event’s organizer ID. Admins can access the route, but the service’s ownership check still governs edits.

14. **Why does registration use a waitlist?**  
    The service counts confirmed registrations and confirms a new registration only when capacity remains. When a confirmed attendee cancels, the earliest waitlisted registration is promoted first.

15. **What is the next skill or improvement you would pursue?**  
    I would strengthen backend integration testing with an isolated MongoDB test instance and complete the coverage gate. After that, I would improve deployment readiness, observability, and accessibility based on feedback.
