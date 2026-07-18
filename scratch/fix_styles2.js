const fs = require('fs');
let file = 'D:/techinside/molt-invest/src/app/(main)/agent/[id]/AgentClient.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/color:\s*['"]#fff['"]/g, "color: 'var(--text-primary)'");
c = c.replace(/color:\s*['"]rgba\(255,\s*255,\s*255,\s*[0-9.]+\)['"]/g, "color: 'var(--text-secondary)'");
c = c.replace(/fill:\s*['"]rgba\(255,\s*255,\s*255,\s*[0-9.]+\)['"]/g, "fill: 'var(--text-secondary)'");
c = c.replace(/borderBottom:\s*['"]1px solid rgba\(255,\s*255,\s*255,\s*[0-9.]+\)['"]/g, "borderBottom: '1px solid var(--glass-border)'");
c = c.replace(/borderTop:\s*['"]1px solid rgba\(255,\s*255,\s*255,\s*[0-9.]+\)['"]/g, "borderTop: '1px solid var(--glass-border)'");
c = c.replace(/border:\s*['"]1px solid rgba\(255,\s*255,\s*255,\s*[0-9.]+\)['"]/g, "border: '1px solid var(--glass-border)'");
c = c.replace(/background:\s*['"]rgba\(0,\s*0,\s*0,\s*[0-9.]+\)['"]/g, "background: 'var(--glass-bg)'");
c = c.replace(/background:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.05\)['"]/g, "background: 'var(--glass-bg)'");

fs.writeFileSync(file, c);
console.log('done2');
