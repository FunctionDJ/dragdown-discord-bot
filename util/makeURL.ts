export const makeURL = (
  endpoint: string,
  params: Record<string, string | number | null | undefined>
) => {
  const url = new URL(endpoint);

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url;
};
