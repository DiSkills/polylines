import json
import sys

import matplotlib.pyplot as plt
import pandas as pd
import scikit_posthocs as sp
import seaborn as sns

from scipy import stats


def main() -> None:
    with open(sys.argv[1]) as file:
        statistics = json.load(file)

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
