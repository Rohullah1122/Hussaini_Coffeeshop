import {useState} from "react";
import {Navigate,useNavigate} from "react-router-dom";
import "../styles/forms.css";


const Login = ({admin,login}) => {
    const navigate = useNavigate();

    const [email,setemail] = useState("");
    const [password,setpassword] = useState("");
    const [error,seterror] = useState("");


    if (admin) return <Navigate to="/" replace />;


    const submit = (e) => {
        e.preventDefault();

        if (!email.trim() || !password) return seterror("Please enter your email and password.");

        const problem = login(email,password);
        if (problem) return seterror(problem);

        navigate("/");
    };


    return (
        <div className="loginpage">
            <form className="logincard" onSubmit={submit} noValidate>
                <span className="brandmark big">H</span>
                <h1>Hussaini's Admin</h1>
                <p className="muted">Manage the menu, orders and bookings.</p>

                <label className="field">Email
                    <input type="email" value={email} onChange={(e) => setemail(e.target.value)} autoComplete="username" />
                </label>
                <label className="field">Password
                    <input type="password" value={password} onChange={(e) => setpassword(e.target.value)} autoComplete="current-password" />
                </label>

                {error && <p className="error">{error}</p>}
                <button className="btn full">Log in</button>
                <p className="demo">Demo admin: <strong>admin@hussainis.com</strong> / <strong>admin123</strong></p>
            </form>
        </div>
    );
};

export default Login;
