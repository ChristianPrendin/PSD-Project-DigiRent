# Important info

## Running the mock services

Three Node.js/Express mocks simulate the black-box participants (Customer, Owner,
Commercial Partner). They receive calls from the Camunda process and reply
asynchronously by sending messages back to the engine.

**Requirements:** Node.js, `express` (`npm install express` in this folder — add a
`package.json` if not already present).

**Ports:**

| Mock | Port | Simulates |
|---|---|---|
| `customermock.js` | 3001 | Customer |
| `ownermock.js` | 3002 | Owner |
| `partnermock.js` | 3003 | Commercial Partner |

**Start (one terminal each, or in background):**
- node customermock.js
- node ownermock.js
- node partnermock.js

All three must be running before starting a process instance, and they must be
reachable from the Camunda Docker container via `host.docker.internal` (already
configured in the BPMN scripts).

`ownermock.js` and `partnermock.js` respond asynchronously (2.5–4s delay) by
calling back `POST /engine-rest/message` with a retry-with-backoff (3 attempts) —
this is intentional, it simulates a real external party and exercises the
process's async message-correlation.

## Postman collection

The full test suite is `services/postman/DigiRent_Postman_Scenari.json` — 3 folders
covering all 6 demo scenarios (internal accepted, internal rejected/no partner
match, internal rejected/partner phase with withdraw/reject/accept branches).
Requests sharing a setup are grouped under a common numeric prefix, with lettered
suffixes (`1.4A`/`1.4B`) marking the point where two scenarios diverge — only one
lettered branch should be run per test pass, they are mutually exclusive
alternatives on the same process instance, not a sequence.

Import the collection into Postman, set the `camundaUrl` collection variable if
your engine isn't at the default `http://localhost:8080/engine-rest`, and run each
folder in order starting from its first request.