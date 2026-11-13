'use strict';
// Servidor do Chinelos na Mira: serve o jogo e mantém as salas em tempo real.
// Sem dependências. Rode com: node server.js
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = +process.env.PORT || 3000, GRACE = 8000, MAX_PEERS = 50, MAX_ROOMS = 500;
const PAGE = path.join(__dirname, 'public', 'index.html');
const OK_ROOM = /^[a-z0-9-]{3,48}$/, OK_ID = /^[a-z0-9]{6,24}$/;
// CORS: permite o jogo estar em outro domínio (ex.: seu site) e o servidor aqui. Restrinja com ALLOWED_ORIGIN=https://seusite.com
const ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const cors = res => {
  res.setHeader('Access-Control-Allow-Origin', ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
};
const rooms = new Map(); // nome -> { peers: Map(id -> { p, res:Set, timer }) }

// Só campos conhecidos e valores válidos entram na presença de um jogador.
const FIELDS = {
  n: v => typeof v === 'string' ? v.slice(0, 14) : undefined,
  dur: v => [30, 45, 60, 90].includes(v) ? v : undefined,
  sp: v => [0.8, 1, 1.3].includes(v) ? v : undefined,
  s: v => Number.isFinite(v) && v >= 0 && v <= 100000 ? Math.floor(v) : undefined,
  go: v => Number.isInteger(v) && v >= 0 && v < 1e6 ? v : undefined,
  p: v => Number.isInteger(v) && v >= 0 && v < 1e6 ? v : undefined,
  f: v => Number.isInteger(v) && v >= 0 && v < 1e6 ? v : undefined,
  rd: v => typeof v === 'boolean' ? v : undefined
};
function merge(peer, patch) {
  for (const k of Object.keys(patch)) {
    if (!FIELDS[k]) continue;
    if (patch[k] === null) { delete peer.p[k]; continue; }
    const v = FIELDS[k](patch[k]);
    if (v !== undefined) peer.p[k] = v;
  }
}
function bcast(room) {
  const snap = JSON.stringify([...room.peers].map(([id, v]) => ({ id, p: v.p })));
  for (const v of room.peers.values()) for (const r of v.res) r.write('data: ' + snap + '\n\n');
}
function drop(name, room, id) {
  const v = room.peers.get(id);
  if (!v) return;
  clearTimeout(v.timer);
  room.peers.delete(id);
  if (!room.peers.size) rooms.delete(name); else bcast(room);
}
const reply = (res, code, body) => { res.writeHead(code); res.end(body); };

http.createServer((req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return reply(res, 204);
  const u = new URL(req.url, 'http://localhost'), name = u.searchParams.get('room') || '', id = u.searchParams.get('id') || '';
  if (req.method === 'GET' && (u.pathname === '/' || u.pathname === '/index.html')) {
    return fs.readFile(PAGE, (e, b) => {
      if (e) return reply(res, 500, 'index.html não encontrado');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(b);
    });
  }
  if (u.pathname === '/health') return reply(res, 200, 'ok');
  if (!OK_ROOM.test(name) || !OK_ID.test(id)) return reply(res, 400);

  if (req.method === 'GET' && u.pathname === '/events') {
    let room = rooms.get(name);
    if (!room) {
      if (rooms.size >= MAX_ROOMS) return reply(res, 503);
      room = { peers: new Map() };
      rooms.set(name, room);
    }
    let v = room.peers.get(id);
    if (!v) {
      if (room.peers.size >= MAX_PEERS) return reply(res, 429);
      v = { p: { t: Date.now() }, res: new Set(), timer: null }; // "t" vem do servidor: define quem é o criador da sala
      room.peers.set(id, v);
    }
    clearTimeout(v.timer);
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write('retry: 2000\n\n');
    v.res.add(res);
    bcast(room);
    const ka = setInterval(() => res.write(': ka\n\n'), 20000);
    req.on('close', () => {
      clearInterval(ka);
      v.res.delete(res);
      if (!v.res.size) v.timer = setTimeout(() => drop(name, room, id), GRACE);
    });
    return;
  }

  if (req.method === 'POST' && (u.pathname === '/send' || u.pathname === '/leave')) {
    const room = rooms.get(name), v = room && room.peers.get(id);
    if (!v) return reply(res, 404);
    if (u.pathname === '/leave') { drop(name, room, id); return reply(res, 204); }
    let b = '';
    req.on('data', c => { b += c; if (b.length > 2048) req.destroy(); });
    req.on('end', () => {
      try {
        const o = JSON.parse(b);
        if (o && typeof o === 'object') { merge(v, o); bcast(room); }
      } catch (_) {}
      reply(res, 204);
    });
    return;
  }
  reply(res, 404);
}).listen(PORT, '0.0.0.0', () => console.log('Chinelos na Mira em http://localhost:' + PORT));
