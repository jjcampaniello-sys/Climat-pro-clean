let history = [];
let chart;
let map;
let marker;

// 🧠 IA apprentissage utilisateur (persistant)
let userBias = JSON.parse(localStorage.getItem("bias")) || {
  hot: 0,
  cold: 0
};

// 🌍 GPS
function getLocation(){
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos),
      err => resolve(null)
    );
  });
}

// 🌤️ météo
async function getWeather(lat, lon){

  if(!lat || !lon){
    return { temp: 20, wind: 10 };
  }

  const url =
  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

  const res = await fetch(url);
  const data = await res.json();

  return {
    temp: data.current_weather.temperature,
    wind: data.current_weather.windspeed
  };
}

// 💧 humidité simulée réaliste
function getHumidity(){
  return 45 + Math.random() * 25;
}

// 🌡️ ressenti scientifique stable
function feelsLike(temp, hum, wind){

  let feel = temp;

  feel += (hum - 50) * 0.05;
  feel -= wind * 0.2;

  if(feel > temp + 5) feel = temp + 5;
  if(feel < temp - 8) feel = temp - 8;

  return feel;
}

// 🧠 IA confort + apprentissage
function comfortAI(feels){

  let adjusted = feels;

  adjusted += userBias.hot;
  adjusted -= userBias.cold;

  if(adjusted > 30) return "🔥 Extrême";
  if(adjusted > 26) return "🥵 Chaud";
  if(adjusted > 20) return "😌 Confort";
  if(adjusted > 16) return "🙂 Frais";
  return "🥶 Froid";
}

// 🏠 mode
function detectMode(temp){
  return (temp > 5 && temp < 35) ? "🌍 Extérieur" : "🏠 Intérieur";
}

// 🔔 alertes avancées
function alerts(temp, hum, wind){

  const a = document.getElementById("alert");

  if(feels > 32 || hum > 80){
    a.innerText = "🔥 Danger chaleur / humidité";
  }
  else if(temp < 5){
    a.innerText = "🥶 Danger froid";
  }
  else if(wind > 40){
    a.innerText = "🌬️ Vent fort";
  }
  else {
    a.innerText = "";
  }
}

// 📊 historique
function addHistory(temp, hum, wind, feels){

  const time = new Date().toLocaleTimeString();

  history.unshift({ time, temp, hum, wind, feels });

  if(history.length > 10) history.pop();

  localStorage.setItem("history", JSON.stringify(history));

  renderHistory();
}

function renderHistory(){

  const h = document.getElementById("history");
  h.innerHTML = "";

  history.forEach(x => {

    const div = document.createElement("div");
    div.className = "hist";

    div.innerText =
    `${x.time} 🌡️${x.temp.toFixed(1)}°C 💧${x.hum.toFixed(0)}% 🌬️${x.wind}km/h 🔥${x.feels.toFixed(1)}°C`;

    h.appendChild(div);
  });
}

// 📈 chart
function initChart(){

  chart = new Chart(document.getElementById("chart"), {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Ressenti",
        data: []
      }]
    }
  });
}

// 🌍 MAP
function initMap(lat, lon){

  map = L.map('map').setView([lat, lon], 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);

  marker = L.marker([lat, lon]).addTo(map);
}

// 🚀 UPDATE
async function update(){

  const gps = await getLocation();

  let lat = gps ? gps.coords.latitude : 52.3;
  let lon = gps ? gps.coords.longitude : 4.9;

  const weather = await getWeather(lat, lon);

  const temp = weather.temp;
  const wind = weather.wind;
  const hum = getHumidity();

  const feels = feelsLike(temp, hum, wind);

  // UI
  document.getElementById("temp").innerText = temp.toFixed(1);
  document.getElementById("hum").innerText = hum.toFixed(0);
  document.getElementById("wind").innerText = wind.toFixed(0);
  document.getElementById("feels").innerText = feels.toFixed(1);
  document.getElementById("comfort").innerText = comfortAI(feels);
  document.getElementById("mode").innerText = detectMode(temp);

  // alerts
  const a = document.getElementById("alert");
  if(feels > 32 || hum > 80) a.innerText = "🔥 Danger chaleur";
  else if(temp < 5) a.innerText = "🥶 Danger froid";
  else a.innerText = "";

  // IA learning
  if(feels > 28) userBias.hot += 0.1;
  if(feels < 18) userBias.cold += 0.1;

  localStorage.setItem("bias", JSON.stringify(userBias));

  addHistory(temp, hum, wind, feels);

  // chart
  chart.data.labels.push(new Date().toLocaleTimeString());
  chart.data.datasets[0].data.push(feels);
  chart.update();

  // map update
  if(!map){
    initMap(lat, lon);
  } else {
    map.setView([lat, lon]);
    marker.setLatLng([lat, lon]);
  }
}

// INIT
initChart();
update();
setInterval(update, 60 * 60 * 1000);
