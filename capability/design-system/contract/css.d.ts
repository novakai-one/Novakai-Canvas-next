/** Local CSS assets are adapter resources; consumers enter through explicit React bindings. */
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}
declare module '*.css';
