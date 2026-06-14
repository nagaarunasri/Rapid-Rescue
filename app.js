// ===========================================================
// RAPID RESCUE AI - app.js
// Main application logic: navigation, simulations, charts,
// alerts, route guide, control center
// ===========================================================

const ROADS = ["Road A", "Road B", "Road C", "Road D"];

// ---------- Traffic classification helper ----------
function classifyTraffic(count) {
  if (count <= 10) return { level: "Clear", cls: "green" };
  if (count <= 20) return { level: "Moderate", cls: "yellow" };
  return { level: "Heavy", cls: "red" };
}

// ---------- Particle background (login page) ----------
function initParticles() {
  const container = document.getElementById("particles");
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const size = Math.random() * 6 + 3;
    p.style.width = size + "px";
    p.style.height = size + "px";
    p.style.left = Math.random() * 100 + "%";
    p.style.animationDuration = (Math.random() * 10 + 8) + "s";
    p.style.animationDelay = (Math.random() * 5) + "s";
    container.appendChild(p);
  }
}

// ---------- Animated counters (home page) ----------
function animateCounters() {
  document.querySelectorAll(".counter").forEach((el) => {
    const target = parseInt(el.dataset.target, 10);
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 60));
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      el.textContent = current;
    }, 30);
  });
}

// ===========================================================
// LIVE TRAFFIC DASHBOARD (Page 3)
// ===========================================================
let trafficState = {};

function initTrafficDashboard() {
  const grid = document.getElementById("trafficGrid");
  if (!grid) return;

  // Seed initial values
  ROADS.forEach((road) => {
    trafficState[road] = Math.floor(Math.random() * 28) + 2;
  });

  renderTrafficCards();

  // Push initial state to Firebase
  pushTrafficToFirebase();

  // Simulate real-time updates every 3 seconds
  setInterval(() => {
    ROADS.forEach((road) => {
      // Randomly fluctuate vehicle count
      let change = Math.floor(Math.random() * 7) - 3;
      let newVal = trafficState[road] + change;
      newVal = Math.max(0, Math.min(35, newVal));
      trafficState[road] = newVal;
    });
    renderTrafficCards();
    pushTrafficToFirebase();
    checkAutoAlerts();
  }, 3000);
}

function renderTrafficCards() {
  const grid = document.getElementById("trafficGrid");
  if (!grid) return;
  grid.innerHTML = "";

  ROADS.forEach((road) => {
    const count = trafficState[road];
    const { level, cls } = classifyTraffic(count);
    const density = Math.min(100, Math.round((count / 35) * 100));
    const now = new Date().toLocaleTimeString();

    const col = document.createElement("div");
    col.className = "col-md-6 col-lg-3";
    col.innerHTML = `
      <div class="glass-card traffic-card status-${cls} h-100" data-aos="fade-up">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h5 class="mb-0">${road}</h5>
          <i class="fa-solid fa-car car-icon drive-anim"></i>
        </div>
        <h2 class="fw-bold mb-1">${count} <small class="fs-6">vehicles</small></h2>
        <p class="mb-2 text-light">Density: ${density}%</p>
        <div class="progress mb-2" style="height: 8px; background: rgba(255,255,255,0.15);">
          <div class="progress-bar bg-${cls === 'green' ? 'success' : cls === 'yellow' ? 'warning' : 'danger'}"
               style="width:${density}%"></div>
        </div>
        <span class="traffic-badge badge-${cls}">${level}</span>
        <p class="mt-2 mb-0 small text-light"><i class="fa-regular fa-clock me-1"></i>Updated: ${now}</p>
      </div>
    `;
    grid.appendChild(col);
  });
}

function pushTrafficToFirebase() {
  if (typeof refTrafficData === "undefined") return;
  ROADS.forEach((road) => {
    const count = trafficState[road];
    const { level } = classifyTraffic(count);
    refTrafficData.child(road.replace(" ", "_")).set({
      road: road,
      vehicleCount: count,
      density: Math.min(100, Math.round((count / 35) * 100)),
      status: level,
      timestamp: new Date().toISOString()
    }).catch(() => { /* offline-safe: ignore write errors */ });
  });
}

// ---------- Auto Alert Logic ----------
function checkAutoAlerts() {
  ROADS.forEach((road) => {
    const count = trafficState[road];
    if (count > 20) {
      const alternative = findLowestTrafficRoad(road);
      createAlert(
        "Heavy Traffic Alert",
        `${road} has ${count} vehicles (Heavy). Suggested alternative: ${alternative}.`,
        "Reroute ambulances away from " + road
      );
    }
  });
}

function findLowestTrafficRoad(exclude) {
  let lowest = null, lowestVal = Infinity;
  ROADS.forEach((road) => {
    if (road === exclude) return;
    if (trafficState[road] < lowestVal) {
      lowestVal = trafficState[road];
      lowest = road;
    }
  });
  return lowest || "N/A";
}

// ===========================================================
// ALERTS CENTER (Page 5)
// ===========================================================
const ALERT_TYPES = {
  "Heavy Traffic Alert": "type-route",
  "Traffic Congestion Alert": "type-moderate",
  "Route Change Alert": "type-route",
  "Road Cleared Alert": "type-cleared",
  "Accident Alert": "",
  "Emergency Vehicle Alert": ""
};

function createAlert(type, message, action) {
  const alert = {
    type: type,
    message: message,
    recommendedAction: action,
    timestamp: new Date().toISOString()
  };

  // Push to Firebase if available
  if (typeof refAlerts !== "undefined") {
    refAlerts.push(alert).catch(() => {});
  }

  // Render immediately if on alerts page
  prependAlertCard(alert);
}

function prependAlertCard(alert) {
  const list = document.getElementById("alertsList");
  if (!list) return;
  const typeCls = ALERT_TYPES[alert.type] || "";
  const card = document.createElement("div");
  card.className = `alert-card glass-card ${typeCls}`;
  card.setAttribute("data-aos", "fade-right");
  card.innerHTML = `
    <div class="d-flex justify-content-between flex-wrap">
      <strong><i class="fa-solid fa-triangle-exclamation me-2"></i>${alert.type}</strong>
      <span class="small text-light">${new Date(alert.timestamp).toLocaleString()}</span>
    </div>
    <p class="mb-1 mt-2">${alert.message}</p>
    <p class="mb-0 small"><i class="fa-solid fa-circle-check me-1 text-success"></i>Action: ${alert.recommendedAction}</p>
  `;
  list.prepend(card);

  // Limit visible list to 30
  while (list.children.length > 30) list.removeChild(list.lastChild);
}

function initAlertsPage() {
  const list = document.getElementById("alertsList");
  if (!list) return;

  // Load history from Firebase
  if (typeof refAlerts !== "undefined") {
    refAlerts.limitToLast(30).on("child_added", (snap) => {
      prependAlertCard(snap.val());
    });
  }

  // Manual alert generator buttons
  document.querySelectorAll(".manualAlertBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      const messages = {
        "Traffic Congestion Alert": "Increased congestion detected on multiple roads.",
        "Route Change Alert": "Ambulance route updated due to changing traffic conditions.",
        "Road Cleared Alert": "Previously congested road has now cleared up.",
        "Accident Alert": "An accident has been reported, rerouting nearby ambulances.",
        "Emergency Vehicle Alert": "Emergency vehicle approaching - clear the lane immediately."
      };
      const actions = {
        "Traffic Congestion Alert": "Monitor and prepare alternative routes",
        "Route Change Alert": "Update driver navigation immediately",
        "Road Cleared Alert": "Resume normal routing",
        "Accident Alert": "Dispatch alternate route + notify control center",
        "Emergency Vehicle Alert": "All vehicles yield right of way"
      };
      createAlert(type, messages[type], actions[type]);
    });
  });
}

// ===========================================================
// SMART ROUTE GUIDE (Page 4)
// ===========================================================
function initRouteGuide() {
  const findBtn = document.getElementById("findRouteBtn");
  if (!findBtn) return;

  findBtn.addEventListener("click", () => {
    const from = document.getElementById("currentLocation").value;
    const to = document.getElementById("destination").value;

    if (!from || !to) {
      alert("Please select both current location and destination.");
      return;
    }

    // Use live traffic state if available, otherwise random sample
    const data = ROADS.map((road) => {
      const count = trafficState[road] !== undefined
        ? trafficState[road]
        : Math.floor(Math.random() * 30) + 1;
      return { road, count, ...classifyTraffic(count) };
    });

    // Sort ascending by vehicle count -> AI picks the lowest density road
    data.sort((a, b) => a.count - b.count);
    const best = data[0];
    const alternatives = data.slice(1);

    const distance = (Math.random() * 8 + 2).toFixed(1);
    const time = Math.max(3, Math.round(distance * (best.count / 6 + 1)));
    const conditions = ["Excellent", "Good", "Fair"];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    document.getElementById("routeResult").classList.remove("d-none");
    document.getElementById("resRoad").textContent = best.road;
    document.getElementById("resTime").textContent = time + " min";
    document.getElementById("resDistance").textContent = distance + " km";
    document.getElementById("resTraffic").textContent = best.level;
    document.getElementById("resTraffic").className = "badge traffic-badge badge-" + best.cls;
    document.getElementById("resCondition").textContent = condition;
    document.getElementById("fromLabel").textContent = from;
    document.getElementById("toLabel").textContent = to;
    document.getElementById("midLabel").textContent = best.road;

    // Render alternatives
    const altList = document.getElementById("altRoutes");
    altList.innerHTML = "";
    alternatives.forEach((alt) => {
      const li = document.createElement("li");
      li.className = "glass-card p-3 mb-2";
      li.innerHTML = `<strong>${alt.road}</strong> — ${alt.count} vehicles
        <span class="traffic-badge badge-${alt.cls} ms-2">${alt.level}</span>`;
      altList.appendChild(li);
    });

    // Save recommendation to Firebase
    if (typeof refRoutes !== "undefined") {
      refRoutes.push({
        from, to,
        recommended: best.road,
        estimatedTime: time,
        distance: distance,
        trafficLevel: best.level,
        roadCondition: condition,
        timestamp: new Date().toISOString()
      }).catch(() => {});
    }

    // Emergency priority toggle effect
    const emergencyMode = document.getElementById("emergencyToggle").checked;
    const badge = document.getElementById("emergencyBadge");
    if (emergencyMode) {
      badge.classList.remove("d-none");
      createAlert("Route Change Alert",
        `Emergency Priority Mode active. Best route to ${to} via ${best.road}.`,
        "Clear traffic signals along " + best.road);
    } else {
      badge.classList.add("d-none");
    }
  });
}

// ===========================================================
// ANALYTICS DASHBOARD (Page 6)
// ===========================================================
function initAnalyticsCharts() {
  const barCtx = document.getElementById("densityChart");
  if (!barCtx) return;

  // Vehicle Density Bar Chart
  new Chart(barCtx, {
    type: "bar",
    data: {
      labels: ["Road A", "Road B", "Road C", "Road D"],
      datasets: [{
        label: "Vehicle Count",
        data: [30, 10, 25, 15],
        backgroundColor: ["#DC3545", "#28A745", "#FFC107", "#0D6EFD"],
        borderRadius: 10
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: "#fff" } } },
      scales: {
        x: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } },
        y: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } }
      },
      animation: { duration: 1200, easing: "easeOutBounce" }
    }
  });

  // Peak Hour Traffic Line Chart
  new Chart(document.getElementById("peakHourChart"), {
    type: "line",
    data: {
      labels: ["6 AM", "8 AM", "1 PM", "6 PM", "10 PM"],
      datasets: [{
        label: "Traffic Volume",
        data: [12, 30, 20, 40, 22],
        borderColor: "#0D6EFD",
        backgroundColor: "rgba(13,110,253,0.25)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#DC3545"
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: "#fff" } } },
      scales: {
        x: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } },
        y: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } }
      },
      animation: { duration: 1400 }
    }
  });

  // System Efficiency Doughnut Chart
  new Chart(document.getElementById("efficiencyChart"), {
    type: "doughnut",
    data: {
      labels: ["Efficiency", "Remaining"],
      datasets: [{
        data: [85, 15],
        backgroundColor: ["#28A745", "rgba(255,255,255,0.1)"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      cutout: "70%",
      plugins: { legend: { labels: { color: "#fff" } } },
      animation: { duration: 1400 }
    }
  });
}

// ===========================================================
// EMERGENCY CONTROL CENTER (Page 7)
// ===========================================================
const AMBULANCES = [
  { driver: "Ramesh Kumar", route: "Road A → City Hospital", status: "available" },
  { driver: "Sita Devi", route: "Road C → Apollo Hospital", status: "busy" },
  { driver: "Arjun Singh", route: "Road B → General Hospital", status: "emergency" },
  { driver: "Priya Sharma", route: "Road D → Trauma Center", status: "available" }
];

function initControlCenter() {
  const grid = document.getElementById("ambulanceGrid");
  if (!grid) return;

  function render() {
    grid.innerHTML = "";
    AMBULANCES.forEach((amb) => {
      const roadName = amb.route.split(" ")[1] + " " + amb.route.split(" ")[2];
      // attempt to map to a road key for ETA
      let trafficCount = 10;
      ROADS.forEach(r => { if (amb.route.includes(r)) trafficCount = trafficState[r] ?? 10; });
      const { level, cls } = classifyTraffic(trafficCount);
      const eta = Math.max(2, Math.round((trafficCount / 5) + 3));

      const col = document.createElement("div");
      col.className = "col-md-6 col-lg-3";
      col.innerHTML = `
        <div class="glass-card p-3 h-100" data-aos="zoom-in">
          <div class="d-flex align-items-center mb-2">
            <span class="ambulance-status-dot status-${amb.status}"></span>
            <strong>${amb.driver}</strong>
          </div>
          <p class="mb-1 small"><i class="fa-solid fa-route me-1"></i>${amb.route}</p>
          <p class="mb-1 small">Traffic: <span class="traffic-badge badge-${cls}">${level}</span></p>
          <p class="mb-0 small"><i class="fa-regular fa-clock me-1"></i>ETA: ${eta} min</p>
        </div>
      `;
      grid.appendChild(col);
    });
  }

  render();
  setInterval(render, 3000);

  // Push ambulance data to firebase
  if (typeof refAmbulances !== "undefined") {
    AMBULANCES.forEach((amb, i) => {
      refAmbulances.child("amb_" + i).set({ ...amb, updatedAt: new Date().toISOString() }).catch(() => {});
    });
  }
}

// ===========================================================
// LIVE PREVIEW WIDGET (Home Page)
// ===========================================================
function initLivePreview() {
  const widget = document.getElementById("livePreviewWidget");
  if (!widget) return;

  function render() {
    widget.innerHTML = "";
    ROADS.forEach((road) => {
      const count = Math.floor(Math.random() * 32);
      const { level, cls } = classifyTraffic(count);
      const item = document.createElement("div");
      item.className = "d-flex justify-content-between align-items-center py-2 border-bottom border-light-subtle";
      item.innerHTML = `<span>${road}</span>
        <span>${count} vehicles <span class="traffic-badge badge-${cls} ms-2">${level}</span></span>`;
      widget.appendChild(item);
    });
  }
  render();
  setInterval(render, 3000);
}

// ===========================================================
// NAVBAR ACTIVE LINK HIGHLIGHT
// ===========================================================
function highlightActiveNav() {
  const current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link-custom").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === current) link.classList.add("active");
  });
}

// ===========================================================
// INITIALIZE ON LOAD
// ===========================================================
document.addEventListener("DOMContentLoaded", () => {
  if (typeof AOS !== "undefined") AOS.init({ duration: 900, once: true });

  initParticles();
  animateCounters();
  initTrafficDashboard();
  initAlertsPage();
  initRouteGuide();
  initAnalyticsCharts();
  initControlCenter();
  initLivePreview();
  highlightActiveNav();
});
