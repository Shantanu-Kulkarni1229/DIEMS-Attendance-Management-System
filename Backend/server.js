require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const errorHandler = require('./utils/errorHandler');
const attendanceJob = require('./jobs/attendanceAlertJob');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(express.json());
app.use(cors());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// connect DB
connectDB();

app.get('/', (req, res) => res.send('DIEMS Attendance Backend')); 

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/timetable', timetableRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST', 'PATCH']
  }
});

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  socket.on('disconnect', () => console.log('socket disconnected', socket.id));
});

// expose io on app so controllers can emit
app.set('io', io);

// Dev-only debug endpoint to emit a leave:updated event
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/debug/emit-leave', (req, res) => {
    try {
      const payload = req.body || { _id: 'test-leave', student: req.body?.student || 'test-student', status: req.body?.status || 'approved' };
      const ioRef = app.get('io');
      ioRef.emit('leave:updated', payload);
      return res.json({ ok: true, emitted: payload });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  });
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // start cron jobs
  attendanceJob.start();
});
