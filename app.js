let dataHistory = [];
let chart;

function getFakeData(){
  return {
    temp: 18 + Math.random()*10,
    hum: 30 + Math.random()*50
  };
}

function comfort(t,h){
  if(t > 27) return "🔥 Chaud";
  if(h > 70) return "🌫️ Humide";
  return "😌 OK";
}

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

function update(){
  const d = getFakeData();

  document.getElementById("temp").innerText = d.temp.toFixed(1);
  document.getElementById("hum").innerText = d.hum.toFixed(1);
  document.getElementById("comfort").innerText = comfort(d.temp,d.hum);

  let time = new Date().toLocaleTimeString();

  chart.data.labels.push(time);
  chart.data.datasets[0].data.push(d.temp);
  chart.update();

  let li = document.createElement("li");
  li.innerText = `${time} → ${d.temp.toFixed(1)}°C / ${d.hum.toFixed(1)}%`;
  document.getElementById("history").prepend(li);

  if(d.temp > 27 && Notification.permission === "granted"){
    new Notification("🔥 Trop chaud détecté !");
  }
}

if(Notification.permission !== "granted"){
  Notification.requestPermission();
}

initChart();
setInterval(update, 3000);
