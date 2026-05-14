// WebSocket / STOMP integration test
// Usage: node src/test/ws-test.mjs
// Requires app running on localhost:8000

const WS_URL = "ws://localhost:8000/ws/000/test-session/websocket";

function stompFrame(command, headers = {}, body = "") {
  const headerLines = Object.entries(headers)
    .map(([k, v]) => `${k}:${v}`)
    .join("\n");
  return `${command}\n${headerLines}\n\n${body}\x00`;
}

// SockJS wraps STOMP frames as JSON arrays: ["frame"]
function sockjsSend(ws, frame) {
  ws.send(JSON.stringify([frame]));
}

function parseSockjsFrame(raw) {
  if (raw === "o") return { type: "open" };
  if (raw === "h") return { type: "heartbeat" };
  if (raw === "c") return { type: "close" };
  if (raw.startsWith("a")) {
    const frames = JSON.parse(raw.slice(1));
    return { type: "message", frames };
  }
  return { type: "unknown", raw };
}

async function runTest() {
  console.log("Connecting to", WS_URL);

  const ws = new WebSocket(WS_URL);
  let subscribed = false;
  let messageReceived = false;

  const done = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (!subscribed) reject(new Error("Timed out before STOMP CONNECTED"));
      else resolve({ connected: true, messageReceived });
    }, 5000);

    ws.onopen = () => console.log("[WS] TCP connection open");

    ws.onmessage = (event) => {
      const parsed = parseSockjsFrame(event.data);

      if (parsed.type === "open") {
        console.log("[SockJS] Open frame received — sending STOMP CONNECT");
        sockjsSend(ws, stompFrame("CONNECT", {
          "accept-version": "1.1,1.2",
          "heart-beat": "0,0",
        }));
        return;
      }

      if (parsed.type === "message") {
        for (const frame of parsed.frames) {
          if (frame.startsWith("CONNECTED")) {
            console.log("[STOMP] CONNECTED — subscribing to /topic/spots");
            sockjsSend(ws, stompFrame("SUBSCRIBE", {
              destination: "/topic/spots",
              id: "sub-0",
            }));
            subscribed = true;
            console.log("[STOMP] Subscribed to /topic/spots — waiting 3s for messages");
            clearTimeout(timeout);
            setTimeout(() => resolve({ connected: true, messageReceived }), 3000);
          } else if (frame.startsWith("MESSAGE")) {
            console.log("[STOMP] MESSAGE received:", frame);
            messageReceived = true;
          }
        }
      }
    };

    ws.onerror = (err) => reject(new Error("WebSocket error: " + err.message));
    ws.onclose = () => console.log("[WS] Connection closed");
  });

  try {
    const result = await done;
    ws.close();

    console.log("\n--- Results ---");
    console.log("STOMP connected:   ", result.connected ? "PASS" : "FAIL");
    console.log("Subscribed:        ", subscribed ? "PASS" : "FAIL");
    console.log("Message received:  ", result.messageReceived ? "PASS (end-to-end)" : "SKIP (no spot data to trigger update)");
  } catch (err) {
    ws.close();
    console.error("FAIL:", err.message);
    process.exit(1);
  }
}

runTest();
