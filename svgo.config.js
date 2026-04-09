export default {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          cleanupNumericValues: { floatPrecision: 1 },
          convertPathData: { floatPrecision: 1 },
          convertTransform: { floatPrecision: 1 },
        },
      },
    },
  ],
}
