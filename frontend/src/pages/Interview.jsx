import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import interviewer from "../assets/interviewer.png";

const SILENCE_TIMEOUT = 10000;
const WARNING_TIMEOUT = 5000;
const SUBMIT_TIMEOUT = 3000;

function Interview() {
  const navigate = useNavigate();
  const questionsRef = useRef(JSON.parse(localStorage.getItem("questions")) || []);
  const questions = questionsRef.current;

  const indexRef = useRef(0);
  const answerRef = useRef("");
  const resultsRef = useRef([]);
  const silenceTimer = useRef(null);
  const warningTimer = useRef(null);
  const isProcessingRef = useRef(false);
  const failedTopicsRef = useRef(new Set());

  const mediaRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [started, setStarted] = useState(false);
  const [mouthText, setMouthText] = useState("");
  const [phase, setPhase] = useState("greeting");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const mouthInterval = useRef(null);

  const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  useEffect(() => {
    if (isSpeaking) {
      mouthInterval.current = setInterval(() => setMouthOpen((o) => !o), 160);
    } else {
      clearInterval(mouthInterval.current);
      setMouthOpen(false);
    }
    return () => clearInterval(mouthInterval.current);
  }, [isSpeaking]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      SpeechRecognition.stopListening();
      clearTimeout(silenceTimer.current);
      clearTimeout(warningTimer.current);
      if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    if (phase !== "listening") return;
    
    answerRef.current = transcript;
    clearTimeout(warningTimer.current);
    clearTimeout(silenceTimer.current);
    
    if (transcript) {
      setIsWarning(false);
    }
    
    if (!transcript.trim()) {
      warningTimer.current = setTimeout(() => {
        if (!isProcessingRef.current) {
          setIsWarning(true);
          speak("No response");
        }
      }, WARNING_TIMEOUT);
      
      silenceTimer.current = setTimeout(() => {
        if (!isProcessingRef.current) {
          handleNoResponse();
        }
      }, SILENCE_TIMEOUT);
    } else {
      silenceTimer.current = setTimeout(() => {
        if (!isProcessingRef.current) {
          autoSubmit();
        }
      }, SUBMIT_TIMEOUT);
    }

    return () => {
      clearTimeout(warningTimer.current);
      clearTimeout(silenceTimer.current);
    };
  }, [transcript, phase]);

  const handleNoResponse = () => {
    SpeechRecognition.stopListening();
    setPhase("processing");
    setMouthText("No response");
    setIsWarning(false);
    
    const currentTopic = questions[indexRef.current]?.topic || "General";
    failedTopicsRef.current.add(currentTopic);
    
    const question = questions[indexRef.current]?.question || "Unknown question";
    resultsRef.current = [...resultsRef.current, { 
      question, 
      answer: "No response", 
      evaluation: {
        technical_score: 0, communication_score: 0,
        strengths: [], weaknesses: ["No response provided"],
        correct_answer: "", improvement_tips: ["Please try to answer even if unsure"]
      }
    }];
    
    setTimeout(() => advanceInterview(), 1000);
  };

  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 500000
      });
      mediaRecorderRef.current = mediaRecorder;
      videoChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) videoChunksRef.current.push(e.data);
      };
      
      mediaRecorder.start(1000);
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert("Please allow camera and microphone access.");
    }
  };

  const stopVideoRecording = () => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.onstop = () => resolve();
        mediaRecorderRef.current.stop();
      } else resolve();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setIsRecording(false);
    });
  };

  const saveVideoLocally = () => {
    if (videoChunksRef.current.length === 0) return null;
    const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    return { url, blob };
  };

  // const uploadVideo = async (blob) => {
  //   const formData = new FormData();
  //   const user = JSON.parse(localStorage.getItem('user')) || {};
  //   formData.append('video', blob, `interview-${Date.now()}.webm`);
  //   formData.append('userId', user.id || 'anonymous');
  //   try {
  //     const res = await API.post('/upload-interview-video', formData, {
  //       headers: { 'Content-Type': 'multipart/form-data' }
  //     });
  //     return res.data;
  //   } catch (err) { return null; }
  // };

  const speak = (text, onDone) => {
    if (phase === "done" || isProcessingRef.current) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    setMouthText(text);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.onend = () => { setIsSpeaking(false); if (onDone) onDone(); };
    utterance.onerror = () => { setIsSpeaking(false); if (onDone) onDone(); };
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    resetTranscript();
    answerRef.current = "";
    setIsWarning(false);
    setPhase("listening");
    setMouthText("Listening...");
    SpeechRecognition.startListening({ continuous: true, language: "en-US" });
  };

  const endInterview = async () => {
    window.speechSynthesis.cancel();
    SpeechRecognition.stopListening();
    clearTimeout(silenceTimer.current);
    clearTimeout(warningTimer.current);
    isProcessingRef.current = true;
    await stopVideoRecording();
    await new Promise(r => setTimeout(r, 500));
    const videoData = saveVideoLocally();
    
    const finalResults = {
      answers: resultsRef.current,
      videoUrl: videoData?.url || null,
      recordedAt: new Date().toISOString()
    };
    localStorage.setItem("interviewResults", JSON.stringify(finalResults));
    // if (videoData?.blob) uploadVideo(videoData.blob);
    navigate("/report");
  };

  const autoSubmit = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    SpeechRecognition.stopListening();
    clearTimeout(silenceTimer.current);
    clearTimeout(warningTimer.current);
    setPhase("processing");
    setMouthText("Analyzing...");

    const answer = answerRef.current.trim();
    const question = questions[indexRef.current]?.question;
    if (!answer || !question) { isProcessingRef.current = false; startListening(); return; }

    // Check if user said "I don't know" - SKIP follow-up entirely
    const noAttemptAnswers = [
        "i don't know", "i dont know", "dont know", "don't know",
        "no idea", "skip", "pass", "not sure", "idk"
    ];
    const normalizedAnswer = answer.toLowerCase().trim();
    
    if (noAttemptAnswers.includes(normalizedAnswer)) {
        const currentTopic = questions[indexRef.current]?.topic || "General";
        failedTopicsRef.current.add(currentTopic);
        
        resultsRef.current = [...resultsRef.current, { 
            question, answer, 
            evaluation: {
                technical_score: 0, communication_score: 0,
                strengths: [], weaknesses: ["Did not attempt"],
                correct_answer: "", improvement_tips: []
            }
        }];
        
        isProcessingRef.current = false;
        setMouthText("No problem, let's try a different topic.");
        setTimeout(() => advanceInterview(), 1000);
        return;
    }

    try {
      const res = await API.post("/evaluate", { question, answer });
      resultsRef.current = [...resultsRef.current, { question, answer, evaluation: res.data }];

      const score = res.data.technical_score;
      
      // Track failed topics for very low scores
      if (score <= 2) {
        const currentTopic = questions[indexRef.current]?.topic || "General";
        failedTopicsRef.current.add(currentTopic);
        advanceInterview();
        return;
      }
      
      // Only generate follow-up for moderate scores (3-8)
      if (score >= 3 && score <= 8) {
        let nextDifficulty;
        if (score <= 4) nextDifficulty = "easy";
        else if (score <= 7) nextDifficulty = "medium";
        else nextDifficulty = "hard";

        try {
          const fRes = await API.post("/followup-question", {
            topic: questions[indexRef.current]?.topic || "General",
            score: score,
            difficulty: nextDifficulty
          });
          
          if (fRes.data?.question) {
            const newQ = fRes.data.question.toLowerCase().trim();
            const currentQ = question.toLowerCase().trim();
            
            if (newQ === currentQ || newQ.includes(currentQ.substring(0, 15)) || currentQ.includes(newQ.substring(0, 15))) {
              advanceInterview();
              return;
            }
            
            indexRef.current = indexRef.current + 1;
            questions.splice(indexRef.current, 0, {
              question: fRes.data.question,
              topic: questions[indexRef.current - 1]?.topic || "General",
              difficulty: nextDifficulty
            });
            isProcessingRef.current = false;
            
            const msg = nextDifficulty === "easy" ? "Let me ask an easier question." :
                        nextDifficulty === "hard" ? "Great! Let's try a harder question." :
                        "Let's continue.";
            speak(msg, () => speak(fRes.data.question, () => startListening()));
            return;
          }
        } catch (_) {}
      }

      advanceInterview();
    } catch (err) {
      isProcessingRef.current = false;
      speak("Sorry, please try again.", () => startListening());
    }
  };

  const advanceInterview = async () => {
    const idx = indexRef.current;
    let nextIdx = idx + 1;
    
    // Skip questions from failed topics
    while (nextIdx < questions.length) {
      const nextTopic = questions[nextIdx]?.topic;
      if (nextTopic && failedTopicsRef.current.has(nextTopic)) {
        console.log(`Skipping failed topic: ${nextTopic}`);
        nextIdx++;
      } else {
        break;
      }
    }
    
    if (nextIdx >= questions.length) {
      nextIdx = idx + 1;
      if (nextIdx >= questions.length) {
        failedTopicsRef.current.clear();
        nextIdx = idx + 1;
      }
    }
    
    const isLast = nextIdx >= questions.length;
    const answered = resultsRef.current.length;

    if (isLast || answered >= 10) {
      setPhase("done");
      await stopVideoRecording();
      await new Promise(r => setTimeout(r, 500));
      const videoData = saveVideoLocally();
      localStorage.setItem("interviewResults", JSON.stringify({
        answers: resultsRef.current,
        videoUrl: videoData?.url || null,
        recordedAt: new Date().toISOString()
      }));
      isProcessingRef.current = false;
      // if (videoData?.blob) uploadVideo(videoData.blob);
      speak("Thank you! Your interview is complete.", () => setTimeout(() => navigate("/report"), 1500));
      return;
    }

    indexRef.current = nextIdx;
    isProcessingRef.current = false;
    const nextQ = questions[indexRef.current]?.question;
    if (nextQ) speak(nextQ, () => startListening());
  };

  const startInterview = () => {
    setStarted(true);
    startVideoRecording();
    
    if (questions.length === 0) return;

    const interviewType = localStorage.getItem("interviewType");
    let greeting;
    
    if (interviewType === "resume") {
      greeting = "Hello! Welcome to InterviewIQ. I have analyzed your resume and will ask you personalized questions. Speak clearly and I'll move to the next question automatically. Let's begin!";
    } else {
      const topic = localStorage.getItem("selectedTopic") || questions[0]?.topic || "this technology";
      greeting = `Hello! Welcome to InterviewIQ. I will test your knowledge on ${topic}. Speak clearly and I'll move to the next question automatically. Let's begin!`;
    }

    speak(greeting, () => {
      const firstQ = questions[0]?.question;
      if (firstQ) speak(firstQ, () => startListening());
    });
  };

  if (!browserSupportsSpeechRecognition) return <div style={styles.errorWrap}>Please use Chrome for speech recognition.</div>;
  if (!questions.length) return <div style={styles.errorWrap}>No questions found.</div>;

  if (!started) {
    return (
      <div style={styles.page}>
        <div style={styles.avatarSection}>
          <img src={interviewer} alt="AI" style={styles.avatar} />
          <h2 style={{ color: "#000", fontSize: "22px", margin: 0 }}>Are you ready?</h2>
          <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>Speak clearly and take your time.</p>
          <button onClick={startInterview} style={styles.readyBtn}>I'm Ready!</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <span style={styles.logo}>InterviewIQ</span>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {isRecording && <span style={{ color: "#ff0000", fontSize: "12px", fontWeight: 600 }}>● REC</span>}
          {phase !== "done" && <button onClick={endInterview} style={styles.endBtn}>End</button>}
          <span style={styles.badge}>
            {phase === "greeting" ? "Greeting" : phase === "listening" ? "Listening" : phase === "processing" ? "Analyzing" : "Done"}
          </span>
        </div>
      </div>

      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${Math.min((indexRef.current / questions.length) * 100, 100)}%` }} />
      </div>

      <div style={styles.avatarSection}>
        <img src={interviewer} alt="AI" style={styles.avatar} />
        
        <div style={styles.speechBubble}>
          <p style={styles.bubbleText}>{mouthText || "Initializing..."}</p>
        </div>

        {isWarning && (
          <div style={styles.warningBox}>No response</div>
        )}

        {phase !== "greeting" && phase !== "done" && (
          <div style={styles.qCounter}>Q{indexRef.current + 1}</div>
        )}

        {phase === "listening" && transcript && (
          <div style={styles.transcript}>{transcript.slice(-100)}</div>
        )}

        {phase === "done" && (
          <div style={styles.doneMsg}>Interview Complete!</div>
        )}
      </div>

      {isRecording && (
        <div style={styles.videoPreview}>
          <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
          <span style={{ position: "absolute", top: 4, left: 4, background: "rgba(0,0,0,0.6)", color: "#ff0000", fontSize: 10, padding: "2px 6px", borderRadius: 4 }}>LIVE</span>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#ffffff", display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "'Segoe UI', sans-serif" },
  header: { width: "100%", maxWidth: "800px", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid #e0e0e0" },
  logo: { fontSize: "20px", fontWeight: 800, color: "#000" },
  endBtn: { padding: "6px 14px", background: "#fff", color: "#ff0000", border: "1px solid #ff0000", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" },
  badge: { fontSize: "11px", fontWeight: 600, padding: "4px 12px", borderRadius: "99px", border: "1px solid #ccc", color: "#666" },
  progressBar: { width: "100%", height: "3px", background: "#f0f0f0" },
  progressFill: { height: "100%", background: "#000", transition: "width 0.5s" },
  avatarSection: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "24px" },
  avatar: { width: "150px", height: "150px", borderRadius: "50%", objectFit: "cover", border: "2px solid #e0e0e0" },
  speechBubble: { background: "#f5f5f5", border: "1px solid #e0e0e0", borderRadius: "12px", padding: "16px 20px", maxWidth: "500px", width: "90%", textAlign: "center" },
  bubbleText: { margin: 0, fontSize: "15px", color: "#000", lineHeight: 1.5 },
  warningBox: { padding: "8px 16px", background: "rgba(255,0,0,0.08)", color: "#ff0000", borderRadius: "8px", fontSize: "13px", fontWeight: 600, border: "1px solid rgba(255,0,0,0.2)" },
  qCounter: { fontSize: "12px", fontWeight: 700, color: "#000", background: "#f0f0f0", padding: "4px 14px", borderRadius: "99px", border: "1px solid #ccc" },
  transcript: { maxWidth: "500px", width: "90%", background: "#f9f9f9", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "10px 16px", fontSize: "13px", color: "#666", textAlign: "center" },
  doneMsg: { background: "#000", color: "#fff", borderRadius: "8px", padding: "12px 24px", fontWeight: 700, fontSize: "15px" },
  readyBtn: { padding: "12px 32px", background: "#000", color: "#fff", border: "none", borderRadius: "6px", fontSize: "15px", fontWeight: 700, cursor: "pointer", marginTop: "8px" },
  videoPreview: { position: "fixed", bottom: "16px", right: "16px", width: "140px", height: "100px", borderRadius: "8px", overflow: "hidden", border: "2px solid #ccc", background: "#000", zIndex: 100 },
  errorWrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontSize: "16px", background: "#fff", textAlign: "center", padding: "24px" },
};

export default Interview;