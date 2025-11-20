const js = require('@googlemaps/polyline-codec');

function normalizeLng(lng) {
    return (lng % 360 + 540) % 360 - 180;
}

function normalizeLat(lat) {
    return Math.max(-90, Math.min(90, lat));
}

function getRandomPoint() {
    return [
        (Math.floor(Math.random() * 18000) - 9000) / 100,
        (Math.floor(Math.random() * 36000) - 18000) / 100,
    ];
}

function generateCompletelyRandomPath(n) {
    let coords = [];
    for (let i = 0; i < n; i++) {
        coords.push(getRandomPoint());
    }
    return js.encode(coords);
}

function generateRandomWalkPath(n, step = 0.001) {
    let [lat, lng] = getRandomPoint();

    let coords = [[lat, lng]];
    for (let i = 1; i < n; i++) {
        const angle = Math.random() * 360;

        coords.push([
            normalizeLat(lat + step * Math.sin(angle)),
            normalizeLng(lng + step * Math.cos(angle)),
        ]);
    }
    return js.encode(coords);
}

function generateStraightPath(n) {
    const start = getRandomPoint();
    const end = getRandomPoint();

    let coords = [];
    for (let i = 0; i < n; i++) {
        coords.push([
            start[0] + (end[0] - start[0]) * i / n,
            start[1] + (end[1] - start[1]) * i / n,
        ]);
    }
    return js.encode(coords);
}

module.exports = {
    generateCompletelyRandomPath,
    generateRandomWalkPath,
    generateStraightPath,
};
