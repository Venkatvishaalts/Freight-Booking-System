const http = require('http');
http.get('http://localhost:5000/api/vehicles/search?pickup=Delhi&destination=Chennai&weight=150', {headers:{Authorization:'Bearer fake'}}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
