const form = document.querySelector("#routeForm");
const maxHours = document.querySelector("#maxHours");
const maxHoursLabel = document.querySelector("#maxHoursLabel");
const stopList = document.querySelector("#stopList");
const resultTitle = document.querySelector("#resultTitle");
const resultIntro = document.querySelector("#resultIntro");
const trafficAdvice = document.querySelector("#trafficAdvice");
const hotelAdvice = document.querySelector("#hotelAdvice");
const bestTimeAdvice = document.querySelector("#bestTimeAdvice");
const personalSummary = document.querySelector("#personalSummary");
const ageTips = document.querySelector("#ageTips");
const travelChecklist = document.querySelector("#travelChecklist");
const googleMapsFrame = document.querySelector("#googleMapsFrame");
const googleMapsLink = document.querySelector("#googleMapsLink");
const mapsRouteLabel = document.querySelector("#mapsRouteLabel");

const destinationProfiles = [
  {
    keywords: ["spanje", "barcelona", "girona", "costa", "valencia"],
    country: "Spanje",
    hotelRegion:
      "Voor Spanje is een overnachting rond Lyon, Valence of Orange logisch. Met kinderen is een hotel met familiekamer, ontbijt en snelle toegang tot de snelweg het meest ontspannen.",
    traffic:
      "Richting Spanje kan het rond Lyon, Valence en de grens druk worden. Plan de lunch liever voor de grote knooppunten en houd de middag flexibel."
  },
  {
    keywords: ["italie", "italië", "toscane", "gardameer", "milaan", "venetie", "venetië"],
    country: "Italie",
    hotelRegion:
      "Voor Italie werkt Zuid-Duitsland, Oostenrijk of Noord-Zwitserland vaak goed als tussenstop. Kies een plaats waar je de volgende ochtend snel weer op route zit.",
    traffic:
      "Richting Italie kan vertraging ontstaan bij tunnels, grensovergangen en bergtrajecten. Een vroege start en ruime pauzes helpen veel."
  },
  {
    keywords: ["frankrijk", "parijs", "provence", "annecy", "bordeaux", "normandie", "normandië", "ardeche", "ardèche"],
    country: "Frankrijk",
    hotelRegion:
      "Voor Zuid-Frankrijk zijn Dijon, Beaune, Macon of de omgeving van Lyon praktische hotelregio's. Reis met kinderen liever niet te ver door tot laat in de avond.",
    traffic:
      "Richting Frankrijk zijn Parijs en Lyon bekende druktepunten. Vermijd daar waar mogelijk de lunchpiek en de vroege avond."
  },
  {
    keywords: ["duitsland", "beieren", "berlijn", "zwarte woud", "munchen", "münchen"],
    country: "Duitsland",
    hotelRegion:
      "Voor Duitsland is een hotel net buiten Keulen, Frankfurt, Stuttgart of München vaak praktisch: rustiger parkeren en toch snel terug op de snelweg.",
    traffic:
      "In Duitsland kunnen wegwerkzaamheden voor vertraging zorgen. Kies stops met meerdere voorzieningen, zodat je makkelijk kunt schuiven."
  }
];

const preferenceText = {
  speeltuin: "speelruimte of speeltuin",
  restaurant: "een makkelijke lunchplek",
  toilet: "schone toiletten",
  hotel: "hotelopties in de buurt",
  laadpaal: "laadpalen",
  zwembad: "een zwembad of waterpret"
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatHours(value) {
  return Number(value).toLocaleString("nl-NL", {
    minimumFractionDigits: Number(value) % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1
  });
}

function addMinutes(time, minutes) {
  const [hours, mins] = time.split(":").map(Number);
  const date = new Date(2026, 0, 1, hours, mins + minutes);
  return date.toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function parseAges(ages) {
  return ages
    .split(/[^0-9]+/)
    .map((age) => Number(age))
    .filter((age) => age > 0 && age < 18);
}

function getProfile(destination) {
  const normalized = destination.toLowerCase();
  return (
    destinationProfiles.find((profile) =>
      profile.keywords.some((keyword) => normalized.includes(keyword))
    ) || destinationProfiles[2]
  );
}

function getPreferences(formData) {
  return formData.getAll("preferences");
}

function describePreferences(preferences) {
  if (!preferences.length) {
    return "een rustige, eenvoudige stop zonder extra voorkeuren";
  }

  return preferences.map((preference) => preferenceText[preference] || preference).join(", ");
}

function getMapsRoute(origin, destination) {
  const fallbackOrigin = "Nederland";
  const fallbackDestination = "Zuid-Frankrijk";
  const routeOrigin = origin && origin.trim() ? origin.trim() : fallbackOrigin;
  const routeDestination = destination && destination.trim() ? destination.trim() : fallbackDestination;
  const encodedOrigin = encodeURIComponent(routeOrigin);
  const encodedDestination = encodeURIComponent(routeDestination);
  const routeText = `${routeOrigin} naar ${routeDestination}`;

  return {
    label: routeText,
    embedUrl: `https://www.google.com/maps?q=${encodeURIComponent(routeText)}&output=embed`,
    linkUrl: `https://www.google.com/maps/dir/?api=1&origin=${encodedOrigin}&destination=${encodedDestination}&travelmode=driving`
  };
}

function getBestTime(time, children, maxHours) {
  const childCount = Number(children);
  const longBlocks = Number(maxHours) >= 3;

  if (time > "08:00") {
    return {
      label: "06:15",
      text: `Jullie geplande vertrektijd is ${time}. Voor ${childCount} kind${childCount === 1 ? "" : "eren"} is 06:15 vaak prettiger: de eerste kilometers zijn rustiger en de eerste pauze valt nog voor de lunchdrukte.`
    };
  }

  if (time < "06:00") {
    return {
      label: "07:00",
      text: `Een start rond 07:00 is waarschijnlijk net iets haalbaarder voor het gezin dan ${time}, zeker als de kinderen nog moeten ontbijten en wakker worden.`
    };
  }

  return {
    label: longBlocks ? "06:45" : time,
    text: `Jullie vertrektijd van ${time} past goed bij rijblokken van maximaal ${formatHours(maxHours)} uur. Houd de eerste stop bewust kort en actief.`
  };
}

function buildStops(data) {
  const maxBlockMinutes = Number(data.maxHours) * 60;
  const preferences = describePreferences(data.preferences);
  const childrenText = `${data.children} kind${Number(data.children) === 1 ? "" : "eren"}`;

  const templates = [
    {
      title: "Eerste beweegstop",
      minutes: Math.round(maxBlockMinutes * 0.85),
      detail: `Na vertrek uit ${data.origin} is dit het moment voor toilet, water en tien minuten bewegen. Zoek bij voorkeur naar ${preferences}.`
    },
    {
      title: "Lunchstop",
      minutes: Math.round(maxBlockMinutes * 1.9) + 35,
      detail: `Plan een ruime pauze voordat iedereen hongerig wordt. Voor ${childrenText} werkt een plek met schaduw, simpele lunch en korte speelmogelijkheid het best.`
    },
    {
      title: "Middagpauze",
      minutes: Math.round(maxBlockMinutes * 2.9) + 75,
      detail: `Gebruik deze stop om de achterbank te resetten: schermpauze, kleine snack, frisse lucht en opnieuw uitleggen wat de volgende etappe is.`
    },
    {
      title: "Hotel- of eindblok",
      minutes: Math.round(maxBlockMinutes * 3.8) + 115,
      detail: `Rijd dit blok alleen door als iedereen nog redelijk ontspannen is. Kies anders een hotelregio op tijd, liever voor het avondeten dan erna.`
    }
  ];

  return templates.map((template) => ({
    time: addMinutes(data.time, template.minutes),
    title: template.title,
    body: template.detail
  }));
}

function buildAgeTips(ages) {
  const parsedAges = parseAges(ages);
  const groups = [];

  if (!parsedAges.length || parsedAges.some((age) => age <= 3)) {
    groups.push({
      title: "0-3 jaar",
      text: "Plan korte blokken, vaste snackmomenten en stops waar verschonen en rustig rondlopen makkelijk kan."
    });
  }

  if (!parsedAges.length || parsedAges.some((age) => age >= 4 && age <= 7)) {
    groups.push({
      title: "4-7 jaar",
      text: "Werk met aftelkaartjes, luisterverhalen en kleine opdrachten tot de volgende stop."
    });
  }

  if (!parsedAges.length || parsedAges.some((age) => age >= 8 && age <= 12)) {
    groups.push({
      title: "8-12 jaar",
      text: "Geef kinderen een rol: route meekijken, stop kiezen uit twee opties of een vakantiedagboek bijhouden."
    });
  }

  if (parsedAges.some((age) => age >= 13)) {
    groups.push({
      title: "Tieners",
      text: "Maak afspraken over schermtijd, laat ze eigen muziek of podcasts kiezen en plan stops met wifi of goede lunch."
    });
  }

  return groups;
}

function buildChecklist(data) {
  const list = [
    `Download offline kaarten voor ${data.destination}.`,
    `Zet snacks, water en doekjes binnen handbereik.`,
    `Leg per rijblok van maximaal ${formatHours(data.maxHours)} uur een kleine activiteit klaar.`,
    "Neem een aparte tas mee voor zwemspullen, opladers en hotelovernachting.",
    "Check voor vertrek tolbadges, milieustickers en laadpassen als die nodig zijn."
  ];

  if (data.preferences.includes("laadpaal")) {
    list.push("Markeer vooraf twee laadopties per etappe, zodat je niet afhankelijk bent van een enkele stop.");
  }

  if (data.preferences.includes("zwembad")) {
    list.push("Pak zwemkleding bovenin de tas, handig voor een hotel of lange middagstop.");
  }

  return list;
}

function renderSummary(data, bestTime) {
  const items = [
    ["Route", `${data.origin} naar ${data.destination}`],
    ["Gezin", `${data.children} kind${Number(data.children) === 1 ? "" : "eren"} (${data.ages})`],
    ["Rijblok", `max. ${formatHours(data.maxHours)} uur tussen stops`],
    ["Beste start", bestTime.label]
  ];

  personalSummary.innerHTML = items
    .map(
      ([label, value]) => `
        <article class="summary-pill">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </article>
      `
    )
    .join("");
}

function renderAdvice(data) {
  const profile = getProfile(data.destination);
  const bestTime = getBestTime(data.time, data.children, data.maxHours);
  const stops = buildStops(data);
  const preferenceSummary = describePreferences(data.preferences);
  const mapsRoute = getMapsRoute(data.origin, data.destination);

  resultTitle.textContent = `Persoonlijk voorbeeldadvies van ${data.origin} naar ${data.destination}`;
  resultIntro.textContent = `Voor jullie reis richting ${profile.country} gaan we uit van vertrek om ${data.time}, ${data.children} kind${Number(data.children) === 1 ? "" : "eren"} met leeftijden ${data.ages}, rijblokken van maximaal ${formatHours(data.maxHours)} uur en onderweg voorkeur voor ${preferenceSummary}.`;
  trafficAdvice.textContent = profile.traffic;
  hotelAdvice.textContent = profile.hotelRegion;
  bestTimeAdvice.textContent = bestTime.text;
  googleMapsFrame.src = mapsRoute.embedUrl;
  googleMapsLink.href = mapsRoute.linkUrl;
  mapsRouteLabel.textContent = `Routekaart: ${mapsRoute.label}.`;

  renderSummary(data, bestTime);

  stopList.innerHTML = stops
    .map(
      (stop) => `
        <article class="stop-card">
          <div class="stop-time">${escapeHtml(stop.time)}</div>
          <div>
            <h3>${escapeHtml(stop.title)}</h3>
            <p>${escapeHtml(stop.body)}</p>
          </div>
        </article>
      `
    )
    .join("");

  ageTips.innerHTML = buildAgeTips(data.ages)
    .map(
      (tip) => `
        <article>
          <strong>${escapeHtml(tip.title)}</strong>
          <p>${escapeHtml(tip.text)}</p>
        </article>
      `
    )
    .join("");

  travelChecklist.innerHTML = buildChecklist(data)
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  document.querySelector("#kidTips").firstElementChild.querySelector("p").textContent =
    `Voor jullie kinderen (${data.ages}) werkt een rit in duidelijke kleine etappes beter dan praten over de hele afstand naar ${data.destination}.`;
}

function readForm() {
  const formData = new FormData(form);
  return {
    origin: formData.get("origin").trim(),
    destination: formData.get("destination").trim(),
    date: formData.get("date"),
    time: formData.get("time"),
    children: formData.get("children"),
    ages: formData.get("ages").trim(),
    maxHours: formData.get("maxHours"),
    preferences: getPreferences(formData)
  };
}

maxHours.addEventListener("input", () => {
  maxHoursLabel.textContent = formatHours(maxHours.value);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderAdvice(readForm());
  document.querySelector("#advies").scrollIntoView({ behavior: "smooth" });
});

renderAdvice({
  origin: "Utrecht",
  destination: "Annecy, Frankrijk",
  date: "",
  time: "07:30",
  children: "2",
  ages: "4 en 7",
  maxHours: "2.5",
  preferences: ["speeltuin", "restaurant", "toilet"]
});
