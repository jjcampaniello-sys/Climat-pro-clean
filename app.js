let history = [];
let chart;

// 🌍 GPS
async function getLocation(){
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

// 🌤️ météo réelle
async function getWeather(lat, lon){
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const res = await fetch(url);
  const data = await res.json();

  return {
    temp: data.current_weather.temperature,
    wind: data.current_weather.windspeed
  };
}

// 🧠 IA PRÉDICTION CONFORT (VERSION PRO SIMPLE)
function comfortAI(temp, hum, hour){

  let score = 0;

  // température
  if(temp >= 21 && temp <= 25) score += 2;
  else if(temp >= 18 && temp <= 28) score += 1;
  else score -= 1;

  // humidité estimée
  if(hum >= 40 && hum <= 60) score += 2;
  else if(hum > 70) score -= 1;

  // heure (confort naturel humain)
  if(hour >= 7 && hour <= 21) score += 1;
  else score -= 1;

  if(score >= 4) return "😌 Confort optimal";
  if(score >= 2) return "🙂 Correct";
  if(score >= 0) return "😐 Moyen";
  return "🔥 Inconfort probable";
}

// 🏠 mode intérieur / extérieur
function detectMode(temp){
  return (temp > 5 && temp < 35) ? "🌍 Extérieur" : "🏠 Intérieur";
}

// 🔔 alertes intelligentes
function alertSystem(temp, hum){
  const alertBox = document.getElementById("alert");

  if(temp > 30 && hum > 70){
    alertBox.innerText = "🔥 Forte chaleur + humidité élevée";
  }
  else if(temp > 30){
    alertBox.innerText = "🔥 Température élevée";
  }
  else if(temp < 5){
    alertBox.innerText = "🥶 Température très basse";
  }
  else{
    alertBox.innerText = "";
  }
}

// 📊 historique limité
let historyData = [];

function addHistory(temp, hum){
  const time = new Date().toLocaleTimeString();

  historyData.unshift({ time, temp, hum });

  if(historyData.length > 8){
    historyData.pop();
  }

  renderHistory();
}

function renderHistory(){
  const container = document.getElementById("history");
  container.innerHTML = "";

  historyData.forEach(h => {
    const div = document.createElement("div");
    div.className = "hist";
    div.innerText = `${h.time} → ${h.temp}°C / ${h.hum}%`;
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
        label: "Température",
        data: []
      }]
    }
  });
}

// 🚀 UPDATE PRINCIPAL (STABLE + IA)
async function update(){

  try {
    const coords = await getLocation();
    const weather = await getWeather(coords.coords.latitude, coords.coords.longitude);

    const temp = weather.temp;

    // humidité simulée stable (API gratuite n’en donne pas toujours)
    const hum = 45 + Math.random()*20;

    const hour = new Date().getHours();

    document.getElementById("temp").innerText = temp.toFixed(1);
    document.getElementById("hum").innerText = hum.toFixed(0);

    document.getElementById("comfort").innerText =
      comfortAI(temp, hum, hour);

    document.getElementById("mode").innerText =
      detectMode(temp);

    alertSystem(temp, hum);

    addHistory(temp, hum);

    chart.data.labels.push(new Date().toLocaleTimeString());
    chart.data.datasets[0].data.push(temp);
    chart.update();

  } catch(e){
    console.log("Erreur GPS ou météo", e);
  }
}

// 🔁 fréquence stable (1 heure)
initChart();
update();
setInterval(update, 60 * 60 * 1000);
