export const VERSION = __APP_VERSION__;
export const COMMIT = __COMMIT__;
export const BUILD_TIME = new Date(__BUILD_TIME__).toLocaleString('de-DE', {
  dateStyle: 'medium',
  timeStyle: 'short',
});
