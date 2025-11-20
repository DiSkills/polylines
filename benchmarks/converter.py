import os

import gpxpy
import polyline


def convert(gpx) -> tuple[int, str]:
    coords = []
    for track in gpx.tracks:
        for segment in track.segments:
            for point in segment.points:
                coords.append((point.latitude, point.longitude))
    return len(coords), polyline.encode(coords)


def main() -> None:
    for filename in os.listdir("gpx"):
        with open(f"gpx/{filename}") as file:
            gpx = gpxpy.parse(file)
        size, encoded = convert(gpx)
        with open(f"traces/{size}.txt", "w") as file:
            file.write(encoded)


if __name__ == "__main__":
    main()
