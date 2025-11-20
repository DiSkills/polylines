import subprocess
import sys

import matplotlib.pyplot as plt
import pandas as pd
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


def main() -> None:
    lengths = [
        5, 10, 50, 100, 500, 1000, 5000,
        10000, 50000, 100000, 500000,
    ]
    sample_size = 33

    warmup_size = int(sys.argv[1])
    data = defaultdict(list)
    for length in lengths:
        for implementation in "js", "wat", "rust":
            result = get_algorithm_running_time(
                "synthetic.js", implementation,
                warmup_size, sample_size, length,
            )
            data[implementation].append(result)
        print(length)

    sns.set_theme(style="darkgrid")

    df = pd.DataFrame(data)
    sns.lineplot(data=df)

    plt.title(f"Number of warm-up iterations = {warmup_size}")
    plt.xticks(range(len(lengths)), [str(l) for l in lengths])
    plt.ylabel("Time (ms)")

    plt.show()


if __name__ == "__main__":
    main()
