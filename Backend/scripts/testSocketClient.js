const { io } = require('socket.io-client');

const SERVER = process.env.SOCKET_URL || 'http://localhost:5000';
console.log('connecting to', SERVER);
const socket = io(SERVER, { transports: ['websocket', 'polling'] });

socket.on('connect', () => console.log('connected', socket.id));
socket.on('leave:updated', (payload) => console.log('received leave:updated', payload));
socket.on('disconnect', () => console.log('disconnected'));

// keep process alive
process.stdin.resume();
