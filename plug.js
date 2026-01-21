// plug.js
// ✅ Use secure WebSocket (WSS) since site is HTTPS
const client = mqtt.connect("wss://broker.hivemq.com:8884/mqtt");

// ✅ Get plugId from URL (e.g. plug.html?plug=2)
const params = new URLSearchParams(window.location.search);
const plugId = parseInt(params.get("plug"), 10);

client.on("connect", () => {
  console.log("MQTT connected");
  // ✅ Subscribe ONLY to this plug's data
  client.subscribe(`smart/plug/${plugId}/codedata`);
  console.log(`Subscribed to smart/plug/${plugId}/codedata`);
});

client.on("message", (topic, message) => {
  const msg = message.toString();
  console.log("MQTT DATA:", msg);
  
  // ✅ Parse JSON payload from hub
  let data;
  try {
    data = JSON.parse(msg);
  } catch (e) {
    console.error("Invalid JSON:", msg);
    return;
  }

  const voltage = data.voltage;
  const current = data.current;
  const relay = data.relay;
  const timer = data.timer;

  // Power calculation in Watts
  const power = voltage * current;

  // Update live card
  const container = document.getElementById("plugData");
  container.innerHTML = `
    <div class="plug-card">
      <h2>Plug ${plugId}</h2>
      <p class="value"><i class="bi bi-battery"></i> Voltage: ${voltage.toFixed(1)} V</p>
      <p class="value"><i class="bi bi-lightning"></i> Current: ${current.toFixed(3)} A</p>
      <p class="value"><i class="bi bi-plug"></i> Power: ${power.toFixed(2)} W</p>
      <p class="value"><i class="bi bi-clock"></i> Timer: ${timer} sec</p>
    </div>
  `;

  // ✅ FIXED: Sync toggle with relay state correctly
  const toggle = document.getElementById("relayToggle");
  const status = document.getElementById("relayStatus");
  if (relay === 1) {  // relay = 1 means ON
    toggle.checked = true;
    status.textContent = "Status: ON";
  } else {  // relay = 0 means OFF
    toggle.checked = false;
    status.textContent = "Status: OFF";
  }

  // ✅ Show timer countdown if active
  const timerDisplay = document.getElementById("timerDisplay");
  if (timer > 0) {
    timerDisplay.textContent = `Timer Running: ${timer} sec left`;
  } else {
    timerDisplay.textContent = "";
  }
});

// ================= CONTROL FUNCTIONS =================
function toggleRelay() {
  const toggle = document.getElementById("relayToggle");
  const status = document.getElementById("relayStatus");
  
  // ✅ FIXED: Correct logic - checked = ON, unchecked = OFF
  if (toggle.checked) {
    client.publish(
      "smart/plug/command",
      JSON.stringify({ plug: plugId, cmd: "on" })
    );
    status.textContent = "Status: ON";
  } else {
    client.publish(
      "smart/plug/command",
      JSON.stringify({ plug: plugId, cmd: "off" })
    );
    status.textContent = "Status: OFF";
  }
}

function sendTimer() {
  const h = parseInt(document.getElementById("hours").value);
  const m = parseInt(document.getElementById("minutes").value);
  const s = parseInt(document.getElementById("seconds").value);
  const totalSec = h * 3600 + m * 60 + s;

  if (totalSec > 0) {
    client.publish(
      "smart/plug/command",
      JSON.stringify({ plug: plugId, cmd: "timer", seconds: totalSec })
    );
    document.getElementById("timerDisplay").textContent =
      `Timer Started: ${totalSec} sec`;
    
    // ✅ FIXED: Force toggle OFF when timer starts (relay turns OFF during countdown)
    const toggle = document.getElementById("relayToggle");
    toggle.checked = false;
    document.getElementById("relayStatus").textContent = "Status: OFF";
  }
}
