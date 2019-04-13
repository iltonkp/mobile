import axios from "axios";

const api = axios.create({
  baseURL: "https://omnistack-backend-ilton.herokuapp.com"
});

export default api;
