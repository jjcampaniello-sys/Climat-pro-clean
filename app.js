let history = [];
let chart;

// 🌍 GPS + météo réelle
async function getLocation(){
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

async function getWeather(lat, lon){
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const res = await fetch(url);
  const data = await res.json();

  return {
    temp: data.current_weather.temperature,
    wind: data.current_weather.windspeed
  };
}

// 🧠 IA confort simple
function comfortAI(temp, hum){
  if(temp > 28) return "🔥 Chaud";
  if(temp < 10) return "🥶 Froid";
  if(hum > 75) return "🌫️ Humide";
  return "😌 Idéal";
}

// 🏠 mode intérieur / extérieur
function detectMode(temp){
  return (temp > 5 && temp < 35) ? "🌍 Extérieur" : "🏠 Intérieur";
}

// 🔔 alertes intelligentes
function alertSystem(temp){
  const alertBox = document.getElementById("alert");

  if(temp > 30){
    alertBox.innerText = "🔥 Alerte : température élevée";
  } else if(temp < 5){
    alertBox.innerText = "🥶 Alerte : froid important";
  } else {
    alertBox.innerText = "";
  }
}

// 📊 historique limité (propre)
function addHistory(temp, hum){
  const time = new Date().toLocaleTimeString();

  history.unshift({ time, temp, hum });

  if(history.length > 8){
    history.pop();
  }

  renderHistory();
}

function renderHistory(){
  const container = document.getElementById("history");
  container.innerHTML = "";

  history.forEach(h => {
    const div = document.createElement("div");
    div.className = "hist";
    div.innerText = `${h.time} → ${h.temp}°C / ${h.hum || "--"}%`;
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

// 🚀 update PRINCIPAL (1x / heure)
async function update(){
  try {
    const coords = await getLocation();
    const weather = await getWeather(coords.coords.latitude, coords.coords.longitude);

    const temp = weather.temp;
    const hum = 50; // fallback simple (pas de capteur réel navigateur)

    document.getElementById("temp").innerText = temp.toFixed(1);
    document.getElementById("hum").innerText = hum;
    document.getElementById("comfort").innerText = comfortAI(temp, hum);
    document.getElementById("mode").innerText = detectMode(temp);

    alertSystem(temp);
    addHistory(temp, hum);

    chart.data.labels.push(new Date().toLocaleTimeString());
    chart.data.datasets[0].data.push(temp);
    chart.update();

  } catch(e){
    console.log("GPS refusé ou erreur météo", e);
  }
}

// 🔁 fréquence PRO (stable)
initChart();
update();
setInterval(update, 60 * 60 * 1000); // 1 heure
