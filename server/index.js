import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { nanoid } from "nanoid";
const app = express();
app.use(cors({ origin: "*" }));
app.get("/", (_req, res) => res.send("Ludo Multiplayer Server OK"));
app.get("/health", (_req, res) => res.json({ ok: true }));
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET","POST"] } });
const PORT = process.env.PORT || 3001;
const ROOMS = new Map();
const COLORS = ["red","green","yellow","blue"];
const PATH_LEN = 52;
const START_INDEX = { red:0, green:13, yellow:26, blue:39 };
function createRoom(ownerSocketId){ const code=(Math.random().toString(36).slice(2,8)).toUpperCase(); const room={ code, ownerSocketId, status:"lobby", players:[], turnIndex:0, state:null }; ROOMS.set(code, room); return room; }
function findAvailableColor(players){ for(const c of COLORS){ if(!players.some(p=>p.color===c)) return c; } return null; }
function createGameState(players){ const tokens={}; for(const p of players){ tokens[p.id]={ pos:-1, laps:0 }; } return { tokens, lastRoll:null, winner:null }; }
function nextTurn(room){ room.turnIndex=(room.turnIndex+1)%room.players.length; }
function currentPlayer(room){ return room.players[room.turnIndex]; }
function rollDice(){ return 1+Math.floor(Math.random()*6); }
io.on("connection",(socket)=>{
  socket.on("room:create",({name},cb)=>{ const room=createRoom(socket.id); const color=findAvailableColor(room.players)||"red"; const player={ id:socket.id.slice(-8), name:name?.trim()||"Player", color, socketId:socket.id }; room.players.push(player); socket.join(room.code); io.to(room.code).emit("room:update", roomPublic(room)); cb?.({ ok:true, room:roomPublic(room), you:player }); });
  socket.on("room:join",({code,name},cb)=>{ const room=ROOMS.get(code?.toUpperCase()); if(!room) return cb?.({ ok:false, error:"Room not found" }); if(room.status!=="lobby") return cb?.({ ok:false, error:"Game already started" }); if(room.players.length>=4) return cb?.({ ok:false, error:"Room full (max 4)" }); const color=findAvailableColor(room.players); if(!color) return cb?.({ ok:false, error:"No colors left" }); const player={ id:socket.id.slice(-8), name:name?.trim()||"Player", color, socketId:socket.id }; room.players.push(player); socket.join(room.code); io.to(room.code).emit("room:update", roomPublic(room)); cb?.({ ok:true, room:roomPublic(room), you:player }); });
  socket.on("game:start",({code},cb)=>{ const room=ROOMS.get(code?.toUpperCase()); if(!room) return cb?.({ ok:false, error:"Room not found" }); if(room.status!=="lobby") return cb?.({ ok:false, error:"Already started" }); if(room.players.length<2) return cb?.({ ok:false, error:"Need at least 2 players" }); room.status="playing"; room.turnIndex=0; room.state=createGameState(room.players); io.to(room.code).emit("game:state", gamePublic(room)); cb?.({ ok:true }); });
  socket.on("game:roll",({code},cb)=>{ const room=ROOMS.get(code?.toUpperCase()); if(!room||room.status!=="playing") return cb?.({ ok:false, error:"Game not active" }); const you=room.players.find(p=>p.socketId===socket.id); if(!you) return cb?.({ ok:false, error:"Not in room" }); if(currentPlayer(room).id!==you.id) return cb?.({ ok:false, error:"Not your turn" }); const n=rollDice(); room.state.lastRoll={ by:you.id, n, ts:Date.now() }; const t=room.state.tokens[you.id]; const start=START_INDEX[you.color]; if(t.pos===-1){ if(n===6){ t.pos=start; } } else { const prev=t.pos; const next=(t.pos+n)%PATH_LEN; const wrapped=prev>next; if(wrapped) t.laps+=1; t.pos=next; for(const p of room.players){ if(p.id===you.id) continue; const ot=room.state.tokens[p.id]; if(ot&&ot.pos===t.pos){ ot.pos=-1; ot.laps=0; } } if(t.laps>=1 && t.pos===start){ room.state.winner=you.id; room.status="finished"; } } io.to(room.code).emit("game:state", gamePublic(room)); if(room.status!=="finished"){ if(n!==6) nextTurn(room); io.to(room.code).emit("room:update", roomPublic(room)); } else { io.to(room.code).emit("room:update", roomPublic(room)); } cb?.({ ok:true, roll:n }); });
  socket.on("disconnect",()=>{ for(const [code,room] of ROOMS){ const idx=room.players.findIndex(p=>p.socketId===socket.id); if(idx!==-1){ room.players.splice(idx,1); io.to(code).emit("room:update", roomPublic(room)); if(room.players.length===0){ ROOMS.delete(code); } else { room.turnIndex=room.turnIndex % Math.max(room.players.length,1); if(room.status==="playing"){ io.to(code).emit("game:state", gamePublic(room)); } } } } }); });
function roomPublic(room){ return { code:room.code, status:room.status, players:room.players.map(p=>({id:p.id,name:p.name,color:p.color})), turnIndex:room.turnIndex }; }
function gamePublic(room){ return { code:room.code, status:room.status, players:room.players.map(p=>({id:p.id,name:p.name,color:p.color})), turnIndex:room.turnIndex, state:room.state }; }
server.listen(PORT, ()=> console.log("Server listening on :"+PORT) );
