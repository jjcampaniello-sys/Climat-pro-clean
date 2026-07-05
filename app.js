
let map, marker;

let memory = JSON.parse(localStorage.getItem("user_memory")) || [];

// 🌍 GOOGLE LIKE SEARCH
async function searchCity(q){

  if(q.length < 2) return [];

  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=5`
  );

  const data = await res.json();
  return data.results || [];
}

// 📍 GPS
function useGPS(){

  navigator.geolocation.getCurrentPosition(pos => {
    update(pos.coords.latitude, pos.coords.longitude);
  });
}

// 🌤️ METEO
async function weather(lat, lon){

  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,windspeed_10m,relative_humidity_2m,winddirection_10m`
  );

  return await res.json();
}

// 🌡️ RESSENTI SCIENTIFIQUE SIMPLE
function feels(temp, hum, wind){

  let f = temp + (hum - 50) * 0.04 - wind * 0.2;

  return Math.max(temp - 10, Math.min(temp + 5, f));
}

// 🧠 IA FEEDBACK
function feedback(value){

  memory.push(value);

  if(memory.length > 40) memory.shift();

  localStorage.setItem("user_memory", JSON.stringify(memory));

  alert("IA mise à jour 👍");
}

// 🧠 IA PERSONALISÉE
function ai(){

  if(memory.length === 0) return 22;

  return memory.reduce((a,b)=>a+b,0)/memory.length;
}

// 🔎 RESULTS
function render(list){

  const box = document.getElementById("results");
  box.innerHTML = "";

  list.forEach(c => {

    let div = document.createElement("div");

    div.innerText = `${c.name}, ${c.country}`;

    div.onclick = () => update(c.latitude, c.longitude);

    box.appendChild(div);
  });
}

// 🌍 MAP
function mapInit(lat, lon){

  map = L.map("map").setView([lat,lon],10);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
  .addTo(map);

  marker = L.marker([lat,lon]).addTo(map);
}

// 📊 PREVISION DEMI JOURNEE
function forecast(data){

  let t = data.hourly.temperature_2m;
  let w = data.hourly.windspeed_10m;
  let h = data.hourly.relative_humidity_2m;

  let html = "📅 12h<br><br>";

  for(let i=0;i<12;i+=3){

    let f = feels(t[i],h[i],w[i]);

    html += `+${i*2}h → ${f.toFixed(1)}°C<br>`;
  }

  document.getElementById("forecast").innerHTML = html;
}

// 🔮 DEMAIN IA
function tomorrow(data){

  let t = data.hourly.temperature_2m;
  let w = data.hourly.windspeed_10m;
  let h = data.hourly.relative_humidity_2m;

  let bias = ai() - 22;

  let html = "🔮 Demain IA<br><br>";

  for(let i=24;i<36;i+=3){

    let f = feels(t[i],h[i],w[i]) + bias;

    html += `+${i-24}h → ${f.toFixed(1)}°C<br>`;
  }

  document.getElementById("tomorrow").innerHTML = html;
}

// 🚀 UPDATE
async function update(lat, lon){

  if(!lat){

    let gps = await new Promise(r =>
      navigator.geolocation.getCurrentPosition(r)
    );

    lat = gps.coords.latitude;
    lon = gps.coords.longitude;
  }

  let data = await weather(lat,lon);

  let t = data.current_weather.temperature;
  let w = data.current_weather.windspeed;
  let d = data.current_weather.winddirection;
  let h = data.hourly.relative_humidity_2m[0];

  let f = feels(t,h,w);

  document.getElementById("temp").innerText = t;
  document.getElementById("feel").innerText = f.toFixed(1);
  document.getElementById("hum").innerText = h;
  document.getElementById("wind").innerText = w;
  document.getElementById("dir").innerText = d;

  forecast(data);
  tomorrow(data);

  if(!map) mapInit(lat,lon);
}

// 🔎 SEARCH
document.addEventListener("DOMContentLoaded", () => {

  let input = document.getElementById("search");

  input.addEventListener("input", async e => {

    let r = await searchCity(e.target.value);
    render(r);
  });

});

// START
update();
setInterval(update, 3600000);
