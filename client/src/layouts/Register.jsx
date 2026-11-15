import {useState} from "react";
import {Link,Navigate,useNavigate} from "react-router-dom";
import "../styles/account.css";


const Register = ({user,register}) => {
    const navigate = useNavigate();

    const [form,setform] = useState({full_name: "",email: "",phone: "",password: "",again: ""});
    const [errors,seterrors] = useState({});


    if (user) return <Navigate to="/account" replace />;


    const set = (key) => (e) => setform({...form,[key]: e.target.value});


    const submit = (e) => {
        e.preventDefault();

        const ALerrors = {};
        if (form.full_name.trim().length < 2) ALerrors.full_name = "Please enter your name.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) ALerrors.email = "Please enter a valid email.";
        if (form.phone && !/^[0-9()+\-\s]{10,}$/.test(form.phone.trim())) ALerrors.phone = "Please enter a valid phone number.";
        if (form.password.length < 6) ALerrors.password = "Use at least 6 characters.";
        if (form.password !== form.again) ALerrors.again = "Passwords don't match.";

        seterrors(ALerrors);
        if (Object.keys(ALerrors).length) return;

        const problem = register({full_name: form.full_name.trim(),email: form.email,phone: form.phone.trim(),password: form.password});
        if (problem) return seterrors({email: problem});

        navigate("/account");
    };


    return (
        <section className="container section authpage">
            <form className="card authcard" onSubmit={submit} noValidate>
                <span className="eyebrow">Join us</span>
                <h1>Create an account</h1>
                <p className="muted small">Save your favorites, see your orders and manage your reservations.</p>

                <label className="field">Full name
                    <input value={form.full_name} onChange={set("full_name")} autoComplete="name" />
                    {errors.full_name && <span className="error">{errors.full_name}</span>}
                </label>
                <label className="field">Email
                    <input type="email" value={form.email} onChange={set("email")} autoComplete="email" />
                    {errors.email && <span className="error">{errors.email}</span>}
                </label>
                <label className="field">Phone (optional)
                    <input value={form.phone} onChange={set("phone")} autoComplete="tel" />
                    {errors.phone && <span className="error">{errors.phone}</span>}
                </label>
                <label className="field">Password
                    <input type="password" value={form.password} onChange={set("password")} autoComplete="new-password" />
                    {errors.password && <span className="error">{errors.password}</span>}
                </label>
                <label className="field">Password again
                    <input type="password" value={form.again} onChange={set("again")} autoComplete="new-password" />
                    {errors.again && <span className="error">{errors.again}</span>}
                </label>

                <button className="btn full">Create account</button>
                <p className="muted small">Already have one? <Link to="/login">Log in</Link></p>
            </form>
        </section>
    );
};

export default Register;
