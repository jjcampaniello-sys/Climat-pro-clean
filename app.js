setInterval(() => {
  document.getElementById("temp").innerText = (20 + Math.random()*5).toFixed(1);
  document.getElementById("hum").innerText = (40 + Math.random()*30).toFixed(1);
}, 2000);
