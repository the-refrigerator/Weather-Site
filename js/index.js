const cities = {
  Cairo: [30.0626, 31.2497, "Africa/Cairo"],
  London: [51.5074, 0.1278, "Europe/London"],
  Paris: [48.8566, 2.3522, "Europe/Paris"],
  "New York": [40.7128, -74.006, "America/New_York"],
  Beirut: [33.8938, 35.5018, "Asia/Beirut"],
  Dubai: [25.2048, 55.2708, "Asia/Dubai"],
  Karbala: [32.6169, 44.0248, "Asia/Baghdad"],
};

document.getElementById("city").addEventListener("change", async () => {
  // city is a select element. get the value of the selected option
  const city = document.getElementById("city").value;
  const coords = cities[city];

  const data = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${coords[0]}&longitude=${coords[1]}&current=temperature_2m,weather_code,relative_humidity_2m,is_day,apparent_temperature,precipitation,cloud_cover&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timeformat=unixtime&timezone=auto`,
  )
    .then((response) => response.json())
    .then((data) => data);

  // create new element for current weather and time
  const div = document.createElement("div");
  console.log(data.current.weather_code);
  const weather_code =
    codes[data.current.weather_code][data.current.is_day ? "day" : "night"];
  const currentTime = await fetch(
    `https://worldtimeapi.org/api/timezone/${coords[2]}`,
  )
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      const resp = new Date(data.unixtime * 1000);
      const hours = resp.getHours();
      const minutes = resp.getMinutes();

      // Format hours in 12-hour format and add AM/PM
      const formattedHours = (hours % 12 || 12).toString().padStart(2, "0");
      const amPm = hours < 12 ? "AM" : "PM";

      // Create the final formatted string
      return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${amPm}`;
    });

  div.innerHTML = `
        <div>
              <h2 class="currentTemp">${data.current.temperature_2m}°C</h2>
              <p class="feelsLike">Feels like ${data.current.apparent_temperature}°C</p>
              <p>${weather_code.description}</p>
            <p><i class="fa-regular fa-clock"></i> ${currentTime}</p>
            <p><i class="fa-solid fa-droplet"></i> ${data.current.relative_humidity_2m} %</p>
          <p><i class="fa-solid fa-cloud"></i> ${data.current.cloud_cover}% coverage</p>
        </div>
        <img
            src="${weather_code.image}"
            alt="${weather_code.description}"
          class="forecastImage"
        />
        `;

  const divs = [];

  data.daily.time.forEach((t, i) => {
    const dateObject = new Date(t * 1000);

    divs.push(document.createElement("div"));
    divs[i].classList.add("dailyForecastCard");
    const weather_code = codes[data.daily.weather_code[i]].day;
    // format the time to be "Tuesday, 12:00 PM"
    const dayOfWeek = dateObject.toLocaleString("en-US", { weekday: "long" });
    const date = dateObject.getDate();
    const month = dateObject.getMonth() + 1; // Months are zero-based, so add 1

    // Create the final formatted string
    const formattedDateString = `${dayOfWeek} ${date}/${month}`;

    divs[i].innerHTML = `
    <div class="dailyForecastCard">
      <img
        src="${weather_code.image}"
        alt="${weather_code.description}"
        class="forecastImage"
      />
      <div>
            <h3 class="currentTemp">${data.daily.temperature_2m_max[i]}°C <span class="minTemp">/${data.daily.temperature_2m_min[i]}°C</span></h3>
        <p> ${weather_code.description} </p>
        <p><i class="fa-solid fa-calendar-day"></i> ${formattedDateString}</p>
            <p><i class="fa-solid fa-cloud-showers-heavy"></i> ${data.daily.precipitation_probability_max[i]}%</p>
      </div>
    </div>
        `;
  });

  //remove the first element from divs
  divs.shift();

  div.classList.add("currentForecastCard");
  // document.getElementById("results").innerHTML = "";
  const element = document.getElementById("forecastContainer");
  element.innerHTML = "";
  element.appendChild(div);
  divs.forEach((div) => element.appendChild(div));
  fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${coords[0]}&longitude=${coords[1]}&hourly=apparent_temperature&timeformat=unixtime`,
  )
    .then((response) => response.json())
    .then((data) => {
      const ctx = document.getElementById("plot").getContext("2d");
      ctx.width = 400;
      new Chart(ctx, {
        type: "line",
        data: {
          labels: data.hourly.time.map((t) => {
            const dateObject = new Date(t * 1000);
            const dayOfWeek = [
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ][dateObject.getDay()];
            const hours = dateObject.getHours();
            const minutes = dateObject.getMinutes();

            // Format hours in 12-hour format and add AM/PM
            const formattedHours = (hours % 12 || 12)
              .toString()
              .padStart(2, "0");
            const amPm = hours < 12 ? "AM" : "PM";

            // Create the final formatted string
            return `${dayOfWeek} ${formattedHours}:${minutes
              .toString()
              .padStart(2, "0")} ${amPm}`;
          }),
          datasets: [
            {
              label: "Temperature",
              data: data.hourly.apparent_temperature,
              fill: false,
              borderColor: "rgb(75, 192, 192)",
              tension: 0.1,
              pointRadius: 0,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
          legend: {
            display: false,
            labels: {
              display: false,
            },
          },
        },
      });
    });
});
