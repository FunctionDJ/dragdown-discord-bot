// oxlint-disable no-continue

export const getFrameDisplay = ({
	totalDuration,
	totalActiveRanges,
	endLag,
	startup,
}: {
	totalDuration: number;
	totalActiveRanges: (number | { from: number; to: number })[] | null;
	endLag: number | string | null;
	startup: number | string | null;
}) => {
	if (typeof startup !== "number" || typeof endLag !== "number") {
		return null;
	}

	const squares: string[] = [];

	for (let index = 1; index <= totalDuration; index++) {
		if (index < startup) {
			squares.push(":green_square:");
			continue;
		}

		if (totalDuration - index > endLag) {
			squares.push(":blue_square:");
			continue;
		}

		if (
			totalActiveRanges !== null &&
			totalActiveRanges.some((range) => {
				if (typeof range === "number") {
					return range === index;
				}

				return index > range.from && index < range.to;
			})
		) {
			squares.push(":red_square:");
			continue;
		}

		squares.push(":black_large_square:");
	}
};
