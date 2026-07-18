const fs = require('fs');
let file = 'D:/techinside/molt-invest/src/app/(main)/agent/[id]/AgentClient.tsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Fix glassStyle to be transparent
c = c.replace(/const glassStyle = \{[\s\S]*?\};/, "const glassStyle = {\n    background: 'transparent',\n    border: 'none',\n    boxShadow: 'none'\n  };");

// 2. Fix text colors
c = c.replace(/color: '#fff'/g, "color: 'var(--text-primary)'");
c = c.replace(/color: 'rgba\\(255,255,255,0\\.85\\)'/g, "color: 'var(--text-secondary)'");
c = c.replace(/color: 'rgba\\(255,255,255,0\\.6\\)'/g, "color: 'var(--text-secondary)'");
c = c.replace(/color: 'rgba\\(255, 255, 255, 0\\.5\\)'/g, "color: 'var(--text-secondary)'");
c = c.replace(/color: 'rgba\\(255,255,255,0\\.5\\)'/g, "color: 'var(--text-secondary)'");
c = c.replace(/fill=\"rgba\\(255,255,255,0\\.9\\)\"/g, "fill=\"var(--text-secondary)\"");
c = c.replace(/fill: 'rgba\\(255,255,255,0\\.5\\)'/g, "fill: 'var(--text-secondary)'");
c = c.replace(/fill: '#fff'/g, "fill: 'var(--text-primary)'"); // except CustomizedContent has fill=\"#fff\" which we can keep for treemap texts
c = c.replace(/fill=\"#fff\"/g, "fill=\"#fff\""); // Keep this one for treemap

// 3. Fix borders
c = c.replace(/borderBottom: '1px solid rgba\\(255,255,255,0\\.1\\)'/g, "borderBottom: '1px solid var(--glass-border)'");
c = c.replace(/borderTop: '1px solid rgba\\(255,255,255,0\\.1\\)'/g, "borderTop: '1px solid var(--glass-border)'");
c = c.replace(/border: '1px solid rgba\\(255,255,255,0\\.1\\)'/g, "border: '1px solid var(--glass-border)'");
c = c.replace(/border: '1px solid rgba\\(255, 255, 255, 0\\.1\\)'/g, "border: '1px solid var(--glass-border)'");
c = c.replace(/borderColor: timeRange === tr \? 'rgba\\(255, 255, 255, 0\\.2\\)' : 'transparent'/g, "borderColor: timeRange === tr ? 'var(--text-primary)' : 'transparent'");

// 4. Fix backgrounds
c = c.replace(/background: 'rgba\\(0,0,0,0\\.2\\)'/g, "background: 'var(--glass-bg)'");
c = c.replace(/background: 'rgba\\(255, 255, 255, 0\\.1\\)'/g, "background: 'var(--glass-bg)'");
c = c.replace(/background: 'rgba\\(255,255,255,0\\.05\\)'/g, "background: 'var(--glass-bg)'");
c = c.replace(/background: 'rgba\\(0,0,0,0\\.05\\)'/g, "background: 'var(--glass-bg)'");

// 5. Fix Tooltips
c = c.replace(/contentStyle=\{\{[\s\S]*?\}\}/g, "contentStyle={{ background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-primary)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}");

// 6. Fix mainGradient to be a solid background or very subtle gradient using css vars
c = c.replace(/const mainGradient = [\s\S]*?;/, "const mainGradient = 'var(--bg-color)';");
c = c.replace(/background: mainGradient/g, "background: mainGradient");

// 7. Fix AreaChart grid
c = c.replace(/stroke=\"rgba\\(255,255,255,0\\.05\\)\"/g, "stroke=\"var(--glass-border)\"");

fs.writeFileSync(file, c);
console.log('done');
