// plug.js
const client = mqtt.connect("wss://broker.hivemq.com:8884/mqtt");

client.on("connect", () => {
  console.log("MQTT connected");
  client.subscribe("smart/plug/data");
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

  const plugId = data.plug;
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

  // ✅ Sync toggle with relay state
  const toggle = document.getElementById("relayToggle");
  const status = document.getElementById("relayStatus");
  
  if (relay === 0) {
    toggle.checked = true;
    status.textContent = "Status: ON";
  } else {
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
  
  if (toggle.checked) {
    client.publish("smart/plug/cmd", JSON.stringify({ plug: 1, cmd: "off" }));
    status.textContent = "Status: OFF";
  } else {
    client.publish("smart/plug/cmd", JSON.stringify({ plug: 1, cmd: "on" }));
    status.textContent = "Status: ON";
  }
}

function sendTimer() {
  const h = parseInt(document.getElementById("hours").value);
  const m = parseInt(document.getElementById("minutes").value);
  const s = parseInt(document.getElementById("seconds").value);
  const totalSec = h * 3600 + m * 60 + s;
  
  if (totalSec > 0) {
    client.publish("smart/plug/cmd", JSON.stringify({ plug: 1, cmd: "timer", seconds: totalSec }));
    document.getElementById("timerDisplay").textContent = `Timer Started: ${totalSec} sec`;
    
    // ✅ Force toggle ON when timer starts
    const toggle = document.getElementById("relayToggle");
    toggle.checked = true;
    document.getElementById("relayStatus").textContent = "Status: ON";
  }
}
