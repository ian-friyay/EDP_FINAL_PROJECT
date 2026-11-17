/**
 * Weather Controller - Campus Weather & Event Suitability
 * Ported from Laravel WeatherController.php with OpenWeather API support
 * and high-fidelity realistic fallback for campus locations.
 */

const getWeather = async (req, res) => {
  const city = req.query.city || 'Calapan';
  const lat = req.query.lat || '13.4115';
  const lon = req.query.lon || '121.1803';
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );

      if (response.ok) {
        const data = await response.json();
        const mainCondition = data.weather?.[0]?.main || 'Clear';
        const isRainy = ['rain', 'thunderstorm', 'drizzle'].includes(
          mainCondition.toLowerCase()
        );

        return res.status(200).json({
          status: 'success',
          message: 'Weather forecast retrieved.',
          data: {
            location: data.name || `${city} Campus`,
            temperature: Math.round(data.main?.temp || 29),
            feels_like: Math.round(data.main?.feels_like || 32),
            condition: mainCondition,
            description:
              data.weather?.[0]?.description
                ? data.weather[0].description.charAt(0).toUpperCase() +
                  data.weather[0].description.slice(1)
                : 'Clear skies across campus',
            icon: data.weather?.[0]?.icon || '02d',
            humidity: data.main?.humidity || 74,
            wind_speed: data.wind?.speed || 3.6,
            suitable_for_events: !isRainy,
          },
        });
      }
    } catch (err) {
      console.warn('OpenWeather live fetch failed, using campus fallback:', err.message);
    }
  }

  // Realistic dynamic campus weather simulation based on hour
  const currentHour = new Date().getHours();
  let temp = 29;
  let feels = 32;
  let condition = 'Partly Cloudy';
  let desc = 'Great weather for outdoor campus photography & service meetups';
  let icon = '02d';

  if (currentHour >= 6 && currentHour < 11) {
    temp = 27;
    feels = 29;
    condition = 'Clear Sky';
    desc = 'Pleasant morning breeze. Ideal for outdoor campus service rendezvous.';
    icon = '01d';
  } else if (currentHour >= 11 && currentHour < 15) {
    temp = 32;
    feels = 36;
    condition = 'Sunny';
    desc = 'Warm midday sun. Hydrate well when meeting at campus landmarks.';
    icon = '01d';
  } else if (currentHour >= 15 && currentHour < 18) {
    temp = 29;
    feels = 31;
    condition = 'Partly Cloudy';
    desc = 'Golden hour. Excellent lighting for photo shoots and outdoor handovers.';
    icon = '02d';
  } else {
    temp = 26;
    feels = 28;
    condition = 'Fair Evening';
    desc = 'Cool campus evening. Perfect for Library Commons and Student Center rendezvous.';
    icon = '02n';
  }

  return res.status(200).json({
    status: 'success',
    message: 'Campus weather retrieved.',
    data: {
      location: `${city} Campus, Philippines`,
      temperature: temp,
      feels_like: feels,
      condition,
      description: desc,
      icon,
      humidity: 74,
      wind_speed: 3.6,
      suitable_for_events: true,
    },
  });
};

module.exports = {
  getWeather,
};
