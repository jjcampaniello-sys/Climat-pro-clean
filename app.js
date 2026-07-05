let userOffset = localStorage.getItem("offset") || 0;

// ---------------- METEO ----------------

async function weather(lat, lon){
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m`
  );
  return await res.json();
}

// ---------------- RESSENTI IA ----------------

function feel(temp, hum){
  let base = temp + (hum - 50) * 0.03;
  return base + parseFloat(userOffset);
}

// ---------------- GPS ----------------

function gps(){
  navigator.geolocation.getCurrentPosition(async pos => {
    loadWeather(pos.coords.latitude, pos.coords.longitude);
  });
}

// ---------------- RECHERCHE VILLE ----------------

async function searchCity(){
  let city = document.getElementById("search").value;

  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`
  );

  const data = await res.json();

  if(data.results){
    let lat = data.results[0].latitude;
    let lon = data.results[0].longitude;
    loadWeather(lat, lon);
  }else{
    alert("Ville non trouvée");
  }
}

// ---------------- LOAD ----------------

async function loadWeather(lat, lon){

  let data = await weather(lat, lon);

  let t = data.current_weather.temperature;
  let w = data.current_weather.windspeed;
  let h = data.hourly.relative_humidity_2m[0];

  document.getElementById("temp").innerText = t;
  document.getElementById("feel").innerText = feel(t,h).toFixed(1);
  document.getElementById("hum").innerText = h;
  document.getElementById("wind").innerText = w;
}

// ---------------- IA FEEDBACK ----------------

function feedback(type){

  if(type === "hot") userOffset -= 1;
  if(type === "cold") userOffset += 1;

  localStorage.setItem("offset", userOffset);

  document.getElementById("ai").innerText =
    "IA ajustée ✔️ (offset = " + userOffset + ")";
}
