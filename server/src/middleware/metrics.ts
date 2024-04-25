import express_prom_bundle from 'express-prom-bundle';

const metricsMiddleware = express_prom_bundle({
  includeMethod: true,
  includePath: true,
  buckets: [0.001, 0.01, 0.1, 1, 2, 3, 5, 7, 10, 15, 20, 25, 30, 35, 40, 50, 70, 100, 200],
});

export default metricsMiddleware;
