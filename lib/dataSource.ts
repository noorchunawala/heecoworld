export function getDataSource(emirate: string) {
  switch (emirate.toLowerCase()) {
    case "dubai":
      return {
        authority: "KHDA",
        fullName: "Knowledge and Human Development Authority",
      };

    case "sharjah":
      return {
        authority: "SPEA",
        fullName: "Sharjah Private Education Authority",
      };

    case "abu dhabi":
      return {
        authority: "ADEK",
        fullName: "Abu Dhabi Department of Education and Knowledge",
      };

    default:
      return null;
  }
}