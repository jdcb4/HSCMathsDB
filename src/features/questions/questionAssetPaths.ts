export function resolvePublicAssetPath(assetPath: string, baseUrl = import.meta.env.BASE_URL): string {
  if (/^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(assetPath) || assetPath.startsWith("data:")) {
    return assetPath;
  }

  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  if (assetPath.startsWith("/")) {
    return `${normalizedBase}${assetPath}`;
  }

  return `${normalizedBase}/${assetPath}`;
}
