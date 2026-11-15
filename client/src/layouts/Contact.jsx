import {useState} from "react";
import cafe from "../data/cafe.json";
import {loaddata,savedata} from "../js/storage.js";
import {prettytime} from "../js/helpers.js";
import "../styles/mainpage.css";


const Contact = () => {
    const [form,setform] = useState({name: "",email: "",message: ""});
    const [errors,seterrors] = useState({});
    const [sent,setsent] = useState(false);


    const set = (key) => (e) => setform({...form,[key]: e.target.value});


    const send = (e) => {
        e.preventDefault();

        const ALerrors = {};
        if (form.name.trim().length < 2) ALerrors.name = "Please enter your name.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) ALerrors.email = "Please enter a valid email.";
        if (form.message.trim().length < 5) ALerrors.message = "Please write a short message.";

        seterrors(ALerrors);
        if (Object.keys(ALerrors).length) return;

        const ALmessages = loaddata("messages",[]);
        savedata("messages",[...ALmessages,{...form,created_at: new Date().toISOString()}]);

        setform({name: "",email: "",message: ""});
        setsent(true);
    };


    return (
        <section className="container section">
            <div className="pagehead">
                <span className="eyebrow">Contact</span>
                <h1>Get in touch</h1>
            </div>

            <div className="contactgrid">
                <div className="card">
                    <h2>Visit us</h2>
                    <p>{cafe.address}</p>
                    <p><a href={"tel:" + cafe.phone.replace(/[^0-9]/g,"")}>{cafe.phone}</a></p>
                    <p><a href={"mailto:" + cafe.email}>{cafe.email}</a></p>

                    <h3>Opening hours</h3>
                    <ul className="hourslist">
                        {cafe.hours.map((h) =>
                            <li key={h.day}><span>{h.day}</span><span>{prettytime(h.open)} – {prettytime(h.close)}</span></li>
                        )}
                    </ul>
                </div>

                <form className="card" onSubmit={send} noValidate>
                    <h2>Send us a message</h2>

                    <label className="field">Name
                        <input value={form.name} onChange={set("name")} autoComplete="name" />
                        {errors.name && <span className="error">{errors.name}</span>}
                    </label>
                    <label className="field">Email
                        <input type="email" value={form.email} onChange={set("email")} autoComplete="email" />
                        {errors.email && <span className="error">{errors.email}</span>}
                    </label>
                    <label className="field">Message
                        <textarea rows="4" value={form.message} onChange={set("message")} />
                        {errors.message && <span className="error">{errors.message}</span>}
                    </label>

                    {sent && <p className="success">Thanks! We'll get back to you soon.</p>}
                    <button className="btn">Send message</button>
                </form>
            </div>
        </section>
    );
};

export default Contact;
