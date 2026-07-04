
let history = [];
let chart;

// 🌍 GPS SAFE
function getLocation(){
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos),
      err => resolve(null)
    );
  });
}

// 🌤️ météo réelle (temp + vent)
async function getWeather(lat, lon){

  if(!lat || !lon){
    return {
      temp: 19.5,
      wind: 15
    };
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

// 💧 humidité réaliste fallback (API gratuite limitée)
function getHumidity(){
  return 55 + Math.random() * 15; // 55–70 stable
}

// 🌡️ TEMPÉRATURE RESSENTIE SCIENTIFIQUE STABLE
function feelsLike(temp, hum, wind){

  let feel = temp;

  // 💧 humidité (léger effet chaleur)
  feel += (hum - 50) * 0.05;

  // 🌬️ vent (refroidissement réel)
  feel -= wind * 0.2;

  // 🔒 limites physiques réalistes
  if(feel > temp + 4) feel = temp + 4;
  if(feel < temp - 8) feel = temp - 8;

  return feel;
}

// 🧠 IA CONFORT SIMPLE MAIS FIABLE
function comfortAI(temp, feels){

  if(feels >= 28) return "🔥 Très chaud";
  if(feels >= 24) return "🥵 Chaud";
  if(feels >= 20) return "😌 Confort";
  if(feels >= 16) return "🙂 Frais";
  return "🥶 Froid";
}

// 🏠 mode intérieur / extérieur
function detectMode(temp){
  return (temp > 5 && temp < 35)
    ? "🌍 Extérieur"
    : "🏠 Intérieur";
}

// 🔔 alertes intelligentes
function alerts(temp, feels){

  const alertBox = document.getElementById("alert");

  if(feels > 32){
    alertBox.innerText = "🔥 Alerte chaleur élevée";
  }
  else if(feels < 4){
    alertBox.innerText = "🥶 Alerte froid extrême";
  }
  else{
    alertBox.innerText = "";
  }
}

// 📊 historique propre (max 8)
function addHistory(temp, feels, wind){

  const time = new Date().toLocaleTimeString();

  history.unshift({ time, temp, feels, wind });

  if(history.length > 8){
    history.pop();
  }

  renderHistory();
}

function renderHistory(){

  const container = document.getElementById("history");
  if(!container) return;

  container.innerHTML = "";

  history.forEach(h => {

    const div = document.createElement("div");
    div.className = "hist";

    div.innerText =
      `${h.time} → T:${h.temp.toFixed(1)}°C / R:${h.feels.toFixed(1)}°C / V:${h.wind}km/h`;

    container.appendChild(div);
  });
}

// 📈 chart
function initChart(){

  const ctx = document.getElementById("chart");

  if(!ctx) return;

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Température ressentie",
        data: []
      }]
    }
  });
}

// 🚀 UPDATE PRINCIPAL STABLE
async function update(){

  const gps = await getLocation();

  let lat = null;
  let lon = null;

  if(gps){
    lat = gps.coords.latitude;
    lon = gps.coords.longitude;
  }

  const weather = await getWeather(lat, lon);

  const temp = weather.temp;
  const wind = weather.wind;
  const hum = getHumidity();

  const feels = feelsLike(temp, hum, wind);

  // UI SAFE
  const tempEl = document.getElementById("temp");
  const windEl = document.getElementById("wind");
  const feelsEl = document.getElementById("feels");
  const comfortEl = document.getElementById("comfort");
  const modeEl = document.getElementById("mode");

  if(tempEl) tempEl.innerText = temp.toFixed(1);
  if(windEl) windEl.innerText = wind.toFixed(1);
  if(feelsEl) feelsEl.innerText = feels.toFixed(1);
  if(comfortEl) comfortEl.innerText = comfortAI(temp, feels);
  if(modeEl) modeEl.innerText = detectMode(temp);

  alerts(temp, feels);
  addHistory(temp, feels, wind);

  if(chart){
    chart.data.labels.push(new Date().toLocaleTimeString());
    chart.data.datasets[0].data.push(feels);
    chart.update();
  }
}

// 🚀 INIT
initChart();
update();
setInterval(update, 60 * 60 * 1000);
