let map, marker;
let memory = JSON.parse(localStorage.getItem("mem")) || [];

// 🌍 SEARCH CITY
async function searchCity(q){
  if(q.length<2) return [];

  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=5`
  );

  const data = await res.json();
  return data.results || [];
}

// 🌤️ CURRENT WEATHER
async function weather(lat,lon){

  const res = await fetch(
  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,windspeed_10m,relative_humidity_2m`
  );

  return await res.json();
}

// 🌡️ MODÈLE PHYSIQUE RÉEL (corrigé)
function feels(temp, hum, wind){

  let heatIndex = temp;

  // humidité impact réel
  heatIndex += (hum - 50) * 0.06;

  // vent refroidit fort
  heatIndex -= wind * 0.25;

  // non linéarité (IMPORTANT)
  if(temp > 28) heatIndex += 1.5;
  if(temp < 10) heatIndex -= 1.5;

  return heatIndex;
}

// 🧠 IA INTERACTIVE
function ai(feel){

  memory.push(feel);
  if(memory.length>20) memory.shift();

  localStorage.setItem("mem",JSON.stringify(memory));

  let avg = memory.reduce((a,b)=>a+b,0)/memory.length;

  return avg;
}

// 📅 PRÉVISION DEMI-JOURNÉE (VRAIE)
function halfDay(data){

  const t = data.hourly.temperature_2m;
  const w = data.hourly.windspeed_10m;
  const h = data.hourly.relative_humidity_2m;

  let out = "📅 Prévision 12h:<br>";

  for(let i=0;i<12;i+=3){

    let f = feels(t[i],h[i],w[i]);

    out += `
    ⏱ ${i*2}h →
    🌡️${t[i]}° 🌬️${w[i]} 🔥${f.toFixed(1)}<br>`;
  }

  document.getElementById("today").innerHTML = out;
}

// 📅 DEMAIN (PRÉDICTIF IA)
function tomorrow(data){

  const t = data.hourly.temperature_2m;
  const w = data.hourly.windspeed_10m;
  const h = data.hourly.relative_humidity_2m;

  let future = "🔮 Demain (IA):<br>";

  let predictedBias = memory.length ?
    memory.reduce((a,b)=>a+b,0)/memory.length - 22 : 0;

  for(let i=24;i<36;i+=3){

    let f = feels(t[i],h[i],w[i]) + predictedBias;

    future += `
    ⏱ ${i-24}h →
    🔥${f.toFixed(1)}<br>`;
  }

  document.getElementById("tomorrow").innerHTML = future;
}

// 🌍 MAP
function initMap(lat,lon){

  map = L.map('map').setView([lat,lon],10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
  .addTo(map);

  marker = L.marker([lat,lon]).addTo(map);

  map.on("click",e=>{
    update(e.latlng.lat,e.latlng.lng);
  });
}

// 🔄 UPDATE
async function update(lat,lon){

  if(!lat){
    const gps = await new Promise(r=>
      navigator.geolocation.getCurrentPosition(r)
    );
    lat = gps.coords.latitude;
    lon = gps.coords.longitude;
  }

  const data = await weather(lat,lon);

  const t = data.current_weather.temperature;
  const w = data.current_weather.windspeed;
  const h = data.hourly.relative_humidity_2m[0];

  const f = feels(t,h,w);
  const avg = ai(f);

  // UI
  document.getElementById("temp").innerText=t;
  document.getElementById("wind").innerText=w;
  document.getElementById("hum").innerText=h.toFixed(0);
  document.getElementById("feel").innerText=f.toFixed(1);
  document.getElementById("ai").innerText=avg.toFixed(1);

  halfDay(data);
  tomorrow(data);

  if(!map) initMap(lat,lon);
  else{
    map.setView([lat,lon]);
    marker.setLatLng([lat,lon]);
  }
}

// 🔎 SEARCH UI
document.getElementById("search").addEventListener("input",async(e)=>{
  let res = await searchCity(e.target.value);

  let box = document.getElementById("results");
  box.innerHTML="";

  res.forEach(c=>{
    let d=document.createElement("div");
    d.className="result";
    d.innerText=c.name+","+c.country;

    d.onclick=()=>update(c.latitude,c.longitude);

    box.appendChild(d);
  });
});

// START
update();
setInterval(update,3600000);
