let offset = localStorage.getItem("offset") || 0;

// ---------------- API ----------------

async function weather(lat, lon){
  const res = await fetch(
`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,windspeed_10m`
  );
  return await res.json();
}

// ---------------- HEAT INDEX ----------------

function realFeel(t, h, w){

  let feel = t;

  // chaleur
  if(t > 26){
    feel = t + 0.33*h/100*6 - 2;
  }

  // vent froid
  if(t < 15){
    feel = t - (w * 0.2);
  }

  return feel + parseFloat(offset);
}

// ---------------- GPS ----------------

function gps(){
  navigator.geolocation.getCurrentPosition(pos => {
    load(pos.coords.latitude, pos.coords.longitude);
  });
}

// ---------------- VILLE ----------------

async function searchCity(){
  let city = document.getElementById("search").value;

  const res = await fetch(
`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`
  );

  const data = await res.json();

  if(data.results){
    load(data.results[0].latitude, data.results[0].longitude);
  }else{
    alert("Ville non trouvée");
  }
}

// ---------------- LOAD ----------------

async function load(lat, lon){

  let data = await weather(lat, lon);

  let t = data.current_weather.temperature;
  let w = data.current_weather.windspeed;
  let h = data.hourly.relative_humidity_2m[0];

  let f = realFeel(t,h,w);

  document.getElementById("temp").innerText = t;
  document.getElementById("feel").innerText = f.toFixed(1);
  document.getElementById("hum").innerText = h;
  document.getElementById("wind").innerText = w;

  forecast(data);
  tomorrow(data);
  alerts(t,h);
}

// ---------------- PREVISIONS ----------------

function forecast(data){

  let temps = data.hourly.temperature_2m;

  let matin = temps[8];
  let midi = temps[12];
  let soir = temps[18];

  document.getElementById("forecast").innerText =
  "Matin: "+matin+"°C | Midi: "+midi+"°C | Soir: "+soir+"°C";
}

// ---------------- DEMAIN IA ----------------

function tomorrow(data){

  let t = data.hourly.temperature_2m[24];
  let h = data.hourly.relative_humidity_2m[24];
  let w = data.hourly.windspeed_10m[24];

  let f = realFeel(t,h,w);

  document.getElementById("tomorrow").innerText =
  "Ressenti prévu : "+f.toFixed(1)+"°C";
}

// ---------------- ALERTES ----------------

function alerts(t,h){

  let msg = "OK";

  if(t > 32) msg = "🔥 Forte chaleur";
  if(h > 85) msg = "💧 Humidité élevée";

  document.getElementById("alert").innerText = msg;
}

// ---------------- IA ----------------

function feedback(type){

  if(type === "hot") offset -= 1;
  if(type === "cold") offset += 1;

  localStorage.setItem("offset", offset);

  document.getElementById("ai").innerText =
  "IA ajustée ("+offset+")";
}
