
let history = [];
let chart;

// 🧠 apprentissage utilisateur simple
let userBias = {
  hotTolerance: 0,
  coldTolerance: 0
};

// 🌍 GPS SAFE
function getLocation(){
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos),
      err => resolve(null)
    );
  });
}

// 🌤️ météo réelle + vent
async function getWeather(lat, lon){

  if(!lat || !lon){
    return {
      temp: 22,
      wind: 10
    };
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

  const res = await fetch(url);
  const data = await res.json();

  return {
    temp: data.current_weather.temperature,
    wind: data.current_weather.windspeed
  };
}

// 🌡️ HEAT INDEX SCIENTIFIQUE SIMPLIFIÉ
function heatIndex(temp, hum){

  let hi = temp;

  // formule simplifiée réaliste
  hi += 0.3 * hum;

  return hi;
}

// 🌬️ ressenti avec vent + humidité
function feelsLike(temp, hum, wind){

  let feel = heatIndex(temp, hum);

  // vent refroidit
  feel -= wind * 0.15;

  return feel;
}

// 🧠 IA CONFORT AVEC APPRENTISSAGE
function comfortAI(temp, feels){

  let adjustedTemp = feels;

  adjustedTemp += userBias.hotTolerance;
  adjustedTemp -= userBias.coldTolerance;

  if(adjustedTemp > 30) return "🔥 Très chaud";
  if(adjustedTemp > 26) return "🥵 Chaud";
  if(adjustedTemp >= 20) return "😌 Confort";
  if(adjustedTemp >= 15) return "🙂 Frais";
  return "🥶 Froid";
}

// 🏠 mode intérieur / extérieur
function detectMode(temp){
  return (temp > 5 && temp < 35) ? "🌍 Extérieur" : "🏠 Intérieur";
}

// 🔔 alertes intelligentes
function alerts(temp, feels){

  const alertBox = document.getElementById("alert");

  if(feels > 32){
    alertBox.innerText = "🔥 Alerte : chaleur dangereuse";
  }
  else if(feels < 5){
    alertBox.innerText = "🥶 Alerte : froid extrême";
  }
  else{
    alertBox.innerText = "";
  }
}

// 📊 historique
function addHistory(temp, feels, wind){

  const time = new Date().toLocaleTimeString();

  history.unshift({ time, temp, feels, wind });

  if(history.length > 8) history.pop();

  renderHistory();
}

function renderHistory(){

  const container = document.getElementById("history");
  container.innerHTML = "";

  history.forEach(h => {

    const div = document.createElement("div");
    div.className = "hist";

    div.innerText =
      `${h.time} → T:${h.temp}°C / R:${h.feels}°C / V:${h.wind}km/h`;

    container.appendChild(div);
  });
}

// 📈 chart
function initChart(){

  chart = new Chart(document.getElementById("chart"), {
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

// 🚀 UPDATE PRINCIPAL
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
  const hum = 55;

  const feels = feelsLike(temp, hum, wind);

  // UI
  document.getElementById("temp").innerText = temp.toFixed(1);
  document.getElementById("wind").innerText = wind.toFixed(1);
  document.getElementById("feels").innerText = feels.toFixed(1);

  document.getElementById("comfort").innerText =
    comfortAI(temp, feels);

  document.getElementById("mode").innerText =
    detectMode(temp);

  alerts(temp, feels);

  addHistory(temp, feels, wind);

  chart.data.labels.push(new Date().toLocaleTimeString());
  chart.data.datasets[0].data.push(feels);
  chart.update();

  // 🧠 apprentissage simple utilisateur
  if(feels > 28) userBias.hotTolerance += 0.1;
  if(feels < 18) userBias.coldTolerance += 0.1;
}

// 🚀 INIT
initChart();
update();
setInterval(update, 60 * 60 * 1000);
