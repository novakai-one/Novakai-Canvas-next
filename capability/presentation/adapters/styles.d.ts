/** CSS modules contain only scoped structural styles; visual decisions are supplied by resolved tokens. */
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}
