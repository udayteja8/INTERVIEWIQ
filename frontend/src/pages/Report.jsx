import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Report() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState(null);
  const [answers, setAnswers] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const interviewData = JSON.parse(localStorage.getItem("interviewResults")) || {};
    console.log("Interview Data:", interviewData);
    
    if (interviewData.videoUrl) {
      setVideoUrl(interviewData.videoUrl);
    }

    const answersData = interviewData.answers || [];
    setAnswers(answersData);

    const generateReport = async () => {
      try {
        if (!answersData || answersData.length === 0) {
          setError("No interview results found.");
          return;
        }

        console.log("Generating report...");
        const res = await API.post("/final-report", {
          results: answersData
        });

        if (!res.data) {
          setError("Report generation failed.");
          return;
        }

        setReport(res.data);

        // Get user from localStorage
        const user = JSON.parse(localStorage.getItem("user"));
        console.log("User:", user);

        // Save interview data
        console.log("Saving interview...");
        await API.post("/save-interview", {
          user_email: user?.email || "anonymous",
          analysis: JSON.parse(localStorage.getItem("analysis")) || null,
          questions: JSON.parse(localStorage.getItem("questions")) || [],
          answers: answersData,
          report: res.data,
          videoUrl: interviewData.videoUrl || null
        });

        console.log("Interview saved successfully");
      } catch (err) {
        console.log("Report Error:", err);
        setError("Failed to generate report.");
      }
    };

    generateReport();
  }, []);

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.logo}>IQ</div>
          <p style={styles.errorText}>{error}</p>
          <button style={styles.button} onClick={() => navigate("/post")}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.logo}>IQ</div>
          <h2 style={styles.title}>Generating Report...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.mainCard}>
        <div style={styles.logo}>IQ</div>
        <h1 style={styles.mainTitle}>Interview Report</h1>

        <div style={styles.scoreRow}>
          <div style={styles.scoreBox}>
            <h3 style={styles.scoreLabel}>Overall</h3>
            <h2 style={styles.scoreValue}>{report.overall_score}/100</h2>
          </div>
          <div style={styles.scoreBox}>
            <h3 style={styles.scoreLabel}>Technical</h3>
            <h2 style={styles.scoreValue}>{report.technical_average}/10</h2>
          </div>
          <div style={styles.scoreBox}>
            <h3 style={styles.scoreLabel}>Communication</h3>
            <h2 style={styles.scoreValue}>{report.communication_average}/10</h2>
          </div>
        </div>

        {videoUrl && (
          <div style={styles.videoSection}>
            <h3 style={styles.sectionTitle}>Interview Recording</h3>
            <video controls style={styles.video} src={videoUrl} />
          </div>
        )}

        <h3 style={styles.sectionTitle}>Question-wise Evaluation</h3>
        {answers.map((item, index) => (
          <div key={index} style={styles.questionCard}>
            <h4 style={styles.questionNum}>Question {index + 1}</h4>
            <p style={styles.questionText}><strong>Q:</strong> {item.question}</p>
            <p style={styles.answerText}><strong>Your Answer:</strong> {item.answer}</p>
            
            {item.evaluation && (
              <div style={styles.evaluationBox}>
                <div style={styles.scoreRow}>
                  <span style={styles.evalScore}>Technical: {item.evaluation.technical_score}/10</span>
                  <span style={styles.evalScore}>Communication: {item.evaluation.communication_score}/10</span>
                </div>
                
                {item.evaluation.strengths && item.evaluation.strengths.length > 0 && (
                  <div style={styles.evalSection}>
                    <strong style={styles.greenText}>✅ Strengths:</strong>
                    <ul style={styles.list}>
                      {item.evaluation.strengths.map((s, i) => (
                        <li key={i} style={styles.listItem}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {item.evaluation.weaknesses && item.evaluation.weaknesses.length > 0 && (
                  <div style={styles.evalSection}>
                    <strong style={styles.redText}>⚠️ Areas to Improve:</strong>
                    <ul style={styles.list}>
                      {item.evaluation.weaknesses.map((w, i) => (
                        <li key={i} style={styles.listItem}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {item.evaluation.correct_answer && (
                  <div style={styles.evalSection}>
                    <strong style={styles.blueText}>📝 Correct Answer:</strong>
                    <p style={styles.correctAnswer}>{item.evaluation.correct_answer}</p>
                  </div>
                )}
                
                {item.evaluation.improvement_tips && item.evaluation.improvement_tips.length > 0 && (
                  <div style={styles.evalSection}>
                    <strong>💡 Improvement Tips:</strong>
                    <ul style={styles.list}>
                      {item.evaluation.improvement_tips.map((tip, i) => (
                        <li key={i} style={styles.listItem}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <h3 style={styles.sectionTitle}>Overall Analysis</h3>
        
        <div style={styles.analysisBox}>
          <h4 style={styles.greenText}>✅ Strengths</h4>
          <ul style={styles.list}>
            {report.strengths?.map((item, index) => (
              <li key={index} style={styles.listItem}>{item}</li>
            ))}
          </ul>
        </div>

        <div style={styles.analysisBox}>
          <h4 style={styles.redText}>⚠️ Weak Topics</h4>
          <ul style={styles.list}>
            {report.weak_topics?.map((item, index) => (
              <li key={index} style={styles.listItem}>{item}</li>
            ))}
          </ul>
        </div>

        <div style={styles.analysisBox}>
          <h4 style={styles.blueText}>📚 Recommended Topics</h4>
          <ul style={styles.list}>
            {report.recommended_topics?.map((item, index) => (
              <li key={index} style={styles.listItem}>{item}</li>
            ))}
          </ul>
        </div>

        <div style={styles.summaryBox}>
          <h4>📝 Summary</h4>
          <p style={styles.summaryText}>{report.summary}</p>
        </div>

        <button style={styles.button} onClick={() => navigate("/post")}>
          Back to Home
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
  mainCard: { background: "#ffffff", borderRadius: "8px", padding: "40px", maxWidth: "700px", width: "100%", border: "1px solid #e0e0e0", textAlign: "center" },
  card: { background: "#ffffff", borderRadius: "8px", padding: "40px", maxWidth: "400px", width: "100%", border: "1px solid #e0e0e0", textAlign: "center" },
  logo: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: "50px", height: "50px", background: "#000000", borderRadius: "8px", color: "#ffffff", fontSize: "20px", fontWeight: "bold", marginBottom: "16px" },
  mainTitle: { fontSize: "24px", fontWeight: 700, color: "#000000", marginBottom: "24px" },
  title: { fontSize: "20px", fontWeight: 700, color: "#000000", marginBottom: "16px" },
  scoreRow: { display: "flex", gap: "12px", marginBottom: "24px", justifyContent: "center", flexWrap: "wrap" },
  scoreBox: { flex: 1, minWidth: "120px", padding: "16px", background: "#f5f5f5", borderRadius: "8px", border: "1px solid #e0e0e0" },
  scoreLabel: { fontSize: "12px", color: "#666", margin: "0 0 4px 0" },
  scoreValue: { fontSize: "24px", fontWeight: 700, color: "#000", margin: 0 },
  sectionTitle: { fontSize: "18px", fontWeight: 700, color: "#000", margin: "24px 0 16px 0", textAlign: "left" },
  questionCard: { background: "#f9f9f9", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "16px", marginBottom: "16px", textAlign: "left" },
  questionNum: { fontSize: "14px", fontWeight: 700, color: "#000", margin: "0 0 8px 0" },
  questionText: { fontSize: "14px", color: "#333", margin: "0 0 8px 0" },
  answerText: { fontSize: "14px", color: "#555", margin: "0 0 12px 0", fontStyle: "italic" },
  evaluationBox: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: "6px", padding: "12px" },
  evalScore: { fontSize: "13px", fontWeight: 600, color: "#000" },
  evalSection: { marginTop: "8px" },
  correctAnswer: { fontSize: "14px", color: "#333", margin: "4px 0 0 0", lineHeight: 1.5 },
  greenText: { color: "#008000" },
  redText: { color: "#cc0000" },
  blueText: { color: "#0066cc" },
  list: { margin: "4px 0 0 0", paddingLeft: "20px" },
  listItem: { fontSize: "13px", color: "#555", marginBottom: "2px" },
  analysisBox: { textAlign: "left", marginBottom: "12px" },
  summaryBox: { background: "#f5f5f5", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "16px", margin: "16px 0", textAlign: "left" },
  summaryText: { fontSize: "14px", color: "#333", lineHeight: 1.6, margin: "4px 0 0 0" },
  videoSection: { marginBottom: "24px" },
  video: { width: "100%", maxHeight: "300px", borderRadius: "8px", backgroundColor: "#000" },
  button: { padding: "12px 24px", background: "#000000", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", marginTop: "16px" },
  errorText: { color: "#cc0000", fontSize: "14px", marginBottom: "16px" },
};

export default Report;