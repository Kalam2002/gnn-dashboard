# 🛡 Advanced GNN Intrusion Detection Dashboard

A modern real-time cybersecurity monitoring dashboard powered by a **Graph Neural Network (GNN)** intrusion detection API.

Built using **React**, **Tailwind CSS**, **Recharts**, **Leaflet**, and **FastAPI**, this platform visualizes live network threats, attack classifications, geolocation intelligence, and traffic analytics in a professional SOC-style interface.

---

# 🌐 Live Deployment

## 🔥 Live Dashboard
https://gnn-dashboard.vercel.app/

## ⚡ Live API
https://gnn-api-t7k7.onrender.com/predict

---

# 📸 Dashboard Preview

> Enterprise-style Security Operations Center (SOC) dashboard with:
- live attack monitoring
- real-time analytics
- global threat visualization
- intrusion detection intelligence
- cyberpunk-inspired UI

---

# 🚀 Features

## ⚡ Real-Time Threat Monitoring
- Polls the backend every 2 seconds
- Displays live intrusion events instantly
- Stable polling architecture (no WebSocket dependency)
- Compatible with Render free tier deployment

---

# 🌍 Threat Intelligence

## 🗺 Global Attack Map
- Interactive live world map
- Visualizes attacker IP locations
- Dynamic threat markers
- Popup event metadata
- Real-time geolocation intelligence

## 🧠 Attack Classification
Visual attack distribution including:
- DDoS
- Port Scan
- Botnet
- Brute Force
- SQL Injection
- XSS
- MITM
- Unknown attacks

---

# 📊 Analytics & Visualization

## 📈 Threat Trend Graph
- Area chart visualization
- Threat spikes over time
- Traffic intensity analysis
- Live throughput tracking

## 📌 KPI Cards
- Total attacks
- Traffic logs
- Threat severity
- Traffic volume
- Live system status

## 📉 Traffic Analytics
- Packet intensity monitoring
- Threat density metrics
- Attack frequency visualization

---

# 🚨 Live Threat Feed

Professional SOC-style event table displaying:
- Source IP
- Destination IP
- Network service
- Threat classification
- Event timestamp
- Severity badge
- Traffic metadata

---

# 🎨 UI/UX Features

- Cyberpunk SOC design
- Glassmorphism panels
- Animated cards
- Gradient visual effects
- Responsive layout
- Dark security dashboard theme
- Framer Motion animations
- Enterprise monitoring aesthetics

---

# 🏗 Architecture

```text
Traffic Source / Honeypot
            ↓
FastAPI GNN API (Render)
            ↓
SQLite Logging Engine
            ↓
Polling Engine (/logs)
            ↓
React SOC Dashboard (Vercel)
```

---

# 🏗 Tech Stack

| Layer | Technology |
|------|-------------|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Maps | Leaflet.js |
| Animations | Framer Motion |
| Icons | Lucide React |
| Backend API | FastAPI |
| ML Model | Graph Neural Network (GNN) |
| Deployment | Vercel + Render |

---

# 📦 Installation

## Clone Repository

```bash
git clone https://github.com/Kalam2002/gnn-dashboard.git
cd gnn-dashboard
```

---

## Install Dependencies

```bash
npm install
```

---

## Install Additional Libraries

```bash
npm install recharts lucide-react framer-motion react-leaflet leaflet react-countup
```

---

# 🚀 Run Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

# ⚙️ Configuration

Inside `src/App.jsx`:

```js
const API_BASE =
  "https://gnn-api-t7k7.onrender.com";
```

You can replace this with:
- localhost backend
- custom inference server
- another deployed API

---

# 🔌 API Endpoints

| Method | Endpoint | Description |
|------|------|------|
| GET | `/logs` | Fetch latest prediction logs |
| POST | `/predict` | Submit network flow data |

---

# 📡 Example Predict Request

```bash
curl -X POST "https://gnn-api-t7k7.onrender.com/predict" \
-H "Content-Type: application/json" \
-d '{
  "flows": [{
    "src_ip": "8.8.8.8",
    "src_port": 49180,
    "dst_ip": "192.168.1.37",
    "dst_port": 8080,
    "proto": "tcp",
    "service": "-",
    "duration": 0.00013,
    "src_bytes": 0,
    "dst_bytes": 0,
    "conn_state": "REJ",
    "src_pkts": 1,
    "dst_pkts": 1
  }]
}'
```

---

# 📁 Project Structure

```text
gnn-dashboard/
│
├── src/
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│
├── public/
│
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

# 🌐 Deployment

## Frontend Deployment
Recommended:
- Vercel
- Netlify

## Backend Deployment
Recommended:
- Render
- Railway
- VPS

---

# 🔥 Advanced Features

- Real-time polling engine
- Interactive world threat map
- Threat severity analytics
- Live event feed
- Animated SOC UI
- Responsive design
- Traffic monitoring charts
- Attack classification visualization

---

# 🧠 Future Improvements

Planned enhancements:
- SIEM integrations
- Kafka streaming
- Real geolocation enrichment
- Authentication system
- Threat clustering
- PostgreSQL migration
- Packet visualization
- ElasticSearch integration
- WebSocket upgrade
- Threat scoring engine
- User management
- Alert notifications

---

# 🔗 Related Repository

## GNN API
https://github.com/Kalam2002/gnn-api

---

# 👨‍💻 Author

**Abdul Kalam**  
B.Tech CSE (Cybersecurity)

- Cybersecurity Enthusiast
- Full Stack Developer
- AI + Network Security Researcher

---

# 📜 License

MIT License

---

# ⭐ Support

If you found this project useful:
- Star the repository
- Fork the project
- Contribute improvements
- Share feedback

---

# ⚠️ Disclaimer

This project is intended for:
- cybersecurity research
- educational purposes
- threat visualization
- SOC dashboard experimentation

Use responsibly.
