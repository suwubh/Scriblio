# proof

Screenshots and raw output backing the numbers in the main README.

## Load test (k6)

The signaling server has a `/bench` WebSocket path that echoes JSON pings.
I added it specifically for benchmarking, because Yjs uses a binary protocol
over `y-webrtc` / `y-websocket` and wrapping that with k6 would mostly measure
protocol overhead, not the actual server.

To reproduce:

```bash
# stack must be running (docker compose up, or the manual 4-terminal setup)
k6 run --out json=proof/loadtest-scriblio-results.json \
       proof/loadtest-scriblio.js \
       | tee proof/loadtest-scriblio-output.txt
```

Against a deployed signaling server:

```bash
k6 run -e WS_URL=wss://your-host/bench proof/loadtest-scriblio.js
```

Look for the `sync_latency_ms` line in the summary. Screenshot is in
`loadtest-scriblio-screenshot.png`.

## User study

See [user-study.md](./user-study.md). Raw responses in
`user-study-responses.csv`.
