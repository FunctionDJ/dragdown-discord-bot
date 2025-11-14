export const ellipsis = (limit: number, text: string) => {
	if (text.length > limit - 3) {
		return `${text.slice(0, limit - 3)}...`;
	}

	return text;
};
