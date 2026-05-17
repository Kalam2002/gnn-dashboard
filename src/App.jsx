import { useEffect, useState } from "react";

import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Database,
} from "lucide-react";

function App() {

  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState("Connecting...");
  const [polling, setPolling] = useState(true);

  // ---------------- FETCH LOGS ----------------

  const fetchLogs = async () => {

    try {

      const response = await fetch(
        "https://gnn-api-t7k7.onrender.com/logs"
      );

      const data = await response.json();

      setLogs(data);

      setStatus("Connected");

    } catch (error) {

      console.log(error);

      setStatus("Disconnected");
    }
  };

  // ---------------- POLLING ----------------

  useEffect(() => {

    fetchLogs();

    let interval;

    if (polling) {

      interval = setInterval(() => {
        fetchLogs();
      }, 2000);
    }

    return () => clearInterval(interval);

  }, [polling]);

  // ---------------- METRICS ----------------

  const totalFlows = logs.reduce((acc, log) => {
    return acc + (log.response?.num_flows || 0);
  }, 0);

  let attacks = 0;
  let benign = 0;

  logs.forEach((log) => {

    const preds = log.response?.predictions || [];

    preds.forEach((p) => {

      if (
        p === 1 ||
        p !== "benign"
      ) {
        attacks++;
      } else {
        benign++;
      }
    });
  });

  // ---------------- CHART DATA ----------------

  const lineData = logs
    .slice()
    .reverse()
    .map((log, index) => {

      const preds =
        log.response?.predictions || [];

      let attackCount = 0;
      let benignCount = 0;

      preds.forEach((p) => {

        if (
          p === 1 ||
          p !== "benign"
        ) {
          attackCount++;
        } else {
          benignCount++;
        }
      });

      return {
        name: `${index + 1}`,
        attacks: attackCount,
        benign: benignCount,
      };
    });

  const pieData = [
    {
      name: "Attacks",
      value: attacks,
    },
    {
      name: "Benign",
      value: benign,
    },
  ];

  const COLORS = [
    "#ef4444",
    "#22c55e",
  ];

  // ---------------- UI ----------------

  return (

    <div
      style={{
        backgroundColor: "#0f172a",
        minHeight: "100vh",
        color: "white",
        padding: "20px",
        fontFamily: "Arial",
      }}
    >

      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: "25px",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >

        <div>

          <h1
            style={{
              fontSize: "42px",
              marginBottom: "5px",
            }}
          >
            GNN Intrusion Detection
          </h1>

          <p
            style={{
              color: "#94a3b8",
            }}
          >
            Real-time network threat analysis
          </p>

        </div>

        <div
          style={{
            display: "flex",
            gap: "15px",
            alignItems: "center",
          }}
        >

          <div
            style={{
              background:
                status === "Connected"
                  ? "#14532d"
                  : "#7f1d1d",

              padding: "10px 18px",

              borderRadius: "999px",

              fontWeight: "bold",
            }}
          >
            {status}
          </div>

          <button
            onClick={() =>
              setPolling(!polling)
            }
            style={{
              background: "#2563eb",
              border: "none",
              padding: "12px 18px",
              borderRadius: "10px",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {polling
              ? "Stop Polling"
              : "Start Polling"}
          </button>

        </div>

      </div>

      {/* ENDPOINT BAR */}

      <div
        style={{
          background: "#1e293b",
          padding: "20px",
          borderRadius: "15px",
          marginBottom: "25px",
          display: "flex",
          justifyContent:
            "space-between",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >

        <div>

          <span
            style={{
              color: "#94a3b8",
            }}
          >
            GET
          </span>

          <div
            style={{
              color: "#38bdf8",
            }}
          >
            https://gnn-api-t7k7.onrender.com/logs
          </div>

        </div>

        <div>

          <span
            style={{
              color: "#94a3b8",
            }}
          >
            POST
          </span>

          <div
            style={{
              color: "#a3e635",
            }}
          >
            https://gnn-api-t7k7.onrender.com/predict
          </div>

        </div>

      </div>

      {/* METRIC CARDS */}

      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",

          gap: "20px",

          marginBottom: "25px",
        }}
      >

        <Card
          title="Total flows"
          value={totalFlows}
          icon={<Database />}
          color="#3b82f6"
        />

        <Card
          title="Attacks detected"
          value={attacks}
          icon={<ShieldAlert />}
          color="#ef4444"
        />

        <Card
          title="Benign flows"
          value={benign}
          icon={<ShieldCheck />}
          color="#22c55e"
        />

        <Card
          title="Events received"
          value={logs.length}
          icon={<Activity />}
          color="#a855f7"
        />

      </div>

      {/* CHARTS */}

      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(400px, 1fr))",

          gap: "20px",

          marginBottom: "25px",
        }}
      >

        {/* LINE CHART */}

        <div
          style={{
            background: "#1e293b",
            borderRadius: "15px",
            padding: "20px",
            height: "400px",
          }}
        >

          <h2
            style={{
              marginBottom: "20px",
            }}
          >
            Flows Over Time
          </h2>

          <ResponsiveContainer
            width="100%"
            height="90%"
          >

            <LineChart data={lineData}>

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="attacks"
                stroke="#ef4444"
              />

              <Line
                type="monotone"
                dataKey="benign"
                stroke="#22c55e"
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

        {/* PIE CHART */}

        <div
          style={{
            background: "#1e293b",
            borderRadius: "15px",
            padding: "20px",
            height: "400px",
          }}
        >

          <h2
            style={{
              marginBottom: "20px",
            }}
          >
            Attack Breakdown
          </h2>

          <ResponsiveContainer
            width="100%"
            height="90%"
          >

            <PieChart>

              <Pie
                data={pieData}
                dataKey="value"
                outerRadius={120}
                label
              >

                {pieData.map(
                  (entry, index) => (

                    <Cell
                      key={index}
                      fill={COLORS[index]}
                    />
                  )
                )}

              </Pie>

              <Tooltip />

            </PieChart>

          </ResponsiveContainer>

        </div>

      </div>

      {/* LIVE EVENTS TABLE */}

      <div
        style={{
          background: "#1e293b",
          borderRadius: "18px",
          padding: "25px",
          marginTop: "25px",
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >

          <h2
            style={{
              fontSize: "24px",
              fontWeight: "bold",
            }}
          >
            Live Threat Events
          </h2>

          <div
            style={{
              color: "#94a3b8",
              fontSize: "14px",
            }}
          >
            Real-time intrusion monitoring
          </div>

        </div>

        <div
          style={{
            overflowX: "auto",
            borderRadius: "12px",
          }}
        >

          <table
            style={{
              width: "100%",
              borderCollapse:
                "collapse",
            }}
          >

            <thead>

              <tr
                style={{
                  background:
                    "#0f172a",
                  textAlign: "left",
                }}
              >

                <th style={tableHeader}>
                  Time
                </th>

                <th style={tableHeader}>
                  Source IP
                </th>

                <th style={tableHeader}>
                  Destination IP
                </th>

                <th style={tableHeader}>
                  Service
                </th>

                <th style={tableHeader}>
                  Prediction
                </th>

                <th style={tableHeader}>
                  Bytes
                </th>

              </tr>

            </thead>

            <tbody>

              {logs.map(
                (log, index) => {

                  const req =
                    log.request?.[0] || {};

                  const prediction =
                    log.response
                      ?.predictions?.[0] ||
                    "unknown";

                  return (

                    <tr
                      key={index}
                      style={{
                        borderBottom:
                          "1px solid rgba(255,255,255,0.06)",
                      }}
                    >

                      <td style={tableCell}>
                        {new Date(
                          log.timestamp *
                            1000
                        ).toLocaleTimeString()}
                      </td>

                      <td style={tableCell}>
                        {req.src_ip || "-"}
                      </td>

                      <td style={tableCell}>
                        {req.dst_ip || "-"}
                      </td>

                      <td style={tableCell}>
                        {req.service || "-"}
                      </td>

                      <td style={tableCell}>

                        <span
                          style={{
                            background:
                              prediction ===
                              "benign"
                                ? "#14532d"
                                : "#7f1d1d",

                            color: "white",

                            padding:
                              "6px 12px",

                            borderRadius:
                              "999px",

                            fontSize:
                              "13px",

                            fontWeight:
                              "bold",

                            textTransform:
                              "capitalize",
                          }}
                        >
                          {prediction}
                        </span>

                      </td>

                      <td style={tableCell}>
                        {(req.src_bytes ||
                          0) +
                          (req.dst_bytes ||
                            0)}
                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

// ---------------- CARD COMPONENT ----------------

function Card({
  title,
  value,
  icon,
  color,
}) {

  return (

    <div
      style={{
        background:
          "linear-gradient(145deg, #1e293b, #0f172a)",

        padding: "22px",

        borderRadius: "18px",

        border:
          `1px solid ${color}40`,

        boxShadow:
          `0 0 20px ${color}20`,

        transition:
          "0.3s ease",

        position: "relative",

        overflow: "hidden",
      }}
    >

      {/* GLOW */}

      <div
        style={{
          position: "absolute",
          top: "-20px",
          right: "-20px",
          width: "80px",
          height: "80px",
          background: `${color}20`,
          borderRadius: "50%",
          filter: "blur(20px)",
        }}
      />

      {/* HEADER */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "18px",
          color,
        }}
      >

        <div
          style={{
            background:
              `${color}20`,

            padding: "10px",

            borderRadius: "12px",
          }}
        >
          {icon}
        </div>

        <span
          style={{
            fontWeight: "600",
            fontSize: "15px",
          }}
        >
          {title}
        </span>

      </div>

      {/* VALUE */}

      <h1
        style={{
          fontSize: "52px",
          margin: 0,
        }}
      >
        {value}
      </h1>

      <p
        style={{
          color: "#94a3b8",
          marginTop: "10px",
          fontSize: "13px",
        }}
      >
        Live monitored metric
      </p>

    </div>
  );
}

// ---------------- TABLE STYLES ----------------

const tableHeader = {
  padding: "16px",
  color: "#94a3b8",
  fontSize: "14px",
  fontWeight: "bold",
};

const tableCell = {
  padding: "16px",
  fontSize: "14px",
};

export default App;