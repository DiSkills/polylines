import json
import sys

import numpy as np

from itertools import combinations

from pandas import DataFrame
from scikit_posthocs import posthoc_nemenyi_friedman
from scipy import stats
from statsmodels.stats.multitest import multipletests


def wilcoxon(df: DataFrame) -> None:
    pairs, pvals = [], []
    for im1, im2 in combinations(df.columns, 2):
        _, p = stats.wilcoxon(df[im1], df[im2])
        pairs.append((im1, im2))
        pvals.append(p)
    _, pvals_corrected, *_ = multipletests(pvals, method="holm")

    res, res_corrected = [], []
    for _ in range(len(df.columns)):
        res.append([1] * len(df.columns))
        res_corrected.append([1] * len(df.columns))

    indexes = {item: i for i, item in enumerate(df.columns)}
    for (im1, im2), p, p_corrected in zip(pairs, pvals, pvals_corrected):
        i1, i2 = indexes[im1], indexes[im2]

        res[i1][i2] = res[i2][i1] = p
        res_corrected[i1][i2] = res_corrected[i2][i1] = p_corrected

    w = DataFrame(res, index=df.columns, columns=df.columns)
    print("\nWilcoxon:", w, sep='\n')

    w = DataFrame(res_corrected, index=df.columns, columns=df.columns)
    print("\nWilcoxon-Holm:", w, sep='\n')


def winsorize(
    statistics: dict[str, list[float]], limits: list[float],
) -> None:
    for k, v in statistics.items():
        data = np.array(v)
        statistics[k] = stats.mstats.winsorize(data, limits=limits)


def main() -> None:
    filename = sys.argv[1]

    with open(filename) as file:
        statistics = json.load(file)

    winsorization = input("Do you need data winsorization? [y/n] ")
    if winsorization == "y":
        limits = [float(i) for i in input("Limits: ").split()]
        winsorize(statistics, limits)

    df = DataFrame(statistics)
    print("Statistics:", df.describe(), sep='\n')

    p = stats.friedmanchisquare(*statistics.values()).pvalue
    print("=" * 50)
    print(f"Friedman p = {p}")
    print("=" * 50)
    if p >= 0.05:
        return
    print("\nNemenyi:", posthoc_nemenyi_friedman(df), sep='\n')
    wilcoxon(df)


if __name__ == "__main__":
    main()
