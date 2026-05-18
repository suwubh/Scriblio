import ws from 'k6/ws';
import { Trend, Counter } from 'k6/metrics';

const latency = new Trend('sync_latency_ms');
const ops = new Counter('total_ops');
const connectErrors = new Counter('connect_errors');

export const options = {
  scenarios: {
    concurrent_users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 25 },
        { duration: '60s', target: 25 },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    'sync_latency_ms': ['p(95)<150', 'p(99)<500'],
    'connect_errors': ['count<5'],
  },
};

export default function () {
  const url = __ENV.WS_URL || 'ws://localhost:4000/bench';

  const res = ws.connect(url, {}, function (socket) {
    socket.on('open', () => {
      // k6 Socket has no clearInterval; socket.close() ends the iteration.
      socket.setInterval(() => {
        const sentAt = Date.now();
        socket.send(JSON.stringify({ type: 'ping', sentAt }));
        ops.add(1);
      }, 200);

      socket.setTimeout(() => {
        socket.close();
      }, 60000);
    });

    socket.on('message', (msg) => {
      try {
        const data = JSON.parse(msg);
        if (typeof data.sentAt === 'number') {
          latency.add(Date.now() - data.sentAt);
        }
      } catch (_) {
        // non-JSON frame, ignore
      }
    });

    socket.on('error', () => {
      connectErrors.add(1);
    });
  });

  if (res && res.status !== 101) {
    connectErrors.add(1);
  }
}
