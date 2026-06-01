const fs = require('fs');
let code = fs.readFileSync('extracted.jsx', 'utf8');
code = `import React, { useState, useEffect, useRef } from 'react';\nimport Chart from 'chart.js/auto';\nimport './index.css';\n\n` + code;
code = code.replace(/const root = ReactDOM\.createRoot\(document\.getElementById\('root'\)\);\nroot\.render\(<App \/>\);/g, 'export default App;');
fs.writeFileSync('src/App.jsx', code);
