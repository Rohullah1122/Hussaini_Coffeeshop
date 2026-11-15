import {useState} from "react";
import {Link,Navigate,useNavigate} from "react-router-dom";
import "../styles/account.css";


const Login = ({user,login}) => {
    const navigate = useNavigate();

    const [email,setemail] = useState("");
    const [password,setpassword] = useState("");
    const [error,seterror] = useState("");


    if (user) return <Navigate to="/account" replace />;


    const submit = (e) => {
        e.preventDefault();

        if (!email.trim() || !password) return seterror("Please enter your email and password.");

        const problem = login(email,password);
        if (problem) return seterror(problem);

        navigate("/account");
    };


    return (
        <section className="container section authpage">
            <form className="card authcard" onSubmit={submit} noValidate>
                <span className="eyebrow">Welcome back</span>
                <h1>Log in</h1>

                <label className="field">Email
                    <input type="email" value={email} onChange={(e) => setemail(e.target.value)} autoComplete="username" />
                </label>
                <label className="field">Password
                    <input type="password" value={password} onChange={(e) => setpassword(e.target.value)} autoComplete="current-password" />
                </label>

                {error && <p className="error">{error}</p>}
                <button className="btn full">Log in</button>

                <p className="muted small">New here? <Link to="/register">Create an account</Link></p>
                <p className="demo">Demo account: <strong>demo@hussainis.com</strong> / <strong>demo123</strong></p>
            </form>
        </section>
    );
};

export default Login;
