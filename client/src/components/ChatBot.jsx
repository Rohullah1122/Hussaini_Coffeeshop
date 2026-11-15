import {useEffect,useRef,useState} from "react";
import {getreply,QUICK} from "../js/chatbot.js";
import "../styles/chatbot.css";


const ChatBot = ({user,ALorders,ALmenu}) => {
    const [open,setopen] = useState(false);
    const [text,settext] = useState("");
    const [typing,settyping] = useState(false);
    const [ALmessages,setALmessages] = useState([
        {from: "bot",text: "Hi! I'm the Hussaini's coffee assistant ☕ Ask me anything about our menu."}
    ]);

    const bottom = useRef(null);


    useEffect(() => {
        bottom.current?.scrollIntoView({behavior: "smooth"});
    },[ALmessages,typing,open]);


    const ask = (question) => {
        if (!question.trim()) return;

        setALmessages((ALold) => [...ALold,{from: "me",text: question}]);
        settext("");
        settyping(true);

        // short pause so it feels like the assistant is thinking
        setTimeout(() => {
            setALmessages((ALold) => [...ALold,{from: "bot",text: getreply(question,user,ALorders,ALmenu)}]);
            settyping(false);
        },600);
    };


    return (
        <div className="chatbot">
            {open &&
                <section className="chatwindow" aria-label="Coffee assistant">
                    <header className="chathead">
                        <div>
                            <strong>Coffee assistant</strong>
                            <span>Usually replies instantly</span>
                        </div>
                        <button onClick={() => setopen(false)} aria-label="Close chat">✕</button>
                    </header>

                    <div className="chatbody">
                        {ALmessages.map((m,i) =>
                            <p key={i} className={m.from === "me" ? "bubble me" : "bubble bot"}>{m.text}</p>
                        )}
                        {typing && <p className="bubble bot typing"><span /><span /><span /></p>}
                        <div ref={bottom} />
                    </div>

                    <div className="quick">
                        {QUICK.map((q) => <button key={q} onClick={() => ask(q)}>{q}</button>)}
                    </div>

                    <form className="chatform" onSubmit={(e) => { e.preventDefault(); ask(text); }}>
                        <input value={text} onChange={(e) => settext(e.target.value)} placeholder="Ask about our menu..." aria-label="Your question" />
                        <button className="btn small">Send</button>
                    </form>
                </section>
            }

            <button className="chatbubble" onClick={() => setopen(!open)} aria-label={open ? "Close coffee assistant" : "Open coffee assistant"}>
                {open ? "✕" : "☕"}
            </button>
        </div>
    );
};

export default ChatBot;
