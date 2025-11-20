import json
import random
import subprocess
import sys

from collections import defaultdict
from typing import Literal, TypeAlias

Implementation: TypeAlias = Literal["js", "rust", "wat"]


def shuffle_data_file(filename: str) -> None:
    with open(filename, "r+") as file:
        data = json.load(file)
        random.shuffle(data["questions"])

        file.seek(0)
        json.dump(data, file)


def get_algorithm_running_time(
    benchmark: str, implementation: Implementation, *args,
) -> float:
    result = subprocess.run(
        ["node", benchmark, implementation, *args], capture_output=True,
    )
    return float(result.stdout)


def collect_statistics(
    n: int, benchmark: str, filename: str,
    implementations: list[Implementation], size: int,
) -> dict[Implementation, list[float]]:
    statistics = defaultdict(list)
    for _ in range(n):
        shuffle_data_file(filename)
        for implementation in implementations:
            time = get_algorithm_running_time(
                benchmark, implementation, str(size),
            )
            statistics[implementation].append(time)
    return statistics


def main() -> None:
    sample_size = int(sys.argv[1])
    run_size = int(sys.argv[2])
    statistics = collect_statistics(
        sample_size, "reality.js", "geopuzzle.json",
        ["js", "wat", "rust"], run_size,
    )
    with open("stats/reality.json", "w") as file:
        json.dump(statistics, file)


if __name__ == "__main__":
    main()
