// Webpack optimization configuration for better performance
// Add this to your webpack.config.js or create-react-app config

const path = require('path');

module.exports = {
  // Code splitting optimization
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor libraries
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        // Keen Slider specific chunk
        keenSlider: {
          test: /[\\/]node_modules[\\/]keen-slider[\\/]/,
          name: 'keen-slider',
          chunks: 'all',
          priority: 15,
        },
        // React specific chunk
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20,
        },
        // Common components
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
    // Runtime chunk for better caching
    runtimeChunk: {
      name: 'runtime',
    },
  },

  // Performance budgets
  performance: {
    maxAssetSize: 250000, // 250kb
    maxEntrypointSize: 250000, // 250kb
    hints: 'warning',
  },

  // Module resolution optimization
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@pages': path.resolve(__dirname, 'src/Pages'),
      '@functions': path.resolve(__dirname, 'src/functions'),
      '@styles': path.resolve(__dirname, 'src/styles'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    // Reduce module resolution time
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
  },

  // Module rules for optimization
  module: {
    rules: [
      // Image optimization
      {
        test: /\.(png|jpe?g|gif|webp)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024, // 8kb
          },
        },
        generator: {
          filename: 'images/[name].[hash][ext]',
        },
      },
      // Font optimization
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[hash][ext]',
        },
      },
      // CSS optimization
      {
        test: /\.css$/i,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                auto: true,
                localIdentName: '[name]__[local]--[hash:base64:5]',
              },
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  'autoprefixer',
                  'cssnano',
                ],
              },
            },
          },
        ],
      },
    ],
  },

  // Plugins for optimization
  plugins: [
    // Bundle analyzer (uncomment for analysis)
    // new (require('webpack-bundle-analyzer').BundleAnalyzerPlugin)(),
    
    // Compression plugin
    new (require('compression-webpack-plugin'))({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8,
    }),
  ],
};

// For Create React App users, use CRACO or react-app-rewired
// Example craco.config.js:
/*
const { whenProd } = require('@craco/craco');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Apply optimizations from above
      if (process.env.NODE_ENV === 'production') {
        // Add production optimizations
        webpackConfig.optimization.splitChunks = {
          // ... copy splitChunks config from above
        };
      }
      return webpackConfig;
    },
  },
  plugins: [
    {
      plugin: require('craco-bundle-analyzer'),
      options: {
        analyzerMode: 'server',
        openAnalyzer: false,
      },
    },
  ],
};
*/
