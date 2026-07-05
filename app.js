
let map, marker;
let memory = JSON.parse(localStorage.getItem("memory")) || [];

// 🌍 SEARCH VILLE
async function searchCity(q){

  if(q.length < 2) return [];

  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=5&language=fr`
  );

  const data = await res.json();
  return data.results || [];
}

// 🌤️ MÉTÉO RÉELLE
async function getWeather(lat, lon){

  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,windspeed_10m,relative_humidity_2m`
  );

  return await res.json();
}

// 🌡️ CALCUL RESSENTI (corrigé)
function feelsLike(temp, hum, wind){

  let f = temp;

  f += (hum - 50) * 0.05;   // humidité
  f -= wind * 0.25;         // vent refroidit

  // stabilisation réaliste
  if(f > temp + 5) f = temp + 5;
  if(f < temp - 8) f = temp - 8;

  return f;
}

// 🧠 IA APPRENTISSAGE (LOCAL)
function sendFeedback(value){

  memory.push(value);

  if(memory.length > 20){
    memory.shift();
  }

  localStorage.setItem("memory", JSON.stringify(memory));

  alert("Merci 👍 IA mise à jour");
}

// 🧠 IA CALCUL
function getAI(){

  if(memory.length === 0) return 22;

  return memory.reduce((a,b)=>a+b,0) / memory.length;
}

// 🔎 AFFICHER VILLES
function renderCities(list){

  const box = document.getElementById("results");
  box.innerHTML = "";

  list.forEach(c => {

    const div = document.createElement("div");
    div.className = "result";

    div.innerText = `${c.name}, ${c.country}`;

    div.onclick = () => {
      update(c.latitude, c.longitude);
      box.innerHTML = "";
      document.getElementById("search").value = c.name;
    };

    box.appendChild(div);
  });
}

// 🌍 MAP
function initMap(lat, lon){

  map = L.map("map").setView([lat, lon], 10);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  marker = L.marker([lat, lon]).addTo(map);

  map.on("click", e => {
    update(e.latlng.lat, e.latlng.lng);
  });
}

// 📅 PRÉVISION DEMI-JOURNÉE
function showForecast(data){

  const t = data.hourly.temperature_2m;
  const w = data.hourly.windspeed_10m;
  const h = data.hourly.relative_humidity_2m;

  let html = "📅 Prévision 12h<br><br>";

  for(let i = 0; i < 12; i += 3){

    let feel = feelsLike(t[i], h[i], w[i]);

    html += `
    ⏱ +${i*2}h →
    🌡️ ${t[i]}°C |
    🌬️ ${w[i]} km/h |
    🔥 ${feel.toFixed(1)}°C<br>
    `;
  }

  document.getElementById("today").innerHTML = html;
}

// 🔮 PRÉVISION DEMAIN (IA SIMPLE)
function showTomorrow(data){

  const t = data.hourly.temperature_2m;
  const w = data.hourly.windspeed_10m;
  const h = data.hourly.relative_humidity_2m;

  let bias = getAI() - 22;

  let html = "🔮 Demain (IA)<br><br>";

  for(let i = 24; i < 36; i += 3){

    let feel = feelsLike(t[i], h[i], w[i]) + bias;

    html += `
    ⏱ +${i-24}h →
    🔥 ${feel.toFixed(1)}°C<br>
    `;
  }

  document.getElementById("tomorrow").innerHTML = html;
}

// 🚀 UPDATE PRINCIPAL
async function update(lat, lon){

  if(!lat){

    const gps = await new Promise(resolve =>
      navigator.geolocation.getCurrentPosition(resolve)
    );

    lat = gps.coords.latitude;
    lon = gps.coords.longitude;
  }

  const data = await getWeather(lat, lon);

  const temp = data.current_weather.temperature;
  const wind = data.current_weather.windspeed;
  const hum = data.hourly.relative_humidity_2m[0];

  const feel = feelsLike(temp, hum, wind);
  const ai = getAI();

  document.getElementById("temp").innerText = temp.toFixed(1);
  document.getElementById("wind").innerText = wind;
  document.getElementById("hum").innerText = hum.toFixed(0);
  document.getElementById("feel").innerText = feel.toFixed(1);
  document.getElementById("ai").innerText = ai.toFixed(1);

  showForecast(data);
  showTomorrow(data);

  if(!map){
    initMap(lat, lon);
  } else {
    map.setView([lat, lon]);
    marker.setLatLng([lat, lon]);
  }
}

// 🔎 SEARCH EVENT
document.addEventListener("DOMContentLoaded", () => {

  const input = document.getElementById("search");

  input.addEventListener("input", async (e) => {

    const res = await searchCity(e.target.value);
    renderCities(res);
  });

});

// ▶️ START
update();
setInterval(update, 3600000);
