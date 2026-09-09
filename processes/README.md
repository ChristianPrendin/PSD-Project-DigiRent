# Important info

This folder contains the BPMN source files of the process, at each milestone:

* choreography diagram (`choreography.bpmn`) — Milestone 1
* collaboration diagram (`collaboration.bpmn`) — Milestone 1
* executable process (`DigiRent.bpmn` + `ProposeAndNegotiate.bpmn`) — Milestone 3
* petri net (`PetriNet_DigiRent.pnml`) — Milestone 2

For each diagram a png/gif image is included alongside the source file.

## Executable process — deployment instructions

The executable model is split across two BPMN files because "Propose and Negotiate"
is implemented as a reusable process, invoked twice (internal phase and partner phase)
through a Call Activity, rather than being duplicated inline:

* `DigiRent.bpmn` — top-level orchestration (process id `Process_0gyvhk5`)
* `ProposeAndNegotiate.bpmn` — reusable sub-process (process id `Process_1hxhplb`)

Both files must be deployed to Camunda — the Call Activities in `DigiRent.bpmn`
resolve `ProposeAndNegotiate.bpmn` by process key, so deploying only one causes
the process to fail at the first Call Activity.

**Requirements:** Camunda 7.24 (Docker), REST engine reachable at
`http://localhost:8080/engine-rest`.

**Steps:**
1. Start Camunda: `docker run -d -p 8080:8080 camunda/camunda-bpm-platform:7.24.0`
   (or your existing docker-compose setup).
2. Deploy both files via Camunda Cockpit ("Deploy Diagram") or via REST:
```
   curl -X POST http://localhost:8080/engine-rest/deployment/create \
     -F "deployment-name=digirent" \
     -F "DigiRent.bpmn=@DigiRent.bpmn" \
     -F "ProposeAndNegotiate.bpmn=@ProposeAndNegotiate.bpmn"
```
3. Start the 3 mock services (see `services/README.md`) — the executable model
   calls out to them at every message task.
4. Start a process instance by sending the `RentalRequestSubmitted` message
   (see the Postman collection in `services/postman/`) or via Cockpit.