// ✅ Use secure WebSocket (WSS) since site is HTTPS
const client = mqtt.connect("wss://broker.hivemq.com:8884/mqtt");

client.on("connect", () => {
  console.log("✅ Connected to MQTT broker over WSS");
  client.subscribe("smart/plug/+/codedata");
});

client.on("message", (topic, message) => {
  try {
    const data = JSON.parse(message.toString());

    // Extract plugId from topic: smart/plug/{id}/codedata
    const parts = topic.split("/");
    const plugId = parts[2];

    updatePlugUI(plugId, data);

  } catch (err) {
    console.error("❌ Error parsing message:", err);
  }
});

// ================= UI UPDATE =================

// ✅ Keep track of all plug powers
const plugPowers = {};
let totalUpdateTimer = null;

function updatePlugUI(plugId, plugData) {
  const container = document.getElementById("plugs");
  let card = document.getElementById(`plug-${plugId}`);

  if (!card) {
    card = document.createElement("div");
    card.className = "plug-card";
    card.id = `plug-${plugId}`;

    // ✅ Make the entire card clickable
    card.addEventListener("click", () => {
      window.location.href = `plug.html?plug=${plugId}`;
    });

    container.appendChild(card);
  }

  // Calculate power in Watts
  const power = (plugData.voltage * plugData.current).toFixed(2);

  // ✅ Store this plug’s power
  plugPowers[plugId] = parseFloat(power);

  card.innerHTML = `
    <h2>Plug ${plugId}</h2>
    <p class="value"><i class="bi bi-battery"></i> Voltage: ${plugData.voltage} V</p>
    <p class="value"><i class="bi bi-lightning"></i> Current: ${plugData.current} A</p>
    <p class="value"><i class="bi bi-plug"></i> Power: ${power} W</p>
    <p class="value"><i class="bi bi-clock"></i> Timer: ${plugData.timer} s</p>
  `;

  // ✅ Debounce total power update (once per second)
  if (!totalUpdateTimer) {
    totalUpdateTimer = setTimeout(() => {
      const totalCard = document.getElementById("total");
      const totalPower = Object.values(plugPowers)
        .reduce((sum, p) => sum + p, 0)
        .toFixed(2);

      totalCard.innerHTML =
        `<i class="bi bi-graph-up-arrow"></i> Total Power: ${totalPower} W`;

      totalUpdateTimer = null;
    }, 1000);
  }
}
