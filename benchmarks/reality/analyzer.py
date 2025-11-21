import json
import random
import subprocess
import sys

import matplotlib.pyplot as plt
import pandas as pd
import scikit_posthocs as sp
import seaborn as sns

from collections import defaultdict
from typing import Literal, TypeAlias

from scipy import stats

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
    sample_size: int, benchmark: str, filename: str,
    implementations: list[Implementation], warmup_size: int,
) -> dict[Implementation, list[float]]:
    statistics = defaultdict(list)
    for _ in range(sample_size):
        shuffle_data_file(filename)
        for implementation in implementations:
            time = get_algorithm_running_time(
                benchmark, implementation, str(warmup_size),
            )
            statistics[implementation].append(time)
    return statistics


def main() -> None:
    sample_size = int(sys.argv[1])
    warmup_size = int(sys.argv[2])

    statistics = collect_statistics(
        sample_size, "benchmark.js", "geopuzzle.json",
        ["js", "wat", "rust"], warmup_size,
    )

    df = pd.DataFrame(statistics)
    print(df.describe())

    sns.set_theme(style="darkgrid")
    _, (ax1, ax2) = plt.subplots(1, 2)

    sns.boxplot(data=df, ax=ax1)
    sns.swarmplot(data=df, color="grey", ax=ax1)
    ax1.set_title("Boxplots")
    ax1.set_ylabel("Time (ms)")

    sns.histplot(data=df, ax=ax2, kde=True)
    ax2.set_title("Histograms")
    ax2.set_xlabel("Time (ms)")

    p = stats.friedmanchisquare(*statistics.values()).pvalue
    if p >= 0.05:
        return
    print(f"Implementations are not the same, Friedman p = {p}")

    print("Nemeny:")
    print(sp.posthoc_nemenyi_friedman(df))

    # manager = plt.get_current_fig_manager()
    # manager.window.showMaximized()
    plt.show()


if __name__ == "__main__":
    main()
