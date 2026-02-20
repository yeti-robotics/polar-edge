const swc = require("unplugin-swc");

module.exports = (options) => ({
  ...options,
  mode: "production",
  optimization: {
    minimize: false,
  },
  // Bundle all dependencies — no node_modules needed in the runner.
  // Optional native modules from discord.js are excluded; it handles their absence gracefully.
  externals: ["zlib-sync", "bufferutil", "utf-8-validate", "@discordjs/opus", "erlpack"],
  module: {
    rules: [],
  },
  plugins: [
    ...(options.plugins ?? []),
    swc.default.webpack({
      jsc: {
        parser: {
          syntax: "typescript",
          decorators: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
      },
    }),
  ],
});
