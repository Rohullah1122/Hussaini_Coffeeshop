const StatCard = ({label,value,note,tone = "latte"}) => {

    return (
        <div className={"statcard " + tone}>
            <span className="statlabel">{label}</span>
            <strong className="statvalue">{value}</strong>
            {note && <span className="statnote">{note}</span>}
        </div>
    );
};

export default StatCard;
