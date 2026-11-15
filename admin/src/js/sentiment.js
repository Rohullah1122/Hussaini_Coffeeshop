// Simple "AI" sentiment: counts happy and unhappy words in a review, and uses the star rating
const ALgood = ["best","love","great","amazing","delicious","friendly","nice","cozy","good","fast","fresh","perfect","excellent","finally","recommend","back"];
const ALbad = ["late","cold","rude","wrong","slow","long","loud","dirty","bad","worst","disappointed","busy","expensive","never","burnt"];


export const sentiment = (review) => {
    const words = review.comment.toLowerCase().replace(/[^a-z\s]/g," ").split(/\s+/);

    let score = 0;
    words.forEach((w) => {
        if (ALgood.includes(w)) score += 1;
        if (ALbad.includes(w)) score -= 1;
    });
    score += (review.rating - 3);

    if (score >= 2) return "positive";
    if (score <= -2) return "negative";
    return "mixed";
};
