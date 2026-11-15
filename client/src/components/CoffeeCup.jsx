// Animated coffee cup for the welcome page.
// To use your LottieFiles animation instead: npm install lottie-react, save the file as data/coffee.json,
// then in MainPage.jsx replace <CoffeeCup /> with <Lottie animationData={coffeeanim} loop={true} />
const CoffeeCup = () => {

    return (
        <div className="coffeecup" aria-hidden="true">
            <div className="steam">
                <span /><span /><span />
            </div>
            <div className="cup">
                <div className="coffee" />
            </div>
            <div className="handle" />
            <div className="saucer" />
            <div className="bean b1" /><div className="bean b2" /><div className="bean b3" />
        </div>
    );
};

export default CoffeeCup;
