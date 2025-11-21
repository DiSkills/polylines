import subprocess

import matplotlib.pyplot as plt
import seaborn as sns

from collections import defaultdict
from typing import Literal, TypeAlias

Implementation: TypeAlias = Literal["js", "rust", "wat"]


def get_algorithm_running_time(
    benchmark: str, implementation: Implementation,
    warmup_size: int, sample_size: int, length: int,
) -> float:
    result = subprocess.run(
        [
            "node", benchmark, implementation,
            str(warmup_size), str(sample_size), str(length),
        ],
        capture_output=True,
    )
    return float(result.stdout)


def collect(
    sample_size: int, warmup_size: int, lengths: list[int],
) -> dict[Implementation, list[float]]:
    data = defaultdict(list)
    for length in lengths:
        for implementation in "js", "wat", "rust":
            result = get_algorithm_running_time(
                "benchmark.js", implementation,
                warmup_size, sample_size, length,
            )
            data[implementation].append(result)
    return data


def main() -> None:
    lengths = [
        5, 10, 50, 100, 500, 1000, 5000,
        10000, 50000, 100000, 500000,
    ]
    sample_size = 33

    sns.set_theme(style="darkgrid")
    _, axs = plt.subplots(2)

    for i, warmup_size in enumerate([0, 500]):
        data = collect(sample_size, warmup_size, lengths)
        for implementation in data:
            sns.lineplot(
                x=lengths, y=data[implementation],
                label=implementation, ax=axs[i],
            )
            axs[i].set_title(f"Number of warm-up = {warmup_size}")
            axs[i].set_ylabel("Time (ms)")

    plt.show()


if __name__ == "__main__":
    main()
