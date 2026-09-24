/**
 * Dirichlet Edge Security Service: System Status Controller
 * 1:1 Functional Parity with Cloudflare Kumo Status Architecture
 */

// Application State
let currentSystemState = "nominal"; // 'nominal' | 'break' | 'recover'
let activeTab = "overview";
let activeTheme = "dark";
let useUtc = false;
let isDockCollapsed = false;

// Accordion Collapsed States
const collapsedGroups = new Set();
const collapsedRegions = new Set(["Africa", "Europe", "North America", "Latin America", "Oceania"]);

// User Subscriptions State
const userSubscriptions = new Set();
let toastTimeout = null;

// Leaflet Map State
let leafletMap = null;
let tileLayer = null;
let mapMarkers = [];

// ============================================================================
// 1. DATA DEFINITIONS
// ============================================================================

// 1.1 Service Groups & Components
const SERVICE_GROUPS = [
  {
    id: "group-cdn",
    name: "CDN & Performance",
    services: [
      { id: "svc-cdn", name: "CDN/Cache", status: "operational", degradedDays: [15, 28, 55, 68] },
      { id: "svc-online", name: "Always Online", status: "operational", degradedDays: [] },
      { id: "svc-reserve", name: "Cache Reserve", status: "operational", degradedDays: [18, 70] },
      { id: "svc-purge", name: "CDN Cache Purge", status: "operational", degradedDays: [66] },
      { id: "svc-connector", name: "Cloud Connector", status: "operational", degradedDays: [75] },
      { id: "svc-custom-pages", name: "Custom Pages", status: "operational", degradedDays: [] },
      { id: "svc-tiered-cache", name: "Tiered Cache", status: "operational", degradedDays: [40] },
      { id: "svc-early-hints", name: "Early Hints 103", status: "operational", degradedDays: [] },
      { id: "svc-image-resizing", name: "Image Resizing", status: "operational", degradedDays: [82] },
      { id: "svc-stream-delivery", name: "Stream Delivery", status: "operational", degradedDays: [] }
    ]
  },
  {
    id: "group-proxy",
    name: "Core FL2 Proxy & Security Engine",
    services: [
      { id: "svc-fl2", name: "Core FL2 Proxy Engine (Rust [Feature; 200])", status: "operational", degradedDays: [42] },
      { id: "svc-ja4", name: "JA4 / JA3 Cryptographic Fingerprint Evaluator", status: "operational", degradedDays: [] },
      { id: "svc-tcp", name: "TCP Transport & SYN-ACK Latency Evaluator", status: "operational", degradedDays: [] },
      { id: "svc-h2", name: "HTTP/2 & HTTP/3 Frame Protocol Analyzer", status: "operational", degradedDays: [] },
      { id: "svc-entropy", name: "Shannon Header & Request Entropy Scorer", status: "operational", degradedDays: [] },
      { id: "svc-ip", name: "IP & BGP Network Reputation Classifier", status: "operational", degradedDays: [30] },
      { id: "svc-hints", name: "Client Hints & Behavioral Biometrics Engine", status: "operational", degradedDays: [] }
    ]
  },
  {
    id: "group-pipeline",
    name: "Analytical Feature Extraction Pipeline",
    services: [
      { id: "svc-catalog", name: "ClickHouse Catalog Introspection (system.columns)", status: "operational", degradedDays: [] },
      { id: "svc-registry", name: "Dynamic Feature Registry (KNOWN_FEATURES)", status: "operational", degradedDays: [] },
      { id: "svc-payload", name: "Dynamic JSON Payload Distributor (features.json)", status: "operational", degradedDays: [] }
    ]
  },
  {
    id: "group-storage",
    name: "Distributed Storage & Analytical Shards",
    services: [
      { id: "svc-ch-cluster", name: "ClickHouse Sharded Analytics Cluster", status: "operational", degradedDays: [60] },
      { id: "svc-shards", name: "Shard Replica Tables (events_r0 / events_r1)", status: "operational", degradedDays: [] },
      { id: "svc-kv", name: "Distributed Edge KV Cache", status: "operational", degradedDays: [] }
    ]
  }
];

// 1.2 Recent Incidents Data
const RECENT_INCIDENTS = [
  {
    title: "Intermittent authentication errors for API and R2",
    impact: "Minor",
    status: "Resolved",
    date: "24 Sept 2026, 3.59",
    type: "incident",
    service: "api"
  },
  {
    title: "Elevated Errors with any / all in http_response_cache_settings",
    impact: "Minor",
    status: "Resolved",
    date: "24 Sept 2026, 1.08",
    type: "incident",
    service: "fl2"
  },
  {
    title: "Increased Errors for Durable Objects",
    impact: "Minor",
    status: "Resolved",
    date: "23 Sept 2026, 17.00",
    type: "incident",
    service: "api"
  },
  {
    title: "Elevated number of R2 503 errors in Australian Eastern Coast region",
    impact: "Minor",
    status: "Resolved",
    date: "23 Sept 2026, 11.25",
    type: "incident",
    service: "fl2"
  },
  {
    title: "Issues with 1.1.1.1 for Families",
    impact: "Minor",
    status: "Resolved",
    date: "23 Sept 2026, 8.26",
    type: "incident",
    service: "dns"
  }
];

// 1.3 Active Maintenance Data
const ACTIVE_MAINTENANCE = [
  {
    title: "ZRH (Zurich) on 2026-09-24",
    status: "In Progress",
    date: "24 Sept 2026, 7.00",
    type: "maintenance",
    location: "ZRH"
  },
  {
    title: "WAW (Warsaw) on 2026-09-23",
    status: "In Progress",
    date: "24 Sept 2026, 6.00",
    type: "maintenance",
    location: "WAW"
  }
];

// 1.4 Global Location Fleet
const REGIONAL_LOCATIONS = [
  {
    region: "Asia",
    totalCount: 99,
    pops: [
      { city: "Ahmedabad", country: "India", code: "AMD", status: "operational", tag: "Operational +" },
      { city: "Almaty", country: "Kazakhstan", code: "ALA", status: "operational", tag: "Operational +" },
      { city: "Bangalore", country: "India", code: "BLR", status: "rerouted", tag: "Partially Re-routed +" },
      { city: "Bangkok", country: "Thailand", code: "BKK", status: "operational", tag: "Operational +" },
      { city: "Bandar Seri Begawan", country: "Brunei", code: "BWN", status: "operational", tag: "Operational +" },
      { city: "Cebu", country: "Philippines", code: "CEB", status: "operational", tag: "Operational +" },
      { city: "Chandigarh", country: "India", code: "IXC", status: "operational", tag: "Operational +" },
      { city: "Changde", country: "China", code: "CGD", status: "operational", tag: "Operational +" },
      { city: "Chennai", country: "India", code: "MAA", status: "operational", tag: "Operational +" },
      { city: "Chittagong", country: "Bangladesh", code: "CGP", status: "operational", tag: "Operational +" },
      { city: "Colombo", country: "Sri Lanka", code: "CMB", status: "operational", tag: "Operational +" },
      { city: "Dhaka", country: "Bangladesh", code: "DAC", status: "rerouted", tag: "Partially Re-routed +" },
      { city: "Foshan", country: "China", code: "FUO", status: "operational", tag: "Operational +" },
      { city: "Tokyo", country: "Japan", code: "NRT", status: "operational", tag: "Operational +" },
      { city: "Singapore", country: "Singapore", code: "SIN", status: "operational", tag: "Operational +" },
      { city: "Seoul", country: "South Korea", code: "ICN", status: "operational", tag: "Operational +" }
    ]
  },
  {
    region: "Africa",
    totalCount: 34,
    pops: [
      { city: "Johannesburg", country: "South Africa", code: "JNB", status: "operational", tag: "Operational +" },
      { city: "Cape Town", country: "South Africa", code: "CPT", status: "operational", tag: "Operational +" },
      { city: "Nairobi", country: "Kenya", code: "NBO", status: "operational", tag: "Operational +" },
      { city: "Cairo", country: "Egypt", code: "CAI", status: "operational", tag: "Operational +" },
      { city: "Lagos", country: "Nigeria", code: "LOS", status: "operational", tag: "Operational +" }
    ]
  },
  {
    region: "Europe",
    totalCount: 85,
    pops: [
      { city: "Frankfurt", country: "Germany", code: "FRA", status: "operational", tag: "Operational +" },
      { city: "London", country: "United Kingdom", code: "LHR", status: "operational", tag: "Operational +" },
      { city: "Amsterdam", country: "Netherlands", code: "AMS", status: "operational", tag: "Operational +" },
      { city: "Paris", country: "France", code: "CDG", status: "operational", tag: "Operational +" },
      { city: "Warsaw", country: "Poland", code: "WAW", status: "operational", tag: "Operational +" },
      { city: "Zurich", country: "Switzerland", code: "ZRH", status: "operational", tag: "Operational +" }
    ]
  },
  {
    region: "North America",
    totalCount: 110,
    pops: [
      { city: "San Francisco", country: "United States", code: "SFO", status: "operational", tag: "Operational +" },
      { city: "Ashburn", country: "United States", code: "IAD", status: "operational", tag: "Operational +" },
      { city: "New York", country: "United States", code: "JFK", status: "operational", tag: "Operational +" },
      { city: "Chicago", country: "United States", code: "ORD", status: "operational", tag: "Operational +" },
      { city: "Dallas", country: "United States", code: "DFW", status: "operational", tag: "Operational +" },
      { city: "Seattle", country: "United States", code: "SEA", status: "operational", tag: "Operational +" }
    ]
  },
  {
    region: "Latin America",
    totalCount: 42,
    pops: [
      { city: "Sao Paulo", country: "Brazil", code: "GRU", status: "operational", tag: "Operational +" },
      { city: "Santiago", country: "Chile", code: "SCL", status: "operational", tag: "Operational +" },
      { city: "Buenos Aires", country: "Argentina", code: "EZE", status: "operational", tag: "Operational +" }
    ]
  },
  {
    region: "Oceania",
    totalCount: 28,
    pops: [
      { city: "Sydney", country: "Australia", code: "SYD", status: "operational", tag: "Operational +" },
      { city: "Melbourne", country: "Australia", code: "MEL", status: "operational", tag: "Operational +" },
      { city: "Auckland", country: "New Zealand", code: "AKL", status: "operational", tag: "Operational +" }
    ]
  }
];

// 1.5 Unified Chronological History Records
const HISTORY_RECORDS = [
  {
    id: "hist-1",
    title: "ZRH (Zurich) on 2026-09-24",
    type: "maintenance",
    status: "In Progress",
    date: "24 Sept 2026, 7.00",
    service: "fl2",
    location: "ZRH",
    dotClass: "blue",
    statusClass: "status-text-progress"
  },
  {
    id: "hist-2",
    title: "DAC (Dhaka) on 2026-09-23",
    type: "maintenance",
    status: "Completed",
    date: "24 Sept 2026, 6.01",
    service: "fl2",
    location: "DAC",
    dotClass: "blue",
    statusClass: "status-text-completed"
  },
  {
    id: "hist-3",
    title: "WAW (Warsaw) on 2026-09-23",
    type: "maintenance",
    status: "In Progress",
    date: "24 Sept 2026, 6.00",
    service: "fl2",
    location: "WAW",
    dotClass: "blue",
    statusClass: "status-text-progress"
  },
  {
    id: "hist-4",
    title: "HNL (Honolulu) on 2026-09-23",
    type: "maintenance",
    status: "Completed",
    date: "24 Sept 2026, 5.00",
    service: "fl2",
    location: "HNL",
    dotClass: "blue",
    statusClass: "status-text-completed"
  },
  {
    id: "hist-5",
    title: "Intermittent authentication errors for API and R2",
    type: "incident",
    impact: "Minor",
    status: "Resolved",
    date: "24 Sept 2026, 3.59",
    service: "api",
    location: "all",
    dotClass: "amber",
    statusClass: "status-text-resolved"
  },
  {
    id: "hist-6",
    title: "PER (Perth) on 2026-09-23",
    type: "maintenance",
    status: "Completed",
    date: "24 Sept 2026, 3.00",
    service: "fl2",
    location: "PER",
    dotClass: "blue",
    statusClass: "status-text-completed"
  },
  {
    id: "hist-7",
    title: "BNE (Brisbane) on 2026-09-23",
    type: "maintenance",
    status: "Completed",
    date: "24 Sept 2026, 2.00",
    service: "fl2",
    location: "BNE",
    dotClass: "blue",
    statusClass: "status-text-completed"
  },
  {
    id: "hist-8",
    title: "Network Performance Degradation - Asia-Pacific",
    type: "incident",
    impact: "Minor",
    status: "Identified",
    date: "24 Sept 2026, 1.44",
    service: "fl2",
    location: "all",
    dotClass: "amber",
    statusClass: "status-text-identified"
  }
];

// ============================================================================
// 2. TAB ROUTING & CONTROLS
// ============================================================================

function switchTab(tabId) {
  activeTab = tabId;
  const tabs = ["overview", "services", "locations", "history"];

  tabs.forEach(t => {
    const btn = document.getElementById(`tab-${t}`);
    const view = document.getElementById(`view-${t}`);
    if (btn && view) {
      if (t === tabId) {
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");
        view.style.display = "block";
      } else {
        btn.classList.remove("active");
        btn.setAttribute("aria-selected", "false");
        view.style.display = "none";
      }
    }
  });

  if (tabId === "locations") {
    setTimeout(() => {
      if (!leafletMap) {
        initLocationsMap();
      } else {
        leafletMap.invalidateSize();
      }
    }, 100);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleTimezone() {
  useUtc = !useUtc;
  const label = document.getElementById("tz-label");
  if (label) {
    label.textContent = useUtc ? "UTC time" : "Local time";
  }
}

function cycleTheme() {
  const html = document.documentElement;
  const icon = document.getElementById("theme-icon");

  if (activeTheme === "dark") {
    activeTheme = "light";
    html.setAttribute("data-theme", "light");
    if (icon) icon.className = "ph ph-sun";
  } else {
    activeTheme = "dark";
    html.setAttribute("data-theme", "dark");
    if (icon) icon.className = "ph ph-moon";
  }

  updateMapTileLayer();
}

function toggleSimDock() {
  const dock = document.getElementById("floating-sim-dock");
  const toggleIcon = document.getElementById("dock-toggle-icon");
  if (!dock) return;

  isDockCollapsed = !isDockCollapsed;
  dock.classList.toggle("collapsed", isDockCollapsed);

  if (toggleIcon) {
    toggleIcon.className = isDockCollapsed ? "ph-bold ph-caret-up" : "ph-bold ph-caret-down";
  }
}

// ============================================================================
// 3. RENDERERS
// ============================================================================

// 3.1 Overview Tab
function renderOverview() {
  // Recent Incidents
  const recentContainer = document.getElementById("recent-incidents-list");
  if (recentContainer) {
    recentContainer.innerHTML = RECENT_INCIDENTS.map(inc => `
      <div class="incident-row">
        <div class="row-left">
          <span class="status-dot-circle amber"></span>
          <span class="row-title">${inc.title}</span>
        </div>
        <div class="row-right">
          <span class="impact-badge-minor">${inc.impact}</span>
          <span class="status-text-resolved">${inc.status}</span>
          <span class="row-date">${inc.date}</span>
        </div>
      </div>
    `).join("");
  }

  // Active Maintenance
  const maintContainer = document.getElementById("active-maintenance-list");
  if (maintContainer) {
    maintContainer.innerHTML = ACTIVE_MAINTENANCE.map(maint => `
      <div class="maintenance-row">
        <div class="row-left">
          <span class="status-dot-circle blue"></span>
          <span class="row-title">${maint.title}</span>
        </div>
        <div class="row-right">
          <span class="status-text-progress">${maint.status}</span>
          <span class="row-date">${maint.date}</span>
        </div>
      </div>
    `).join("");
  }
}

// 3.2 Services & Sites Tab
function renderServices() {
  const container = document.getElementById("service-groups-container");
  if (!container) return;

  const searchQuery = (document.getElementById("service-search")?.value || "").toLowerCase().trim();

  let html = "";

  SERVICE_GROUPS.forEach(group => {
    const filteredServices = group.services.filter(s =>
      s.name.toLowerCase().includes(searchQuery)
    );

    if (filteredServices.length === 0) return;

    const isCollapsed = collapsedGroups.has(group.id);

    html += `
      <div class="service-accordion-card" id="${group.id}">
        <div class="service-accordion-header" onclick="toggleServiceGroup('${group.id}')">
          <div class="accordion-title-left">
            <i class="ph-bold ph-caret-down accordion-chevron ${isCollapsed ? 'collapsed' : ''}"></i>
            <span>${group.name}</span>
          </div>
          <div class="accordion-count-right">
            <span>${filteredServices.length} services</span>
            <button type="button" class="btn-subscribe-plus ${isGroupFullySubscribed(group) ? 'subscribed' : ''}" onclick="toggleGroupSubscription(event, '${group.id}')" data-tooltip-name="${group.name}" aria-label="Subscribe to ${group.name}">
              <i class="${isGroupFullySubscribed(group) ? 'ph-bold ph-check' : 'ph ph-plus'}"></i>
            </button>
          </div>
        </div>
        <div class="service-accordion-body ${isCollapsed ? 'collapsed' : ''}">
    `;

    filteredServices.forEach(svc => {
      const isOutage = svc.status === "outage";
      const isDegraded = svc.status === "degraded";
      const rawStatus = svc.overrideLabel ? svc.overrideLabel.replace(" +", "") : (isOutage ? "Major Outage" : isDegraded ? "Degraded" : "Operational");
      const statusClass = isOutage ? "outage" : isDegraded ? "degraded" : "operational";
      const isSubscribed = userSubscriptions.has(svc.name);

      html += `
        <div class="service-item-row">
          <div class="service-item-header">
            <div class="service-name-left">
              <i class="ph-bold ph-check-circle service-check-icon"></i>
              <span>${svc.name}</span>
            </div>
            <div class="service-status-right ${statusClass}">
              <span>${rawStatus}</span>
              <button type="button" class="btn-subscribe-plus ${isSubscribed ? 'subscribed' : ''}" onclick="toggleServiceSubscription(event, '${group.id}', '${svc.name}')" data-tooltip-name="${svc.name}" aria-label="Subscribe to ${svc.name}">
                <i class="${isSubscribed ? 'ph-bold ph-check' : 'ph ph-plus'}"></i>
              </button>
            </div>
          </div>
          <!-- Uniform Micro-Precision 90-Day Uptime Grid -->
          <div class="uptime-grid" data-svc-name="${svc.name}">
            ${generateUptimeBars(svc)}
          </div>
          <!-- Uptime Legend with Dividing Hairlines -->
          <div class="uptime-legend-row">
            <span class="uptime-legend-label">90 days ago</span>
            <div class="uptime-legend-line"></div>
            <span class="uptime-legend-metric">${calculateUptimeMetric(svc)}</span>
            <div class="uptime-legend-line"></div>
            <span class="uptime-legend-label">Today</span>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  attachTooltipListeners();
}

function toggleServiceGroup(groupId) {
  if (collapsedGroups.has(groupId)) {
    collapsedGroups.delete(groupId);
  } else {
    collapsedGroups.add(groupId);
  }
  renderServices();
}

function filterServices() {
  renderServices();
}

// Generates exactly 90 uniform grid bars with guaranteed pixel-consistent spacing
function generateUptimeBars(svc) {
  let barsHtml = "";
  const degradedDays = new Set(svc.degradedDays || []);

  for (let day = 1; day <= 90; day++) {
    let tickClass = "";
    let note = "100% operational · Zero incidents";

    // Day 90 is current live runtime state
    if (day === 90) {
      if (svc.status === "outage") {
        tickClass = "outage";
        note = "Major Outage · 502 Bad Gateway (TryFromSliceError panic)";
      } else if (svc.status === "degraded") {
        tickClass = "degraded";
        note = "Degraded feature intake · 80 shadow columns shed at edge";
      }
    } else if (degradedDays.has(day)) {
      tickClass = "degraded";
      note = "Upstream catalog synchronization jitter · Minor latency";
    }

    barsHtml += `<div class="uptime-bar-tick ${tickClass}" data-day="${day}" data-note="${note}"></div>`;
  }
  return barsHtml;
}

function calculateUptimeMetric(svc) {
  if (currentSystemState === "break" && svc.status === "outage") {
    return "98.89 % uptime";
  }
  if (currentSystemState === "recover" && svc.id === "svc-fl2") {
    return "99.89 % uptime";
  }
  if (svc.status === "outage") {
    return "98.91 % uptime";
  }
  if (svc.status === "degraded") {
    return "99.78 % uptime";
  }
  if (svc.degradedDays && svc.degradedDays.length > 0) {
    return "99.89 % uptime";
  }
  return "100 % uptime";
}

// 3.3 Locations Tab
function renderLocations() {
  const container = document.getElementById("locations-accordion-container");
  if (!container) return;

  const searchQuery = (document.getElementById("location-search")?.value || "").toLowerCase().trim();
  const selectedRegion = document.getElementById("region-filter")?.value || "all";

  let html = "";

  REGIONAL_LOCATIONS.forEach(reg => {
    if (selectedRegion !== "all" && reg.region !== selectedRegion) {
      return;
    }

    const filteredPops = reg.pops.filter(pop =>
      pop.city.toLowerCase().includes(searchQuery) ||
      pop.country.toLowerCase().includes(searchQuery) ||
      pop.code.toLowerCase().includes(searchQuery)
    );

    if (filteredPops.length === 0) return;

    const isCollapsed = collapsedRegions.has(reg.region);

    html += `
      <div class="service-accordion-card" id="region-${reg.region}">
        <div class="service-accordion-header" onclick="toggleRegion('${reg.region}')">
          <div class="accordion-title-left">
            <i class="ph-bold ph-caret-down accordion-chevron ${isCollapsed ? 'collapsed' : ''}"></i>
            <span>${reg.region}</span>
          </div>
          <div class="accordion-count-right">
            <span>${reg.totalCount} locations</span>
            <button type="button" class="btn-subscribe-plus ${isRegionFullySubscribed(reg) ? 'subscribed' : ''}" onclick="toggleRegionSubscription(event, '${reg.region}')" data-tooltip-name="${reg.region}" aria-label="Subscribe to ${reg.region}">
              <i class="${isRegionFullySubscribed(reg) ? 'ph-bold ph-check' : 'ph ph-plus'}"></i>
            </button>
          </div>
        </div>
        <div class="service-accordion-body ${isCollapsed ? 'collapsed' : ''}">
    `;

    filteredPops.forEach(pop => {
      let statusDotClass = pop.status === "rerouted" ? "rerouted" : "operational";
      let statusTagClass = pop.status === "rerouted" ? "rerouted" : "";
      let statusTagText = pop.tag;

      if (currentSystemState === "break") {
        statusDotClass = "outage";
        statusTagClass = "outage";
        statusTagText = "502 CRASH";
      } else if (currentSystemState === "recover" && pop.status === "rerouted") {
        statusDotClass = "operational";
        statusTagClass = "";
        statusTagText = "Operational";
      }

      const cleanTag = (statusTagText || "").replace(" +", "");
      const isSubscribed = userSubscriptions.has(pop.city);

      html += `
        <div class="location-row" onclick="focusPopCode('${pop.code}')">
          <div class="location-left">
            <span class="location-dot ${statusDotClass}"></span>
            <span class="location-name">${pop.city}, ${pop.country}</span>
            <span class="location-code">${pop.code}</span>
          </div>
          <div class="location-status-right">
            <div class="location-status-tag ${statusTagClass}">
              ${cleanTag}
            </div>
            <button type="button" class="btn-subscribe-plus ${isSubscribed ? 'subscribed' : ''}" onclick="toggleLocationSubscription(event, '${reg.region}', '${pop.city}')" data-tooltip-name="${pop.city} (${pop.code})" aria-label="Subscribe to ${pop.city}">
              <i class="${isSubscribed ? 'ph-bold ph-check' : 'ph ph-plus'}"></i>
            </button>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  attachTooltipListeners();
}

function toggleRegion(regionName) {
  if (collapsedRegions.has(regionName)) {
    collapsedRegions.delete(regionName);
  } else {
    collapsedRegions.add(regionName);
  }
  renderLocations();
}

function filterLocations() {
  renderLocations();
}

// 3.4 History Tab
function renderHistory() {
  const container = document.getElementById("history-list-container");
  if (!container) return;

  const typeFilter = document.getElementById("history-filter-type")?.value || "all";
  const serviceFilter = document.getElementById("history-filter-service")?.value || "all";
  const locationFilter = document.getElementById("history-filter-location")?.value || "all";

  const filtered = HISTORY_RECORDS.filter(item => {
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    if (serviceFilter !== "all" && item.service !== serviceFilter) return false;
    if (locationFilter !== "all" && item.location !== locationFilter && item.location !== "all") return false;
    return true;
  });

  container.innerHTML = filtered.map(item => `
    <div class="incident-row">
      <div class="row-left">
        <span class="status-dot-circle ${item.dotClass}"></span>
        <span class="row-title">${item.title}</span>
      </div>
      <div class="row-right">
        ${item.impact ? `<span class="impact-badge-minor">${item.impact}</span>` : ""}
        <span class="${item.statusClass}">${item.status}</span>
        <span class="row-date">${item.date}</span>
      </div>
    </div>
  `).join("");
}

function filterHistory() {
  renderHistory();
}

// ============================================================================
// 4. SIMULATOR STATE ENGINE (Normal / Break / Recover)
// ============================================================================

function setSystemState(state) {
  currentSystemState = state;

  // Simulator Buttons
  const btnNom = document.getElementById("btn-state-nominal");
  const btnBrk = document.getElementById("btn-state-break");
  const btnRec = document.getElementById("btn-state-recover");

  if (btnNom) btnNom.classList.toggle("active", state === "nominal");
  if (btnBrk) btnBrk.classList.toggle("active", state === "break");
  if (btnRec) btnRec.classList.toggle("active", state === "recover");

  // Dock Header Badge
  const dockDot = document.getElementById("dock-status-dot");
  const dockBadge = document.getElementById("dock-state-badge");
  if (dockDot) {
    dockDot.className = `dock-dot ${state === 'break' ? 'outage' : state === 'recover' ? 'degraded' : 'operational'}`;
  }
  if (dockBadge) {
    dockBadge.textContent = state === 'break' ? 'Break 502 (280)' : state === 'recover' ? 'Recover (200/80)' : 'Nominal (200)';
  }

  // Active Incidents in Overview Tab
  const activeSection = document.getElementById("active-incidents-section");
  const activeList = document.getElementById("active-incidents-list");

  // Services & Sites Counters
  const mOper = document.getElementById("metric-operational");
  const mDegr = document.getElementById("metric-degraded");
  const mOffl = document.getElementById("metric-offline");
  const mMain = document.getElementById("metric-maintenance");

  if (state === "nominal") {
    if (activeSection) activeSection.style.display = "none";
    if (activeList) activeList.innerHTML = "";

    if (mOper) mOper.textContent = "125";
    if (mDegr) mDegr.textContent = "3";
    if (mOffl) mOffl.textContent = "0";
    if (mMain) mMain.textContent = "0";

    setServiceStatus("svc-fl2", "operational", "Operational");
    setServiceStatus("svc-catalog", "operational", "Operational");

  } else if (state === "break") {
    if (activeSection) activeSection.style.display = "block";
    if (activeList) {
      activeList.innerHTML = `
        <div class="active-incident-card">
          <div class="active-incident-main">
            <div class="active-incident-title">
              CRITICAL: L7 Edge Proxy Ingestion Panic (TryFromSliceError)
            </div>
            <span class="active-incident-tag">Core FL2 Proxy Engine</span>
          </div>
          <span class="active-incident-badge outage">Investigating</span>
        </div>
        <div class="active-incident-card">
          <div class="active-incident-main">
            <div class="active-incident-title">
              Cross-Boundary Schema Reflection Cardinality Drift (280 Features)
            </div>
            <span class="active-incident-tag">ClickHouse system.columns</span>
          </div>
          <span class="active-incident-badge">Identified</span>
        </div>
      `;
    }

    if (mOper) mOper.textContent = "122";
    if (mDegr) mDegr.textContent = "3";
    if (mOffl) mOffl.textContent = "3";
    if (mMain) mMain.textContent = "0";

    setServiceStatus("svc-fl2", "outage", "Major Outage");
    setServiceStatus("svc-catalog", "degraded", "Degraded");

  } else if (state === "recover") {
    if (activeSection) activeSection.style.display = "block";
    if (activeList) {
      activeList.innerHTML = `
        <div class="active-incident-card">
          <div class="active-incident-main">
            <div class="active-incident-title">
              RESOLVED: In-Place Partial Selection Shed 80 Shadow Columns (100% Uptime)
            </div>
            <span class="active-incident-tag">Zero-Alloc Ingestion Engine</span>
          </div>
          <span class="active-incident-badge resolved">Resolved</span>
        </div>
      `;
    }

    if (mOper) mOper.textContent = "124";
    if (mDegr) mDegr.textContent = "4";
    if (mOffl) mOffl.textContent = "0";
    if (mMain) mMain.textContent = "0";

    setServiceStatus("svc-fl2", "degraded", "Operational (80 Shed)");
    setServiceStatus("svc-catalog", "operational", "Operational");
  }

  renderServices();
  renderLocations();
}

function setServiceStatus(svcId, status, label) {
  for (const group of SERVICE_GROUPS) {
    for (const svc of group.services) {
      if (svc.id === svcId) {
        svc.status = status;
        svc.overrideLabel = label;
      }
    }
  }
}

// ============================================================================
// 5. TOOLTIPS, SUBSCRIPTIONS & LEAFLET MAP
// ============================================================================

function positionArrowTooltip(target, htmlContent) {
  const tooltip = document.getElementById("kumo-arrow-tooltip");
  if (!tooltip || !target) return;

  tooltip.innerHTML = htmlContent;
  tooltip.style.display = "block";

  const rect = target.getBoundingClientRect();
  const targetCenterX = rect.left + (rect.width / 2);
  const targetTop = rect.top;

  const tooltipWidth = tooltip.offsetWidth;
  let tooltipLeft = targetCenterX;

  const halfWidth = tooltipWidth / 2;
  const padding = 12;

  if (tooltipLeft + halfWidth > window.innerWidth - padding) {
    tooltipLeft = window.innerWidth - padding - halfWidth;
  }
  if (tooltipLeft - halfWidth < padding) {
    tooltipLeft = padding + halfWidth;
  }

  const tooltipBoxLeft = tooltipLeft - halfWidth;
  const arrowOffset = Math.max(12, Math.min(tooltipWidth - 12, targetCenterX - tooltipBoxLeft));

  tooltip.style.setProperty("--arrow-left", `${arrowOffset}px`);
  tooltip.style.left = `${tooltipLeft}px`;
  tooltip.style.top = `${targetTop}px`;
}

function hideArrowTooltip() {
  const tooltip = document.getElementById("kumo-arrow-tooltip");
  if (tooltip) {
    tooltip.style.display = "none";
  }
}

function attachTooltipListeners() {
  const tooltip = document.getElementById("kumo-arrow-tooltip");
  if (!tooltip) return;

  // 1. Tooltips for Circular Subscribe Plus Buttons
  const subscribeButtons = document.querySelectorAll(".btn-subscribe-plus");
  subscribeButtons.forEach(btn => {
    btn.addEventListener("mouseenter", () => {
      const name = btn.getAttribute("data-tooltip-name") || "selection";
      const isSubscribed = userSubscriptions.has(name) || btn.classList.contains("subscribed");
      const action = isSubscribed ? "Remove" : "Add";
      positionArrowTooltip(btn, `${action} ${name} to selection`);
    });

    btn.addEventListener("mouseleave", () => {
      hideArrowTooltip();
    });
  });

  // 2. Tooltips for 90-Day Uptime Bar Ticks
  const ticks = document.querySelectorAll(".uptime-bar-tick");
  ticks.forEach(tick => {
    tick.addEventListener("mouseenter", () => {
      const day = tick.getAttribute("data-day");
      const note = tick.getAttribute("data-note");
      const svcName = tick.closest(".uptime-grid")?.getAttribute("data-svc-name") || "Service";

      const content = `<div style="font-weight: 600;">Day ${day}/90 · ${svcName}</div><div style="color: var(--text-dim); font-size: 0.75rem; margin-top: 2px;">${note}</div>`;
      positionArrowTooltip(tick, content);
    });

    tick.addEventListener("mouseleave", () => {
      hideArrowTooltip();
    });
  });
}

function isGroupFullySubscribed(group) {
  if (!group || !group.services || group.services.length === 0) return false;
  return group.services.every(s => userSubscriptions.has(s.name));
}

function isRegionFullySubscribed(reg) {
  if (!reg || !reg.pops || reg.pops.length === 0) return false;
  return reg.pops.every(p => userSubscriptions.has(p.city));
}

function toggleGroupSubscription(event, groupId) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  const group = SERVICE_GROUPS.find(g => g.id === groupId || g.name === groupId);
  if (!group) return;

  const fullySubscribed = isGroupFullySubscribed(group);

  if (fullySubscribed) {
    group.services.forEach(s => userSubscriptions.delete(s.name));
    userSubscriptions.delete(group.name);
    showToast(`Removed ${group.name} and all services from selection`);
  } else {
    group.services.forEach(s => userSubscriptions.add(s.name));
    userSubscriptions.add(group.name);
    showToast(`Added ${group.name} and all services to selection`);
  }

  renderServices();

  const tooltip = document.getElementById("kumo-arrow-tooltip");
  if (tooltip && tooltip.style.display === "block") {
    const isNowSubscribed = isGroupFullySubscribed(group);
    tooltip.innerHTML = `${isNowSubscribed ? "Remove" : "Add"} ${group.name} to selection`;
  }
}

function toggleServiceSubscription(event, groupId, svcName) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  const group = SERVICE_GROUPS.find(g => g.id === groupId || g.name === groupId);
  const wasSubscribed = userSubscriptions.has(svcName);

  if (wasSubscribed) {
    userSubscriptions.delete(svcName);
    if (group) userSubscriptions.delete(group.name);
    showToast(`Removed ${svcName} from selection`);
  } else {
    userSubscriptions.add(svcName);
    if (group && isGroupFullySubscribed(group)) {
      userSubscriptions.add(group.name);
    }
    showToast(`Added ${svcName} to selection`);
  }

  renderServices();

  const tooltip = document.getElementById("kumo-arrow-tooltip");
  if (tooltip && tooltip.style.display === "block") {
    const isNowSubscribed = userSubscriptions.has(svcName);
    tooltip.innerHTML = `${isNowSubscribed ? "Remove" : "Add"} ${svcName} to selection`;
  }
}

function toggleRegionSubscription(event, regionName) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  const reg = REGIONAL_LOCATIONS.find(r => r.region === regionName);
  if (!reg) return;

  const fullySubscribed = isRegionFullySubscribed(reg);

  if (fullySubscribed) {
    reg.pops.forEach(p => userSubscriptions.delete(p.city));
    userSubscriptions.delete(reg.region);
    showToast(`Removed ${reg.region} and all locations from selection`);
  } else {
    reg.pops.forEach(p => userSubscriptions.add(p.city));
    userSubscriptions.add(reg.region);
    showToast(`Added ${reg.region} and all locations to selection`);
  }

  renderLocations();

  const tooltip = document.getElementById("kumo-arrow-tooltip");
  if (tooltip && tooltip.style.display === "block") {
    const isNowSubscribed = isRegionFullySubscribed(reg);
    tooltip.innerHTML = `${isNowSubscribed ? "Remove" : "Add"} ${reg.region} to selection`;
  }
}

function toggleLocationSubscription(event, regionName, popCity) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  const reg = REGIONAL_LOCATIONS.find(r => r.region === regionName);
  const wasSubscribed = userSubscriptions.has(popCity);

  if (wasSubscribed) {
    userSubscriptions.delete(popCity);
    if (reg) userSubscriptions.delete(reg.region);
    showToast(`Removed ${popCity} from selection`);
  } else {
    userSubscriptions.add(popCity);
    if (reg && isRegionFullySubscribed(reg)) {
      userSubscriptions.add(reg.region);
    }
    showToast(`Added ${popCity} to selection`);
  }

  renderLocations();

  const tooltip = document.getElementById("kumo-arrow-tooltip");
  if (tooltip && tooltip.style.display === "block") {
    const isNowSubscribed = userSubscriptions.has(popCity);
    tooltip.innerHTML = `${isNowSubscribed ? "Remove" : "Add"} ${popCity} to selection`;
  }
}

function toggleSubscription(event, name) {
  const group = SERVICE_GROUPS.find(g => g.name === name || g.id === name);
  if (group) return toggleGroupSubscription(event, group.id);

  for (const g of SERVICE_GROUPS) {
    const svc = g.services.find(s => s.name === name || s.id === name);
    if (svc) return toggleServiceSubscription(event, g.id, svc.name);
  }

  const reg = REGIONAL_LOCATIONS.find(r => r.region === name);
  if (reg) return toggleRegionSubscription(event, reg.region);

  for (const r of REGIONAL_LOCATIONS) {
    const pop = r.pops.find(p => p.city === name || `${p.city} (${p.code})` === name);
    if (pop) return toggleLocationSubscription(event, r.region, pop.city);
  }

  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  if (userSubscriptions.has(name)) {
    userSubscriptions.delete(name);
    showToast(`Removed ${name} from selection`);
  } else {
    userSubscriptions.add(name);
    showToast(`Added ${name} to selection`);
  }
  renderServices();
  renderLocations();
}

function showToast(message) {
  const toast = document.getElementById("kumo-toast");
  const msgElem = document.getElementById("toast-message");
  if (!toast || !msgElem) return;

  msgElem.textContent = message;
  toast.classList.add("visible");

  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }
  toastTimeout = setTimeout(() => {
    toast.classList.remove("visible");
  }, 2500);
}

function subscribeToUpdates() {
  showToast("Subscribed to all incident updates");
}

Object.assign(window, {
  switchTab,
  toggleTimezone,
  cycleTheme,
  toggleSimDock,
  toggleServiceGroup,
  toggleRegion,
  filterServices,
  filterLocations,
  filterHistory,
  focusPopCode,
  resetMapView,
  setSystemState,
  isGroupFullySubscribed,
  isRegionFullySubscribed,
  toggleGroupSubscription,
  toggleServiceSubscription,
  toggleRegionSubscription,
  toggleLocationSubscription,
  toggleSubscription,
  showToast,
  subscribeToUpdates
});
window.addEventListener("scroll", hideArrowTooltip, { passive: true });

function initLocationsMap() {
  const mapElem = document.getElementById("locations-map");
  if (!mapElem || leafletMap) return;
  if (typeof L === "undefined") return;

  leafletMap = L.map("locations-map", {
    center: [25, 10],
    zoom: 2,
    minZoom: 1,
    maxZoom: 10,
    scrollWheelZoom: false,
    attributionControl: false
  });

  updateMapTileLayer();
}

function updateMapTileLayer() {
  if (!leafletMap || typeof L === "undefined") return;

  if (!tileLayer) {
    tileLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19
    }).addTo(leafletMap);
  }
}

function resetMapView() {
  if (leafletMap) {
    leafletMap.setView([25, 10], 2);
  }
}

function focusPopCode(code) {
  // Switch to Locations if needed
  if (activeTab !== "locations") {
    switchTab("locations");
  }
}

function applyInitialStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const stateParam = params.get("state") || window.location.hash.replace("#", "");
  if (["nominal", "break", "recover"].includes(stateParam)) {
    setSystemState(stateParam);
  }
}

async function pollSystemStatus() {
  try {
    const res = await fetch("status.json?_=" + Date.now(), { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data && data.state && ["nominal", "break", "recover"].includes(data.state)) {
        if (data.state !== currentSystemState) {
          setSystemState(data.state);
        }
      }
    }
  } catch (_) {
    // Silent failover when running static on GitHub Pages
  }
}

window.addEventListener("hashchange", applyInitialStateFromUrl);
window.addEventListener("popstate", applyInitialStateFromUrl);

document.addEventListener("DOMContentLoaded", () => {
  renderOverview();
  renderServices();
  renderLocations();
  renderHistory();
  applyInitialStateFromUrl();
  setInterval(pollSystemStatus, 1000);
});
