
let map, marker;

let memory = JSON.parse(localStorage.getItem("mem")) || [];

// 🧠 DEBUG
console.log("Climate app loaded");

// 🔎 SEARCH VILLE (SAFE)
async function searchCity(q){

  try {
    if(q.length < 2) return [];

    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=5`
    );

    const data = await res.json();
    return data.results || [];

  } catch(e){
    console.log("Search error", e);
    return [];
  }
}

// 🌤️ METEO SAFE
async function getWeather(lat,lon){

  try {

    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,windspeed_10m,relative_humidity_2m`
    );

    return await res.json();

  } catch(e){
    console.log("Weather error", e);
    return null;
  }
}

// 🌡️ RESSENTI STABLE
function feel(temp, hum, wind){

  let f = temp + (hum-50)*0.05 - wind*0.2;

  return f;
}

// 🧠 IA
function sendFeedback(v){

  memory.push(v);
  if(memory.length > 30) memory.shift();

  localStorage.setItem("mem", JSON.stringify(memory));

  alert("IA enregistrée 👍");
}

// 🧠 MOYENNE IA
function ai(){

  if(memory.length === 0) return 22;

  return memory.reduce((a,b)=>a+b,0)/memory.length;
}

// 🔎 UI VILLES
function showCities(list){

  const box = document.getElementById("results");
  box.innerHTML = "";

  list.forEach(c => {

    const d = document.createElement("div");
    d.className = "result";
    d.innerText = `${c.name}, ${c.country}`;

    d.onclick = () => update(c.latitude, c.longitude);

    box.appendChild(d);
  });
}

// 🌍 MAP
function mapInit(lat,lon){

  map = L.map("map").setView([lat,lon],10);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
  .addTo(map);

  marker = L.marker([lat,lon]).addTo(map);
}

// 🚀 UPDATE SAFE
async function update(lat,lon){

  try {

    if(!lat){
      const gps = await new Promise(r =>
        navigator.geolocation.getCurrentPosition(r)
      );

      lat = gps.coords.latitude;
      lon = gps.coords.longitude;
    }

    const data = await getWeather(lat,lon);

    if(!data) return;

    const t = data.current_weather.temperature;
    const w = data.current_weather.windspeed;
    const h = data.hourly.relative_humidity_2m[0];

    const f = feel(t,h,w);
    const a = ai();

    document.getElementById("temp").innerText = t;
    document.getElementById("wind").innerText = w;
    document.getElementById("hum").innerText = h;
    document.getElementById("feel").innerText = f.toFixed(1);

    if(!map) mapInit(lat,lon);

  } catch(e){
    console.log("Update error", e);
  }
}

// 🔎 SEARCH EVENT
document.addEventListener("DOMContentLoaded", () => {

  const input = document.getElementById("search");

  input.addEventListener("input", async (e) => {

    const res = await searchCity(e.target.value);
    showCities(res);
  });

});

// START
update();
setInterval(update, 3600000);
