import logo from "./logo.svg";
import "./App.css";

function App() {
  console.log("ENV VALUE:", process.env.REACT_APP_API_URL);

  return (
    <div>
      <h1>Freight Booking System</h1>
    </div>
  );
}

export default App;
