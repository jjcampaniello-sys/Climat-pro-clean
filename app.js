
let history = [];
let chart;
let map;
let marker;

let selected = null;

// 🧠 IA locale simple (sans serveur)
let userMemory = JSON.parse(localStorage.getItem("memory")) || [];

// 🌤️ METEO
async function getWeather(lat, lon){

  const url =
  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,windspeed_10m`;

  const res = await fetch(url);
  return await res.json();
}

// 🔎 VILLE SEARCH
async function searchCity(q){

  if(q.length < 2) return [];

  const url =
  `https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=5&language=fr`;

  const res = await fetch(url);
  const data = await res.json();

  return data.results || [];
}

// 💧 HUMIDITE SIMPLIFIÉE
function getHumidity(){
  return 50 + Math.random()*25;
}

// 🌡️ RESSENTI STABLE
function feelsLike(t,h,w){

  let f = t;

  if(t > 25){
    f = t + (h/100)*3;
  }

  if(t < 10){
    f = t - (w*0.15);
  }

  if(f > t+5) f = t+5;
  if(f < t-8) f = t-8;

  return f;
}

// 🧠 IA SIMPLE (APPRENTISSAGE LOCAL)
function learn(feel){

  userMemory.push(feel);

  if(userMemory.length > 20){
    userMemory.shift();
  }

  localStorage.setItem("memory", JSON.stringify(userMemory));

  let avg =
    userMemory.reduce((a,b)=>a+b,0)/userMemory.length;

  return avg;
}

// 🔎 AFFICHER VILLES
function renderCities(list){

  const box = document.getElementById("results");
  box.innerHTML = "";

  list.forEach(c => {

    let div = document.createElement("div");
    div.className = "result";
    div.innerText = `${c.name}, ${c.country}`;

    div.onclick = () => {
      selected = {lat:c.latitude, lon:c.longitude};
      document.getElementById("search").value = c.name;
      update(c.latitude, c.longitude);
      box.innerHTML = "";
    };

    box.appendChild(div);
  });
}

// 🌍 MAP
function initMap(lat,lon){

  map = L.map('map').setView([lat,lon],10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
  .addTo(map);

  marker = L.marker([lat,lon]).addTo(map);

  map.on("click", e=>{
    update(e.latlng.lat,e.latlng.lng);
  });
}

// 📊 HISTORY
function addHistory(t,h,w,f){

  history.unshift({
    t,h,w,f,
    time:new Date().toLocaleTimeString()
  });

  if(history.length > 10) history.pop();

  const box = document.getElementById("history");
  box.innerHTML = "";

  history.forEach(x=>{
    box.innerHTML +=
    `${x.time} → 🌡️${x.t}° 💧${x.h}% 🌬️${x.w} 🔥${x.f.toFixed(1)}<br>`;
  });
}

// 🚀 UPDATE PRINCIPAL
async function update(lat,lon){

  if(!lat){
    const gps = await new Promise(r =>
      navigator.geolocation.getCurrentPosition(r)
    );
    lat = gps.coords.latitude;
    lon = gps.coords.longitude;
  }

  const data = await getWeather(lat,lon);

  const temp = data.current_weather.temperature;
  const wind = data.current_weather.windspeed;
  const hum = getHumidity();

  const feel = feelsLike(temp,hum,wind);

  const ai = learn(feel);

  document.getElementById("temp").innerText = temp.toFixed(1);
  document.getElementById("hum").innerText = hum.toFixed(0);
  document.getElementById("wind").innerText = wind.toFixed(0);
  document.getElementById("feels").innerText = feel.toFixed(1);

  let comfort = "😌 OK";

  if(feel > ai + 3) comfort = "🔥 Trop chaud";
  if(feel < ai - 3) comfort = "🥶 Trop froid";

  document.getElementById("comfort").innerText = comfort;

  addHistory(temp,hum,wind,feel);

  if(!map){
    initMap(lat,lon);
  } else {
    map.setView([lat,lon]);
    marker.setLatLng([lat,lon]);
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

// INIT
update();
setInterval(update, 3600000);
