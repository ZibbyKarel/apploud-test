import { getRequestConfig } from "next-intl/server";

/**
 * App is Czech-only, so the locale is static. If more locales were ever needed,
 * this is the single place to resolve it (cookie/header/user setting).
 */
export default getRequestConfig(async () => {
  const locale = "cs";

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
