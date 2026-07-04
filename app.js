let historyData = [];
let chart;

// 🌍 GPS SAFE
function getLocationSafe(){
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos),
      err => {
        console.log("GPS refusé → fallback");
        resolve(null);
      }
    );
  });
}

// 🌤️ météo fallback safe
async function getWeather(lat, lon){

  // si pas GPS → valeur par défaut
  if(!lat || !lon){
    return { temp: 22 };
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

  const res = await fetch(url);
  const data = await res.json();

  return {
    temp: data.current_weather.temperature
  };
}

// 🧠 IA simple safe
function comfortAI(temp, hum){

  if(temp > 28) return "🔥 Chaud";
  if(temp < 10) return "🥶 Froid";
  return "😌 OK";
}

// 🏠 mode safe
function detectMode(temp){
  return (temp > 5 && temp < 35) ? "🌍 Extérieur" : "🏠 Intérieur";
}

// 📊 history safe
function addHistory(temp, hum){
  const time = new Date().toLocaleTimeString();

  historyData.unshift({ time, temp, hum });

  if(historyData.length > 8){
    historyData.pop();
  }

  const container = document.getElementById("history");
  if(!container) return;

  container.innerHTML = "";

  historyData.forEach(h => {
    const div = document.createElement("div");
    div.innerText = `${h.time} → ${h.temp}°C`;
    container.appendChild(div);
  });
}

// 🚀 UPDATE SAFE
async function update(){

  const gps = await getLocationSafe();

  let lat = null;
  let lon = null;

  if(gps){
    lat = gps.coords.latitude;
    lon = gps.coords.longitude;
  }

  const weather = await getWeather(lat, lon);

  const temp = weather.temp;
  const hum = 50;

  const tempEl = document.getElementById("temp");
  const humEl = document.getElementById("hum");
  const comfortEl = document.getElementById("comfort");
  const modeEl = document.getElementById("mode");

  if(tempEl) tempEl.innerText = temp.toFixed(1);
  if(humEl) humEl.innerText = hum;
  if(comfortEl) comfortEl.innerText = comfortAI(temp, hum);
  if(modeEl) modeEl.innerText = detectMode(temp);

  addHistory(temp, hum);
}

// 🚀 INIT
update();
setInterval(update, 60 * 60 * 1000);
