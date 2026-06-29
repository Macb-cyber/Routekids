const form = document.querySelector("#routeForm");
const maxHours = document.querySelector("#maxHours");
const maxHoursLabel = document.querySelector("#maxHoursLabel");
const stopList = document.querySelector("#stopList");
const resultTitle = document.querySelector("#resultTitle");
const resultIntro = document.querySelector("#resultIntro");
const trafficAdvice = document.querySelector("#trafficAdvice");
const hotelAdvice = document.querySelector("#hotelAdvice");
const timeAdvice = document.querySelector("#timeAdvice");

const destinationProfiles = [
  {
    keywords: ["spanje", "barcelona", "girona", "costa", "valencia"],
    country: "Spanje",
    hotelRegion: "Rond Lyon of net onder Valence is vaak fijn: ver genoeg op weg, maar nog met veel gezinshotels.",
    traffic: "Druk op zaterdagen en rond Lyon. Plan de lunchstop voor of na de grote knooppunten."
  },
  {
    keywords: ["italie", "italië", "toscane", "gardameer", "milaan", "venetie", "venetië"],
    country: "Italie",
    hotelRegion: "Kijk naar Zuid-Duitsland of Noord-Zwitserland voor een ontspannen tussenstop met korte tweede reisdag.",
    traffic: "Middelmatig tot druk bij tunnels en grensovergangen. Een vroege start helpt veel."
  },
  {
    keywords: ["frankrijk", "parijs", "provence", "annecy", "bordeaux", "normandie", "normandië"],
    country: "Frankrijk",
    hotelRegion: "Voor Zuid-Frankrijk is de regio Dijon, Beaune of Macon praktisch en kindvriendelijk.",
    traffic: "Let op de ringwegen rond Parijs en Lyon. Reis buiten de lunchpiek waar mogelijk."
  },
  {
    keywords: ["duitsland", "beieren", "berlijn", "zwarte woud", "munchen", "münchen"],
    country: "Duitsland",
    hotelRegion: "Een hotel net buiten Keulen, Frankfurt of Stuttgart geeft vaak rust en goede parkeeropties.",
    traffic: "Wegwerkzaamheden kunnen vertragen. Kies stops met ruime marge en meerdere voorzieningen."
  }
];

const stopTemplates = [
  {
    label: "Eerste beweegstop",
    detail: "Korte pauze met toilet, fruit en tien minuten rennen of klimmen."
  },
  {
    label: "Lunchstop",
    detail: "Zoek een plek met restaurant, picknicktafel en ruimte om energie kwijt te raken."
  },
  {
    label: "Middagpauze",
    detail: "Plan iets langer: drinken bijvullen, schermpauze en een kleine verrassing voor de achterbank."
  },
  {
    label: "Avond- of hotelstop",
    detail: "Rond af voordat iedereen oververmoeid is. Kies liefst parkeren bij de deur en ontbijt inbegrepen."
  }
];

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

function buildStops(data) {
  const maxBlockMinutes = Number(data.maxHours) * 60;
  const preferredText = data.preferences.length
    ? `Voorkeuren: ${data.preferences.join(", ")}.`
    : "Geen extra voorkeuren gekozen.";

  return stopTemplates.map((template, index) => {
    const driveMinutes = Math.round(maxBlockMinutes * (index === 0 ? 0.9 : 1));
    const stopTime = addMinutes(data.time, driveMinutes * (index + 1) + index * 35);
    return {
      time: stopTime,
      title: template.label,
      body: `${template.detail} ${preferredText}`
    };
  });
}

function buildKidTip(children, ages) {
  const ageText = ages ? `met leeftijden ${ages}` : "van verschillende leeftijden";
  return `Voor ${children} kind${Number(children) === 1 ? "" : "eren"} ${ageText}: wissel rustige blokken af met korte opdrachten, luisterverhalen en duidelijke aftelmomenten tot de volgende stop.`;
}

function renderAdvice(data) {
  const profile = getProfile(data.destination);
  const stops = buildStops(data);
  const alternativeTime = data.time > "07:00" ? "06:15" : "08:45";

  resultTitle.textContent = `Routeadvies van ${data.origin} naar ${data.destination}`;
  resultIntro.textContent = `Voor jullie reis richting ${profile.country} adviseren we rijblokken van maximaal ${formatHours(data.maxHours)} uur, met extra aandacht voor beweging en eenvoudige stops.`;
  trafficAdvice.textContent = profile.traffic;
  hotelAdvice.textContent = profile.hotelRegion;
  timeAdvice.textContent = `Alternatief: vertrek om ${alternativeTime}. Dat geeft vaak rustiger verkeer en een beter moment voor de eerste pauze.`;

  stopList.innerHTML = stops
    .map(
      (stop) => `
        <article class="stop-card">
          <div class="stop-time">${stop.time}</div>
          <div>
            <h3>${stop.title}</h3>
            <p>${stop.body}</p>
          </div>
        </article>
      `
    )
    .join("");

  document.querySelector("#kidTips").firstElementChild.querySelector("p").textContent =
    buildKidTip(data.children, data.ages);
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
