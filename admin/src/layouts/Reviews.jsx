import {useState} from "react";
import {sentiment} from "../js/sentiment.js";
import {prettydatetime} from "../js/helpers.js";
import "../styles/tables.css";


const Reviews = ({ALreviews,deletereview}) => {
    const [filter,setfilter] = useState("all");


    const ALrated = ALreviews
        .map((r) => ({...r,feeling: sentiment(r)}))
        .sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

    const ALshown = ALrated.filter((r) => filter === "all" || r.feeling === filter);
    const average = ALreviews.length ? ALreviews.reduce((s,r) => s + r.rating,0) / ALreviews.length : 0;
    const count = (f) => ALrated.filter((r) => r.feeling === f).length;


    return (
        <div className="pagewrap">
            <div className="pagetitle">
                <div>
                    <h1>Reviews</h1>
                    <p className="muted">{average.toFixed(1)} ★ average from {ALreviews.length} reviews</p>
                </div>
            </div>

            <div className="toolbar">
                <div className="pills">
                    {["all","positive","mixed","negative"].map((f) =>
                        <button key={f} className={filter === f ? "pill active" : "pill"} onClick={() => setfilter(f)}>
                            {f}{f !== "all" && " (" + count(f) + ")"}
                        </button>
                    )}
                </div>
            </div>

            <div className="reviewlist">
                {ALshown.map((r) =>
                    <article key={r.id} className="panel review">
                        <div className="reviewhead">
                            <div>
                                <strong>{r.name}</strong>
                                <span className="stars" aria-label={r.rating + " out of 5 stars"}>{"★".repeat(r.rating)}<em>{"★".repeat(5 - r.rating)}</em></span>
                            </div>
                            <span className={"status " + r.feeling}>{r.feeling}</span>
                        </div>
                        <p>{r.comment}</p>
                        <div className="reviewfoot">
                            <span className="muted small">{prettydatetime(r.created_at)}</span>
                            <button className="linkbtn dangertext" onClick={() => deletereview(r.id)}>Remove</button>
                        </div>
                    </article>
                )}
                {ALshown.length === 0 && <p className="muted">No reviews here.</p>}
            </div>
        </div>
    );
};

export default Reviews;
