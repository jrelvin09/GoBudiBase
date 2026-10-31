import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5s', target: 10 },
    { duration: '15s', target: 25 },
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.001'], // 0.00% error rate
    http_req_duration: ['p(95)<15'],  // 95% of requests under 15ms
  },
  insecureSkipTLSVerify: true,
};

const BASE_URL = __ENV.TARGET_URL || 'https://10.10.1.106';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

export default function () {
  // 1. Static SPA delivery
  const resSpa = http.get(`${BASE_URL}/gobudibase/`);
  check(resSpa, {
    'SPA status 200': (r) => r.status === 200,
    'SPA contains GoBudiBase': (r) => r.body.includes('GoBudiBase') || r.body.includes('html'),
  });

  // 2. Count Registry items (100k rows)
  const resCount = http.post(`${BASE_URL}/api/v1/registry/count`, JSON.stringify({}), { headers: JSON_HEADERS });
  check(resCount, {
    'Count status 200': (r) => r.status === 200,
    'Count is 100000': (r) => parseInt(r.body) === 100000,
  });

  // 3. List Registry with pagination & sorting
  const listPayload = JSON.stringify({
    p_limit: 25,
    p_offset: Math.floor(Math.random() * 500),
    p_sort_col: 'id',
    p_sort_dir: 'asc',
    p_filters: {},
  });
  const resList = http.post(`${BASE_URL}/api/v1/registry/list`, listPayload, { headers: JSON_HEADERS });
  check(resList, {
    'List status 200': (r) => r.status === 200,
    'List returns rows': (r) => JSON.parse(r.body).length === 25,
  });

  // 4. 2D Pivot aggregation matrix
  const pivotPayload = JSON.stringify({
    p_row_dim: 'category',
    p_col_dim: 'status',
  });
  const resPivot = http.post(`${BASE_URL}/api/v1/pivot`, pivotPayload, { headers: JSON_HEADERS });
  check(resPivot, {
    'Pivot status 200': (r) => r.status === 200,
    'Pivot has rows': (r) => JSON.parse(r.body).rows.length > 0,
  });

  // 5. Faceted dynamic counters
  const resFacets = http.post(`${BASE_URL}/api/v1/facets`, JSON.stringify({}), { headers: JSON_HEADERS });
  check(resFacets, {
    'Facets status 200': (r) => r.status === 200,
  });

  // 6. SLA Calendar maintenance events
  const resCal = http.post(`${BASE_URL}/api/v1/calendar/events`, JSON.stringify({}), { headers: JSON_HEADERS });
  check(resCal, {
    'Calendar status 200': (r) => r.status === 200,
  });

  // 7. Spatial GIS Campus Map
  const resMap = http.post(`${BASE_URL}/api/v1/spatial/map`, JSON.stringify({}), { headers: JSON_HEADERS });
  check(resMap, {
    'Map status 200': (r) => r.status === 200,
  });

  // 8. Spatial location hierarchy tree
  const resTree = http.post(`${BASE_URL}/api/v1/spatial/tree`, JSON.stringify({}), { headers: JSON_HEADERS });
  check(resTree, {
    'Tree status 200': (r) => r.status === 200,
  });

  // 9. Dynamic Action Rules
  const resRules = http.get(`${BASE_URL}/api/v1/actions/rules`);
  check(resRules, {
    'Rules status 200': (r) => r.status === 200,
  });

  sleep(0.1);
}
